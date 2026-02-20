"use client";

import { useCartStore } from "@/app/store/cart-store";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function CartDrawer() {
    const { items, isOpen, toggleCart, updateQuantity, removeItem, getCartTotal, clearCart } = useCartStore();
    const [mounted, setMounted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        setMounted(true);
    }, []);

    // Prevent background scrolling when drawer is open
    useEffect(() => {
        if (isOpen) {
            document.body.classList.add("overflow-hidden");
        } else {
            document.body.classList.remove("overflow-hidden");
        }

        // Cleanup function in case component unmounts while open
        return () => {
            document.body.classList.remove("overflow-hidden");
        };
    }, [isOpen]);

    if (!mounted) return null; // Avoid hydration mismatch for persist
    if (pathname?.startsWith("/kitchen")) return null;

    const totalCents = getCartTotal();

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity"
                    onClick={toggleCart}
                />
            )}

            {/* Drawer */}
            <div
                className={`fixed inset-y-0 right-0 z-50 w-full max-w-md bg-zinc-950 shadow-[0_0_50px_rgba(0,0,0,0.8)] transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? "translate-x-0" : "translate-x-full"
                    }`}
            >
                {/* Header (respects top safe area) */}
                <div className="flex items-center justify-between border-b border-zinc-900 px-6 py-4 pt-[max(1rem,var(--sat))]">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="text-lime-400">Koszyk</span> 🛒
                    </h2>
                    <button
                        onClick={toggleCart}
                        className="rounded-full p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                        aria-label="Zamknij koszyk"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                        </svg>
                    </button>
                </div>

                {/* Items List */}
                <div className="flex-1 overflow-y-auto px-6 py-6 pb-32">
                    {items.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center text-center text-zinc-500">
                            <span className="text-4xl mb-4" aria-hidden="true">🧪</span>
                            <p>Twój kolbowy pojemnik jet pusty.</p>
                            <p className="text-sm mt-1">Zsyntetyzuj coś na wynos!</p>
                        </div>
                    ) : (
                        <ul className="flex flex-col gap-6">
                            {items.map((item) => (
                                <li key={item.id} className="flex gap-4 items-center">
                                    <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-zinc-800 shrink-0">
                                        <Image src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="64px" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-sm font-bold text-zinc-100">{item.name}</h3>
                                        <p className="text-xs text-lime-400 font-mono mt-1">
                                            {((item.priceInCents * item.quantity) / 100).toFixed(2)} zł
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3 bg-zinc-900 rounded-lg p-1 border border-zinc-800">
                                        <button
                                            onClick={() => item.quantity > 1 ? updateQuantity(item.id, -1) : removeItem(item.id)}
                                            className="w-8 h-8 rounded-md flex items-center justify-center text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                                            aria-label="Usuń jedną sztukę"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M5 12h14" />
                                            </svg>
                                        </button>
                                        <span className="text-sm font-bold text-zinc-100 w-4 text-center">
                                            {item.quantity}
                                        </span>
                                        <button
                                            onClick={() => updateQuantity(item.id, 1)}
                                            className="w-8 h-8 rounded-md flex items-center justify-center text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                                            aria-label="Dodaj sztukę"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M5 12h14" /><path d="M12 5v14" />
                                            </svg>
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Footer (respects bottom safe area) */}
                {items.length > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 border-t border-zinc-900 bg-zinc-950/90 backdrop-blur-lg px-6 py-6 pb-[max(1.5rem,var(--sab))]">

                        <div className="flex items-center justify-between mb-4">
                            <span className="text-zinc-400 font-medium tracking-wide text-sm uppercase">Suma zamówienia</span>
                            <span className="text-2xl font-black text-lime-400 tracking-tight">{(totalCents / 100).toFixed(2)} zł</span>
                        </div>

                        <form action={async (formData) => {
                            const firstName = formData.get("firstName") as string;
                            const email = formData.get("email") as string;

                            if (!firstName || !email) return;

                            setIsLoading(true);
                            // Import action dynamically to avoid boundary issues if needed, or import at top
                            const { checkout } = await import("@/app/actions/checkout");

                            const res = await checkout({
                                firstName,
                                email,
                                items: items.map(i => ({ id: i.id, quantity: i.quantity }))
                            });

                            if (res.success && res.redirectUri) {
                                clearCart();
                                window.location.href = res.redirectUri;
                            } else {
                                alert(res.error || "Wystąpił błąd płatności");
                                setIsLoading(false);
                            }
                        }}>
                            <div className="flex flex-col gap-3 mb-4">
                                <div>
                                    <label htmlFor="firstName" className="block text-xs font-bold text-zinc-400 uppercase mb-2">Twoje Imię (do odbioru)</label>
                                    <input
                                        type="text"
                                        id="firstName"
                                        name="firstName"
                                        required
                                        minLength={2}
                                        placeholder="np. Kamila (bez tytułów naukowych)"
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400 transition-all"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-xs font-bold text-zinc-400 uppercase mb-2">Twój E-mail (paragon)</label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        required
                                        placeholder="chemburger@chemia.xyz"
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400 transition-all"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex cursor-pointer items-center justify-center rounded-xl bg-lime-400 px-6 py-4 text-lg font-black text-zinc-950 transition-all hover:bg-lime-300 active:scale-[0.98] shadow-[0_0_20px_rgba(163,230,53,0.2)] hover:shadow-[0_0_30px_rgba(163,230,53,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? "Synteza transakcji..." : "Przejdź do kasy"}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </>
    );
}
