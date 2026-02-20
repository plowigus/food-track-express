"use server";

import { db, orders } from "@/packages/database/src";
import { eq } from "drizzle-orm";

export async function updateOrderStatus(orderId: string, nextStatus: "PREPARING" | "READY" | "COMPLETED") {
    try {
        await db.update(orders)
            .set({ status: nextStatus })
            .where(eq(orders.id, orderId));

        return { success: true };
    } catch (error) {
        console.error("Error updating order status:", error);
        return { success: false, error: "Failed to update order status." };
    }
}
