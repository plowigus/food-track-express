"use client";

import { useCartStore } from "@/app/store/cart-store";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function FloatingCartButton() {
    const { getTotalItems, toggleCart } = useCartStore();
    const [mounted, setMounted] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;
    if (pathname?.startsWith("/kitchen")) return null;

    const totalItems = getTotalItems();

    if (totalItems === 0) return null;

    return (
        <button
            onClick={toggleCart}
            className="fixed z-30 bottom-[max(2rem,calc(var(--sab)+1rem))] right-[max(1rem,var(--sar))] flex items-center gap-3 rounded-full bg-lime-400 pl-4 pr-5 py-3 text-zinc-950 shadow-[0_4px_20px_rgba(163,230,53,0.3)] transition-transform hover:scale-105 active:scale-95"
            aria-label="Otwórz koszyk"
        >
            <div className="relative flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                </svg>
                <span className="absolute -top-2 -right-3 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-950 text-[10px] font-bold text-lime-400 ring-2 ring-lime-400">
                    {totalItems}
                </span>
            </div>
            <span className="font-bold tracking-tight">KOSZYK</span>
        </button>
    );
}
