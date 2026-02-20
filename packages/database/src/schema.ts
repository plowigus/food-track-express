import {
    pgTable,
    uuid,
    varchar,
    boolean,
    timestamp,
    integer,
    pgEnum,
    index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

// --- ENUMS ---

export const orderStatusEnum = pgEnum("order_status", [
    "PENDING_PAYMENT",
    "PAID",
    "PREPARING",
    "READY",
    "COMPLETED",
    "CANCELLED",
]);

// --- TABLES ---

export const products = pgTable(
    "products",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        name: varchar("name", { length: 255 }).notNull(),
        description: varchar("description", { length: 1000 }),
        priceInCents: integer("price_in_cents").notNull(),
        isAvailable: boolean("is_available").default(true).notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    }
);

export const orders = pgTable(
    "orders",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        status: orderStatusEnum("status").default("PENDING_PAYMENT").notNull(),
        totalAmountInCents: integer("total_amount_in_cents").notNull(),
        paymentProviderId: varchar("payment_provider_id", { length: 255 }), // e.g., PayU transaction ID
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (table) => [
        index("orders_status_idx").on(table.status),
    ]
);

export const orderItems = pgTable(
    "order_items",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        orderId: uuid("order_id")
            .notNull()
            .references(() => orders.id, { onDelete: "cascade" }),
        productId: uuid("product_id")
            .notNull()
            .references(() => products.id),
        quantity: integer("quantity").notNull(),
        priceAtTimeInCents: integer("price_at_time_in_cents").notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (table) => [
        index("order_items_order_id_idx").on(table.orderId),
        index("order_items_product_id_idx").on(table.productId),
    ]
);

// --- RELATIONS ---

export const productsRelations = relations(products, ({ many }) => ({
    orderItems: many(orderItems),
}));

export const ordersRelations = relations(orders, ({ many }) => ({
    items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
    order: one(orders, {
        fields: [orderItems.orderId],
        references: [orders.id],
    }),
    product: one(products, {
        fields: [orderItems.productId],
        references: [products.id],
    }),
}));

// --- ZOD SCHEMAS ---

export const insertProductSchema = createInsertSchema(products);
export const selectProductSchema = createSelectSchema(products);

export const insertOrderSchema = createInsertSchema(orders);
export const selectOrderSchema = createSelectSchema(orders);

export const insertOrderItemSchema = createInsertSchema(orderItems);
export const selectOrderItemSchema = createSelectSchema(orderItems);
