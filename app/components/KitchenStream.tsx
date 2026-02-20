"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatus } from "@/app/actions/kitchen";
import { Volume2, VolumeX } from "lucide-react";

// Using the same types as before, adjusted to what's coming via the API
type Order = {
    id: string;
    dailyOrderNumber: number;
    status: string;
    totalAmountInCents: number;
    createdAt: string | Date;
    items: Array<{
        quantity: number;
        product: {
            id: string;
            name: string;
        } | null;
    }>;
};

// Map database order status to Polish UI Text
const statusMap: Record<string, { label: string, color: string, badge: string }> = {
    'PENDING_PAYMENT': { label: "Oczekuje na płatność", color: "border-zinc-800 bg-zinc-900/50", badge: "bg-zinc-800 text-zinc-400" },
    'PAID': { label: "Nowe - Zapłacone", color: "border-blue-500/30 bg-blue-950/20", badge: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    'PREPARING': { label: "W przygotowaniu", color: "border-orange-500/30 bg-orange-950/20", badge: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
    'READY': { label: "Gotowe do odbioru", color: "border-lime-500/30 bg-lime-950/20", badge: "bg-lime-500/20 text-lime-400 border-lime-500/30" },
};

export function KitchenStream({ initialOrders }: { initialOrders: Order[] }) {
    const [orders, setOrders] = useState<Order[]>(initialOrders);
    const [loadingAction, setLoadingAction] = useState<string | null>(null);
    const [sseStatus, setSseStatus] = useState<"connecting" | "connected" | "error">("connecting");
    const [audioEnabled, setAudioEnabled] = useState(false);

    // Ref to track which orders we have already "seen" as PAID
    // Initialize with all PAID orders from the initial server load
    const knownPaidOrderIds = useRef<Set<string>>(
        new Set(initialOrders.filter(o => o.status === "PAID").map(o => o.id))
    );
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const router = useRouter();

    useEffect(() => {
        audioRef.current = new Audio("/sounds/ding.mp3");
    }, []);

    const enableAudio = () => {
        if (audioRef.current) {
            audioRef.current.play().then(() => {
                audioRef.current?.pause();
                audioRef.current!.currentTime = 0;
                setAudioEnabled(true);
            }).catch(e => {
                console.error("Audio playback failed", e);
            });
        }
    };

    useEffect(() => {
        let eventSource: EventSource;
        const connect = () => {
            eventSource = new EventSource("/api/kitchen/stream");
            setSseStatus("connecting");

            eventSource.onopen = () => {
                setSseStatus("connected");
            };

            eventSource.onmessage = (event) => {
                try {
                    const parsedData = JSON.parse(event.data) as Order[];

                    // Check for new PAID orders to trigger sound
                    let hasNewPaidOrder = false;
                    for (const order of parsedData) {
                        if (order.status === "PAID" && !knownPaidOrderIds.current.has(order.id)) {
                            hasNewPaidOrder = true;
                            knownPaidOrderIds.current.add(order.id);
                        }
                    }

                    if (hasNewPaidOrder && audioEnabled && audioRef.current) {
                        audioRef.current.play().catch(e => console.log("Audio play blocked", e));
                    }

                    setOrders(parsedData);
                } catch (err) {
                    console.error("Failed to parse SSE payload:", err);
                }
            };

            eventSource.onerror = (err) => {
                console.error("SSE Error:", err);
                setSseStatus("error");
                eventSource.close();
                // Native EventSource autoreconnects, but if it fails completely we can retry.
                setTimeout(connect, 3000);
            };
        };

        connect();

        return () => {
            if (eventSource) {
                eventSource.close();
            }
        };
    }, []);

    const handleAction = async (orderId: string, currentStatus: string) => {
        setLoadingAction(orderId);
        try {
            let nextStatus: "PREPARING" | "READY" | "COMPLETED" = "PREPARING";
            if (currentStatus === "PAID") nextStatus = "PREPARING";
            if (currentStatus === "PREPARING") nextStatus = "READY";
            if (currentStatus === "READY") nextStatus = "COMPLETED";

            const result = await updateOrderStatus(orderId, nextStatus);
            if (!result.success) {
                alert("Błąd: " + result.error);
            } else {
                // Optimistically remove/update from state based on 'nextStatus'
                // If it's COMPLETED, we usually drop it from the kitchen dashboard
                if (nextStatus === "COMPLETED") {
                    setOrders((prev) => prev.filter((o) => o.id !== orderId));
                } else {
                    setOrders((prev) =>
                        prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
                    );
                }
            }
        } finally {
            setLoadingAction(null);
        }
    };

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className={`px-3 py-1.5 text-xs rounded-full inline-flex items-center gap-2 border ${sseStatus === 'connected' ? 'bg-lime-500/10 text-lime-400 border-lime-500/20' : sseStatus === 'connecting' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                    <span className={`w-2 h-2 rounded-full ${sseStatus === 'connected' ? 'bg-lime-400 animate-pulse' : sseStatus === 'connecting' ? 'bg-yellow-400' : 'bg-red-500'}`} />
                    {sseStatus === 'connected' ? 'Live Stream: Połączono' : sseStatus === 'connecting' ? 'Live Stream: Łączenie...' : 'Live Stream: Błąd. Próba wznowienia...'}
                </div>

                {!audioEnabled ? (
                    <button
                        onClick={enableAudio}
                        className="px-3 py-1.5 text-xs rounded-full inline-flex items-center gap-2 border bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20 transition cursor-pointer font-medium"
                    >
                        <VolumeX className="w-4 h-4" />
                        <span>Włącz powiadomienia dźwiękowe</span>
                    </button>
                ) : (
                    <div className="px-3 py-1.5 text-xs rounded-full inline-flex items-center gap-2 border bg-zinc-800 text-zinc-400 border-zinc-700 font-medium">
                        <Volume2 className="w-4 h-4 text-lime-400" />
                        <span>Dźwięk aktywny</span>
                    </div>
                )}
            </div>

            {orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-20 text-center border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20">
                    <div className="text-4xl mb-4 opacity-50">👨‍🍳</div>
                    <h2 className="text-xl font-bold text-zinc-400 mb-2">Brak aktywnych zamówień</h2>
                    <p className="text-zinc-600">Kuchnia może odpocząć (na razie)...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {orders.map((order) => {
                        const statusData = statusMap[order.status] || statusMap['PENDING_PAYMENT'];
                        const isProcessing = loadingAction === order.id;
                        const dateObj = new Date(order.createdAt);
                        const timeString = isNaN(dateObj.getTime()) ? "" : dateObj.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });

                        return (
                            <div key={order.id} className={`flex flex-col border rounded-2xl p-6 transition-all ${statusData.color} shadow-lg relative overflow-hidden group`}>
                                {/* Decorative gradient blob */}
                                <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/5 blur-3xl rounded-full" />

                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex flex-col">
                                        <span className="text-zinc-500 text-xs font-mono uppercase tracking-widest mb-1">
                                            Zamówienie
                                        </span>
                                        {/* MASSIVE Daily Order Number */}
                                        <div className="text-6xl font-black tracking-tighter text-white">
                                            #{String(order.dailyOrderNumber).padStart(3, '0')}
                                        </div>
                                        <div className="text-[0.65rem] text-zinc-600 font-mono mt-1 break-all truncate w-32" title={order.id}>
                                            {order.id.split('-')[0]}...
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${statusData.badge}`}>
                                            {statusData.label}
                                        </span>
                                        <span className="text-zinc-500 font-mono text-sm">{timeString}</span>
                                    </div>
                                </div>

                                <div className="grow">
                                    <ul className="space-y-3 mb-8">
                                        {order.items.map((item, idx) => (
                                            <li key={idx} className="flex justify-between items-center pb-3 border-b border-white/5 last:border-0">
                                                <span className="font-medium text-zinc-200">{item.product?.name || "Nieznany Produkt"}</span>
                                                <span className="bg-zinc-800 text-zinc-300 font-mono text-xs px-2 py-1 rounded">x{item.quantity}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="mt-auto pt-4 border-t border-white/5">
                                    <button
                                        onClick={() => handleAction(order.id, order.status)}
                                        disabled={isProcessing}
                                        className="w-full relative group/btn overflow-hidden rounded-xl bg-white text-zinc-950 font-bold py-4 px-4 transition-all hover:bg-zinc-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <span className="relative z-10 flex items-center justify-center gap-2">
                                            {isProcessing ? (
                                                <>
                                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-zinc-950" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Aktualizacja...
                                                </>
                                            ) : order.status === 'PAID' ? 'Rozpocznij Przygotowanie'
                                                : order.status === 'PREPARING' ? 'Oznacz jako Gotowe'
                                                    : order.status === 'READY' ? 'Wydano (Zakończ)'
                                                        : 'Zmień Status'}
                                        </span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
