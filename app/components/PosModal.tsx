"use client";

import { useState } from "react";
import { createCashOrder } from "@/app/actions/pos";
import { Plus, Minus, Banknote, X } from "lucide-react";

type Product = {
    id: string;
    name: string;
    priceInCents: number;
    isAvailable: boolean;
};

export function PosModal({ products }: { products: Product[] }) {
    const [isOpen, setIsOpen] = useState(false);
    const [cart, setCart] = useState<Record<string, number>>({});
    const [customerName, setCustomerName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filter available products for POS
    const availableProducts = products.filter(p => p.isAvailable);

    const handleQuantityChange = (productId: string, delta: number) => {
        setCart(prev => {
            const current = prev[productId] || 0;
            const next = current + delta;
            if (next <= 0) {
                const newCart = { ...prev };
                delete newCart[productId];
                return newCart;
            }
            return { ...prev, [productId]: next };
        });
    };

    const totalCents = Object.entries(cart).reduce((sum, [productId, qty]) => {
        const product = availableProducts.find(p => p.id === productId);
        if (product) {
            return sum + (product.priceInCents * qty);
        }
        return sum;
    }, 0);

    const handleSubmit = async () => {
        if (Object.keys(cart).length === 0) return;

        setIsSubmitting(true);
        try {
            const itemsToSubmit = Object.entries(cart).map(([productId, quantity]) => ({
                productId,
                quantity,
            }));

            const result = await createCashOrder(itemsToSubmit);
            if (result.success && result.dailyOrderNumber) {
                // Formatting the customer name alert 
                let msg = `✅ ZAMÓWIENIE OPŁACONE!\n\nPrzekaż numer klientowi:\n#{result.dailyOrderNumber.toString().padStart(3, '0')}`;
                if (customerName.trim()) {
                    msg += `\nImię: ${customerName.trim().toUpperCase()}`;
                }

                alert(msg);

                // Reset
                setCart({});
                setCustomerName("");
                setIsOpen(false);
            } else {
                alert(result.error || "Wystąpił błąd krytyczny.");
            }
        } catch (error) {
            alert("Błąd integracji.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="rounded-full bg-emerald-600/20 border border-emerald-500/40 px-4 py-2 text-sm font-bold tracking-wide text-emerald-400 hover:bg-emerald-600/30 hover:text-emerald-300 transition flex items-center justify-center gap-2 cursor-pointer w-full md:w-auto"
            >
                <Banknote className="w-4 h-4" />
                <span>Nowe Zamówienie [GOTÓWKA]</span>
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative">
                        {/* Header */}
                        <div className="flex justify-between items-center p-6 border-b border-zinc-800 bg-zinc-900/50">
                            <h2 className="text-2xl font-black text-white flex items-center gap-3">
                                <Banknote className="w-6 h-6 text-emerald-400" />
                                Punkt Sprzedaży POS
                            </h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Middle Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {availableProducts.length === 0 ? (
                                <p className="text-center text-zinc-500 py-10">Brak dostępnych produktów.</p>
                            ) : (
                                availableProducts.map(product => {
                                    const qty = cart[product.id] || 0;
                                    return (
                                        <div key={product.id} className="flex justify-between items-center p-4 rounded-xl border border-zinc-800/50 bg-zinc-800/20">
                                            <div>
                                                <h3 className="font-bold text-white">{product.name}</h3>
                                                <p className="text-sm font-mono text-zinc-400">{(product.priceInCents / 100).toFixed(2)} zł</p>
                                            </div>
                                            <div className="flex items-center gap-4 bg-zinc-950 rounded-full border border-zinc-800 p-1">
                                                <button
                                                    onClick={() => handleQuantityChange(product.id, -1)}
                                                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-800 text-red-400 transition"
                                                >
                                                    <Minus className="w-4 h-4" />
                                                </button>
                                                <span className="w-6 text-center font-bold font-mono">{qty}</span>
                                                <button
                                                    onClick={() => handleQuantityChange(product.id, 1)}
                                                    className="w-8 h-8 flex items-center justify-center rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 transition"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>

                        {/* Footer / Summary */}
                        <div className="p-6 border-t border-zinc-800 bg-zinc-900/80">
                            <div className="flex gap-4 items-end justify-between mb-6">
                                <div className="flex-1">
                                    <label className="block text-xs font-mono text-zinc-500 mb-2 uppercase tracking-widest">Identyfikator (Opcjonalnie)</label>
                                    <input
                                        type="text"
                                        placeholder="Np. Krzysiek, czerwona kurtka..."
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-zinc-600 transition"
                                    />
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-mono text-zinc-500 mb-1 uppercase tracking-widest">Suma Do Zapłaty</p>
                                    <p className="text-4xl font-black text-emerald-400">
                                        {(totalCents / 100).toFixed(2)} zł
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting || Object.keys(cart).length === 0}
                                className="w-full rounded-2xl bg-emerald-500 text-zinc-950 font-black text-lg py-5 px-6 transition hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? "Przetwarzanie..." : "Zatwierdź Opłacone Zamówienie"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
