"use server";

import { db, orders, orderItems } from "@/packages/database/src";
import { inArray } from "drizzle-orm";

export async function generateDailyReportText(): Promise<{ success: boolean; data?: string; reportData?: any; error?: string }> {
    try {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        // Fetch all relevant orders for today
        const todaysOrders = await db.query.orders.findMany({
            where: inArray(orders.status, ["PAID", "PREPARING", "READY", "COMPLETED"]),
        });

        // Filter purely to today based on JS Date (to match the timezone logic of the server)
        const validTodaysOrders = todaysOrders.filter(o => o.createdAt >= startOfDay);

        if (validTodaysOrders.length === 0) {
            return { success: false, error: "Brak zamówień z dzisiejszego dnia." };
        }

        const todayOrderCount = validTodaysOrders.length;
        const todayRevenueInCents = validTodaysOrders.reduce((sum, order) => sum + order.totalAmountInCents, 0);
        const todayRevenuePln = (todayRevenueInCents / 100).toFixed(2);

        // Get all items for these orders to calculate product quantities
        const orderIds = validTodaysOrders.map(o => o.id);

        // Fetch items with their related products
        const items = await db.query.orderItems.findMany({
            where: inArray(orderItems.orderId, orderIds),
            with: {
                product: true
            }
        });

        // Aggregate quantities by product name
        const productCounts = new Map<string, number>();

        for (const item of items) {
            const productName = item.product?.name || "Nieznany Produkt";
            const currentCount = productCounts.get(productName) || 0;
            productCounts.set(productName, currentCount + item.quantity);
        }

        // Sort products alphabetically or by volume (let's do volume descending)
        const sortedProducts = Array.from(productCounts.entries()).sort((a, b) => b[1] - a[1]);

        // Build the text string
        const dateStr = startOfDay.toISOString().split('T')[0];

        let reportText = `🍔 RAPORT ZAMKNIĘCIA DNIA\nData: ${dateStr}\n\n`;
        reportText += `Utarg całkowity: ${todayRevenuePln} zł\n`;
        reportText += `Liczba zamówień: ${todayOrderCount}\n\n`;
        reportText += `SPRZEDAŻ:\n`;

        for (const [name, qty] of sortedProducts) {
            reportText += `- ${name}: ${qty} szt.\n`;
        }

        const reportData = {
            date: dateStr,
            revenuePln: todayRevenuePln,
            orderCount: todayOrderCount,
            items: sortedProducts.map(([name, qty]) => ({ name, qty }))
        };

        return { success: true, data: reportText, reportData };

    } catch (error) {
        console.error("Error generating daily report:", error);
        return { success: false, error: "Wystąpił błąd podczas generowania raportu." };
    }
}
