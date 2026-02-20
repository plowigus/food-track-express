"use client";

import Image from "next/image";
import { MenuItem } from "@/app/constants/menu";
import { useCartStore } from "@/app/store/cart-store";

export function MenuCard({ item }: { item: MenuItem }) {
    const { addItem } = useCartStore();

    const handleAddToCart = () => {
        addItem({
            id: item.id,
            name: item.name,
            priceInCents: item.priceInCents,
            quantity: 1,
            imageUrl: item.imageUrl,
        });
    };

    const formatPrice = (cents: number) => (cents / 100).toFixed(2);

    return (
        <article className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 transition-all hover:bg-zinc-800/80 hover:border-lime-400/50 hover:shadow-[0_0_30px_rgba(163,230,53,0.1)]">
            {/* Image Section */}
            <div className="relative h-48 w-full overflow-hidden bg-zinc-800">
                <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                {/* Subtle overlay gradient */}
                <div className="absolute inset-0 bg-linear-to-t from-zinc-900 to-transparent" />
            </div>

            {/* Content Section */}
            <div className="flex flex-1 flex-col justify-between p-6">
                <div>
                    <h3 className="text-xl font-bold text-white group-hover:text-lime-300 transition-colors">
                        {item.name}
                    </h3>
                    <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
                        {item.description}
                    </p>
                </div>

                <div className="mt-8 flex items-end justify-between gap-4">
                    <span className="text-2xl font-black text-lime-400 tracking-tight">
                        {formatPrice(item.priceInCents)}{" "}
                        <span className="text-sm font-medium text-zinc-500">zł</span>
                    </span>

                    <button
                        onClick={handleAddToCart}
                        className="mt-4 flex cursor-pointer items-center justify-center rounded-lg bg-lime-400 px-5 py-2.5 text-sm font-bold text-zinc-950 transition-all hover:bg-lime-300 active:scale-95 hover:shadow-[0_0_15px_rgba(163,230,53,0.4)]"
                        aria-label={`Dodaj ${item.name} do koszyka`}
                    >
                        Dodaj do koszyka
                    </button>
                </div>
            </div>
        </article>
    );
}
