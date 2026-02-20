"use server";

import { revalidatePath } from "next/cache";
import { db, products } from "@/packages/database/src";
import { MENU_ITEMS } from "@/app/constants/menu";

export async function seedDummyProducts() {
    if (process.env.NODE_ENV !== "development") {
        throw new Error("Seed action is only allowed in development.");
    }

    // Insert Chemik Burger exactly as defined in the hardcoded constants
    await db.delete(products);

    await db.insert(products).values(
        MENU_ITEMS.map((item) => ({
            id: item.id, // Keep the exact UUIDs so they tie into the UI actions securely
            name: item.name,
            description: item.description,
            priceInCents: item.priceInCents,
            isAvailable: true,
        }))
    );

    revalidatePath("/");

    return { success: true, message: "Baza danych została zresetowana odpowiednimi UUID!" };
}
