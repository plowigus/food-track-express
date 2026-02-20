"use server";

import { db, orders, orderItems, products } from "@/packages/database/src";
import { inArray, gte, max } from "drizzle-orm";
import { z } from "zod";

const createCashOrderSchema = z.object({
    items: z.array(
        z.object({
            productId: z.string().uuid(),
            quantity: z.number().int().positive(),
        })
    ).min(1, "Zamówienie musi zawierać co najmniej jeden produkt"),
});

export async function createCashOrder(inputItems: { productId: string, quantity: number }[]): Promise<{ success: boolean; dailyOrderNumber?: number; error?: string }> {
    try {
        // 1. Zod Validation
        const result = createCashOrderSchema.safeParse({ items: inputItems });
        if (!result.success) {
            return { success: false, error: "Nieprawidłowe dane zamówienia." };
        }

        const validItems = result.data.items;
        const productIds = validItems.map(item => item.productId);

        // 2. Fetch Live Prices securely from DB
        const dbProducts = await db.query.products.findMany({
            where: inArray(products.id, productIds),
        });

        if (dbProducts.length !== productIds.length) {
            return { success: false, error: "Jeden lub więcej produktów nie istnieje lub jest niedostępny." };
        }

        // 3. Calculate Accurate Total
        let totalAmountInCents = 0;
        const productsMap = new Map(dbProducts.map(p => [p.id, p]));

        const itemsToInsert = validItems.map(item => {
            const product = productsMap.get(item.productId);
            if (!product) throw new Error("Product mismatch");

            const itemTotal = product.priceInCents * item.quantity;
            totalAmountInCents += itemTotal;

            return {
                productId: item.productId,
                quantity: item.quantity,
                priceAtTimeInCents: product.priceInCents,
            };
        });

        // 4. Calculate dailyOrderNumber
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const maxDailyResult = await db
            .select({ maxValue: max(orders.dailyOrderNumber) })
            .from(orders)
            .where(gte(orders.createdAt, startOfDay));

        const maxDaily = maxDailyResult[0]?.maxValue ?? 0;
        const newDailyOrderNumber = maxDaily + 1;

        // 5. Insert the Cash Order
        // Bypass PENDING_PAYMENT, it is already PAID in cash at the counter.
        const [newOrder] = await db.insert(orders).values({
            dailyOrderNumber: newDailyOrderNumber,
            status: "PAID",
            paymentProviderId: "CASH",
            totalAmountInCents,
        }).returning();

        // 6. Insert Order Items
        const insertItems = itemsToInsert.map(item => ({
            ...item,
            orderId: newOrder.id,
        }));

        await db.insert(orderItems).values(insertItems);

        return { success: true, dailyOrderNumber: newDailyOrderNumber };
    } catch (error) {
        console.error("Failed to create cash order:", error);
        return { success: false, error: "Wystąpił błąd po stronie serwera." };
    }
}
