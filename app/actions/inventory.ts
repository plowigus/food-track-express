"use server";

import { db, products } from "@/packages/database/src";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function toggleProductAvailability(productId: string, currentStatus: boolean) {
    try {
        await db.update(products)
            .set({ isAvailable: !currentStatus })
            .where(eq(products.id, productId));

        // Revalidate the routes so the menu updates instantly for customers
        // and the kitchen dashboard updates instantly.
        revalidatePath("/");
        revalidatePath("/kitchen");

        return { success: true };
    } catch (error) {
        console.error("Error toggling product availability:", error);
        return { success: false, error: "Failed to update product availability." };
    }
}
