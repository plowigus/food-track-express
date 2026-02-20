"use client";

import { useState } from "react";
import { toggleProductAvailability } from "@/app/actions/inventory";

interface Product {
    id: string;
    name: string;
    priceInCents: number;
    isAvailable: boolean;
}

interface InventoryManagerProps {
    initialProducts: Product[];
}

export function InventoryManager({ initialProducts }: InventoryManagerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [products, setProducts] = useState(initialProducts);
    const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

    const handleToggle = async (productId: string, currentStatus: boolean) => {
        setLoadingIds((prev) => {
            const newSet = new Set(prev);
            newSet.add(productId);
            return newSet;
        });

        const result = await toggleProductAvailability(productId, currentStatus);

        if (result.success) {
            setProducts((prev) =>
                prev.map((p) =>
                    p.id === productId ? { ...p, isAvailable: !currentStatus } : p
                )
            );
        } else {
            alert(result.error);
        }

        setLoadingIds((prev) => {
            const newSet = new Set(prev);
            newSet.delete(productId);
            return newSet;
        });
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="rounded-full bg-zinc-900 border border-zinc-800 px-4 py-2 text-sm font-bold tracking-wide text-zinc-300 hover:text-white hover:border-zinc-700 transition w-full md:w-auto"
            >
                Zarządzaj Menu / Stan Magazynu
            </button>

            {/* Modal Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
                    <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-zinc-900 px-6 py-5">
                            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                                <span className="text-lime-400">Magazyn</span> 📦
                            </h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="rounded-full p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto px-6 py-4">
                            <ul className="grid grid-cols-1 gap-4 divide-y divide-zinc-900/50">
                                {products.map((product) => {
                                    const isLoading = loadingIds.has(product.id);
                                    return (
                                        <li key={product.id} className={`flex items-center justify-between py-4 transition-opacity ${!product.isAvailable ? 'opacity-50 grayscale' : ''}`}>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-zinc-100">{product.name}</span>
                                                <span className="text-xs font-mono text-zinc-500">
                                                    ID: {product.id.split('-')[0]} • {(product.priceInCents / 100).toFixed(2)} zł
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                {!product.isAvailable && (
                                                    <span className="text-[10px] font-black tracking-widest uppercase bg-red-500/20 text-red-500 px-2 py-1 rounded border border-red-500/30">
                                                        Wyprzedane
                                                    </span>
                                                )}

                                                <button
                                                    disabled={isLoading}
                                                    onClick={() => handleToggle(product.id, product.isAvailable)}
                                                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-lime-400 focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:opacity-50 ${product.isAvailable ? 'bg-lime-500' : 'bg-zinc-800'}`}
                                                    role="switch"
                                                    aria-checked={product.isAvailable}
                                                >
                                                    <span className="sr-only">Toggle availability</span>
                                                    <span
                                                        aria-hidden="true"
                                                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${product.isAvailable ? 'translate-x-5' : 'translate-x-0'}`}
                                                    />
                                                </button>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
