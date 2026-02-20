import { create } from "zustand";
import { persist } from "zustand/middleware";
import { z } from "zod";

export const CartItemSchema = z.object({
    id: z.string().uuid("Invalid product ID format"),
    name: z.string(),
    priceInCents: z.number().int().nonnegative("Price cannot be negative"),
    quantity: z.number().int().min(1, "Quantity must be at least 1"),
    imageUrl: z.string(),
});

export type CartItem = z.infer<typeof CartItemSchema>;

interface CartState {
    items: CartItem[];
    isOpen: boolean;

    // Actions
    addItem: (item: CartItem) => void;
    removeItem: (id: string) => void;
    updateQuantity: (id: string, delta: number) => void;
    clearCart: () => void;
    toggleCart: () => void;

    // Computed state getters (can be manually invoked or used in components directly)
    getCartTotal: () => number;
    getTotalItems: () => number;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            isOpen: false,

            addItem: (newItem) => {
                const validItem = CartItemSchema.parse(newItem);

                set((state) => {
                    const existingItemIndex = state.items.findIndex((i) => i.id === validItem.id);

                    if (existingItemIndex > -1) {
                        const updatedItems = [...state.items];
                        updatedItems[existingItemIndex] = {
                            ...updatedItems[existingItemIndex],
                            quantity: updatedItems[existingItemIndex].quantity + validItem.quantity,
                        };
                        return { items: updatedItems }; // Do not open cart automatically
                    }

                    return { items: [...state.items, validItem] }; // Do not open cart automatically
                });
            },

            removeItem: (id) =>
                set((state) => ({
                    items: state.items.filter((i) => i.id !== id),
                })),

            updateQuantity: (id, delta) => {
                set((state) => ({
                    items: state.items.map((i) => {
                        if (i.id === id) {
                            const newQuantity = Math.max(1, i.quantity + delta);
                            return { ...i, quantity: newQuantity };
                        }
                        return i;
                    }),
                }));
            },

            clearCart: () => set({ items: [] }),

            toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

            getCartTotal: () => {
                const { items } = get();
                return items.reduce((total, item) => total + item.quantity * item.priceInCents, 0);
            },

            getTotalItems: () => {
                const { items } = get();
                return items.reduce((total, item) => total + item.quantity, 0);
            },
        }),
        {
            name: "chemik-burger-cart",
            partialize: (state) => ({ items: state.items }), // Only persist items, not UI state (isOpen)
        }
    )
);
