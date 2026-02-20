"use client";

import Link from "next/link";

export default function NotFound() {
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-zinc-950 font-sans text-white p-6">
            <div className="text-center">
                <h1 className="text-6xl font-black text-lime-400 mb-4 drop-shadow-[0_0_15px_rgba(163,230,53,0.3)]">404</h1>
                <h2 className="text-2xl font-bold mb-4">Pustka w laboratorium.</h2>
                <p className="text-zinc-400 mb-8 max-w-sm mx-auto">
                    Zsyntetyzowany przez Ciebie adres uległ destrukcji. Taki produkt nie istnieje w naszym menu.
                </p>
                <Link
                    href="/"
                    className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-lime-400 px-6 py-4 text-sm font-black text-zinc-950 transition-all hover:bg-lime-300 active:scale-95 shadow-[0_0_20px_rgba(163,230,53,0.2)]"
                >
                    Wróć do bazy (Menu)
                </Link>
            </div>
        </div>
    );
}
