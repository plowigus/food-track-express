import { db, orders, orderItems, products } from "@/packages/database/src";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { OrderPoller } from "@/app/components/OrderPoller";

type PageProps = {
    params: Promise<{ id: string }>;
};

// Map database order status to Polish UI Text
const statusMap: Record<string, { label: string, color: string, icon: string }> = {
    'PENDING_PAYMENT': { label: "Oczekuje na płatność...", color: "text-zinc-400", icon: "⏳" },
    'PAID': { label: "Zapłacono! Oczekuje na akceptację kuchni.", color: "text-blue-400", icon: "💰" },
    'PREPARING': { label: "W przygotowaniu...", color: "text-orange-400", icon: "🔥" },
    'READY': { label: "Gotowe do odbioru!", color: "text-lime-400", icon: "🛍️" },
    'COMPLETED': { label: "Zamówienie zrealizowane", color: "text-emerald-500", icon: "✅" },
    'CANCELLED': { label: "Zamówienie Anulowane", color: "text-red-500", icon: "❌" },
};

export default async function OrderStatusPage({ params }: PageProps) {
    const { id } = await params;

    // 1. Fetch Order Record
    const orderQuery = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    const order = orderQuery[0];

    if (!order) {
        notFound();
    }

    // 2. Resolve Visuals based on the returned string status
    const statusData = statusMap[order.status] || statusMap['PENDING_PAYMENT'];
    const isActive = order.status !== "COMPLETED" && order.status !== "CANCELLED";

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-zinc-950 font-sans selection:bg-lime-400 selection:text-zinc-950">
            {isActive && <OrderPoller orderId={order.id} currentStatus={order.status} />}

            <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-block px-4 py-1.5 rounded-full bg-zinc-950 border border-zinc-800 text-xs font-mono font-bold tracking-widest text-zinc-500 mb-6">
                        ZAMÓWIENIE
                    </div>
                    <h1 className="text-sm font-mono tracking-tighter text-zinc-100 break-all mb-2">
                        {order.id}
                    </h1>
                    <p className="text-zinc-500 text-sm">
                        Total: <span className="font-bold text-white">{(order.totalAmountInCents / 100).toFixed(2)} zł</span>
                    </p>
                </div>

                {/* Status Buzzer Orb */}
                <div className="flex flex-col items-center justify-center py-10 relative">
                    {/* Glowing pulse effect behind the emoji if actively waiting */}
                    {isActive && (
                        <div className="absolute inset-0 m-auto w-32 h-32 rounded-full border border-lime-400/20 blur-xl animate-ping" />
                    )}

                    <div className="text-6xl mb-6 relative z-10 animate-bounce">
                        {statusData.icon}
                    </div>

                    <h2 className={`text-xl font-black text-center ${statusData.color}`}>
                        {statusData.label}
                    </h2>
                </div>

                {/* Refresh Note */}
                {isActive && (
                    <p className="text-center text-xs text-zinc-600 mt-8 flex items-center justify-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse"></span>
                        Status synchronizuje się automatycznie
                    </p>
                )}
            </div>
        </div>
    );
}
