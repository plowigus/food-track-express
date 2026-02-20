import { db, orders, products } from "@/packages/database/src";
import { inArray, desc } from "drizzle-orm";
import { KitchenStream } from "../components/KitchenStream";
import { InventoryManager } from "../components/InventoryManager";
import { DailyReportButton } from "../components/DailyReportButton";
import { PosModal } from "../components/PosModal";

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

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todaysOrders = await db.query.orders.findMany({
        where: inArray(orders.status, ["PAID", "PREPARING", "READY", "COMPLETED"]),
    });

    const validTodaysOrders = todaysOrders.filter(o => o.createdAt >= startOfDay);

    const todayOrderCount = validTodaysOrders.length;
    const todayRevenueInCents = validTodaysOrders.reduce((sum, order) => sum + order.totalAmountInCents, 0);

    const allProducts = await db.query.products.findMany({
        orderBy: desc(products.name)
    });

    return (
        <main className="min-h-screen bg-zinc-950 text-zinc-50 font-sans p-6 md:p-12">
            <div className="max-w-[1600px] mx-auto">
                {/* HUD BAR */}
                <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-800 pb-6 rounded-2xl bg-zinc-900/30 p-6">
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter text-white">
                            Dashboard <span className="text-lime-400">Kuchni</span>
                        </h1>
                        <p className="text-zinc-500 mt-2 font-mono text-sm tracking-widest flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            CHEMBURGER /// SYSTEM LIVE
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-6">
                        <div className="flex flex-col">
                            <span className="text-zinc-500 text-xs font-mono uppercase tracking-widest mb-1">Dziś Zamówień</span>
                            <span className="text-3xl font-black text-white">{todayOrderCount}</span>
                        </div>
                        <div className="w-px h-12 bg-zinc-800 hidden md:block" />
                        <div className="flex flex-col">
                            <span className="text-zinc-500 text-xs font-mono uppercase tracking-widest mb-1">Dzisiejszy Obrót</span>
                            <span className="text-3xl font-black text-lime-400">{(todayRevenueInCents / 100).toFixed(2)} zł</span>
                        </div>

                        <div className="w-px h-12 bg-zinc-800 hidden md:block" />
                        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
                            <PosModal products={allProducts} />
                            <DailyReportButton />
                            <InventoryManager initialProducts={allProducts} />
                        </div>
                    </div>
                </header>

                <KitchenStream initialOrders={initialOrders} />
            </div>
        </main>
    );
}
