"use server";

import { z } from "zod";
import { db, products, orders, orderItems } from "@/packages/database/src";
import { inArray } from "drizzle-orm";

const CheckoutSchema = z.object({
    firstName: z.string().min(2, "Imię musi mieć co najmniej 2 znaki"),
    email: z.string().email("Nieprawidłowy adres e-mail"),
    items: z.array(
        z.object({
            id: z.string().uuid("Invalid product ID"),
            quantity: z.number().int().min(1, "Quantity must be at least 1"),
        })
    ).min(1, "Koszyk nie może być pusty"),
});

type CheckoutInput = z.infer<typeof CheckoutSchema>;

export async function checkout(input: CheckoutInput) {
    try {
        // 1. Validate Input
        const validatedData = CheckoutSchema.parse(input);
        const itemIds = validatedData.items.map((i) => i.id);

        // 2. Fetch ground-truth prices from the DB
        const dbProducts = await db
            .select({ id: products.id, priceInCents: products.priceInCents })
            .from(products)
            .where(inArray(products.id, itemIds));

        // Create a fast lookup map
        const productMap = new Map<string, number>(
            dbProducts.map((p) => [p.id, p.priceInCents])
        );

        // 3. Calculate True Total
        let totalAmountInCents = 0;
        const validatedOrderItems = validatedData.items.map((item) => {
            const priceAtTime = productMap.get(item.id);
            if (!priceAtTime) throw new Error(`Product ${item.id} not found.`);

            totalAmountInCents += priceAtTime * item.quantity;

            return {
                productId: item.id,
                quantity: item.quantity,
                priceAtTimeInCents: priceAtTime,
            };
        });

        if (totalAmountInCents === 0) throw new Error("Total must be greater than 0");

        // 4. Create Order in DB
        const [newOrder] = await db.insert(orders).values({
            status: "PENDING_PAYMENT",
            totalAmountInCents,
        }).returning();

        // 5. Insert Order Items
        await db.insert(orderItems).values(
            validatedOrderItems.map((i) => ({
                ...i,
                orderId: newOrder.id,
            }))
        );

        // 6. Connect to PayU REST API
        const payuClientId = process.env.PAYU_CLIENT_ID;
        const payuClientSecret = process.env.PAYU_CLIENT_SECRET;
        const payuPosId = process.env.PAYU_POS_ID;
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

        if (!payuClientId || !payuClientSecret || !payuPosId) {
            console.error("Missing PayU Environment variables");
            throw new Error("Błąd konfiguracji płatności.");
        }

        // 6A. Get Access Token
        const tokenRes = await fetch("https://secure.snd.payu.com/pl/standard/user/oauth/authorize", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                grant_type: "client_credentials",
                client_id: payuClientId,
                client_secret: payuClientSecret,
            }).toString(),
            cache: "no-store",
        });

        if (!tokenRes.ok) {
            const errText = await tokenRes.text();
            throw new Error("Auth with PayU failed: " + errText);
        }

        const tokenText = await tokenRes.text();
        let access_token = "";
        try {
            const parsed = JSON.parse(tokenText);
            access_token = parsed.access_token;
        } catch (e) {
            console.error("Failed to parse token response:", tokenText);
            throw new Error("Invalid JSON from PayU Auth API");
        }

        // 6B. Create PayU Order

        const payuOrderRes = await fetch("https://secure.snd.payu.com/api/v2_1/orders", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${access_token}`,
            },
            body: JSON.stringify({
                notifyUrl: `${baseUrl}/api/webhooks/payu`,
                customerIp: "127.0.0.1", // Needed by PayU, in prod you'd get real IP
                merchantPosId: payuPosId,
                description: `Zamówienie Chemik Burger: ${validatedData.firstName}`,
                currencyCode: "PLN",
                totalAmount: totalAmountInCents.toString(),
                extOrderId: newOrder.id, // Tie PayU to our DB strictly
                buyer: {
                    email: validatedData.email,
                    firstName: validatedData.firstName,
                    language: "pl",
                },
                products: validatedData.items.map(item => ({
                    name: "Produkt z Menu Chemik Burger",
                    unitPrice: productMap.get(item.id)?.toString() || "0",
                    quantity: item.quantity.toString()
                }))
            }),
            cache: "no-store",
            redirect: "manual",
        });

        // If it's a 302 redirect, extract the URL from the Location header
        if (payuOrderRes.status === 302 || payuOrderRes.status === 303) {
            const redirectUri = payuOrderRes.headers.get("location");
            if (redirectUri) {
                return { success: true, redirectUri };
            }
            throw new Error("PayU returned redirect status but no Location header");
        }

        if (!payuOrderRes.ok) {
            const errJson = await payuOrderRes.text();
            console.error("PayU Order Error", errJson);
            throw new Error("Failed to create PayU Order");
        }

        const orderText = await payuOrderRes.text();
        let payuData: any;
        try {
            payuData = JSON.parse(orderText);
        } catch (e) {
            console.error("Failed to parse order response:", orderText);
            throw new Error("Invalid JSON from PayU Order API");
        }

        return {
            success: true,
            redirectUri: payuData.redirectUri as string
        };

    } catch (err) {
        console.error("Checkout action error: ", err);
        return {
            success: false,
            error: err instanceof Error ? err.message : "Wystąpił nieznany błąd podczas płatności.",
        };
    }
}
