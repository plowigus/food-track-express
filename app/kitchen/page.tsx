import { db, orders } from "@/packages/database/src";
import { inArray, desc } from "drizzle-orm";
import { KitchenStream } from "../components/KitchenStream";

export const dynamic = "force-dynamic";

export default async function KitchenPage() {
    // 1. Fetch initial state for the Kitchen Dashboard Server Component
    const initialOrders = await db.query.orders.findMany({
        where: inArray(orders.status, ["PAID", "PREPARING", "READY"]),
        orderBy: [desc(orders.createdAt)],
        with: {
            items: {
                with: {
                    product: true,
                },
            },
        },
    });

    return (
        <main className="min-h-screen bg-zinc-950 text-zinc-50 font-sans p-6 md:p-12">
            <div className="max-w-[1600px] mx-auto">
                <header className="mb-12 flex items-end justify-between border-b border-zinc-800 pb-6">
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter text-white">
                            Dashboard <span className="text-lime-400">Kuchni</span>
                        </h1>
                        <p className="text-zinc-500 mt-2 font-mono text-sm tracking-widest">
                            CHEMIK BURGER /// SYSTEM LIVE
                        </p>
                    </div>
                </header>

                <KitchenStream initialOrders={initialOrders} />
            </div>
        </main>
    );
}
