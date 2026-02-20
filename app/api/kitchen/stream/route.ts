import { db, orders, orderItems, products } from "@/packages/database/src";
import { inArray, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            const sendUpdate = async () => {
                try {
                    // Fetch ACTIVE orders with their items
                    const activeOrders = await db.query.orders.findMany({
                        where: inArray(orders.status, ["PAID", "PREPARING", "READY"]),
                        orderBy: [desc(orders.createdAt)],
                        with: {
                            items: {
                                with: {
                                    product: true,
                                },
                            },
                        },
                    });

                    // Format message according to SSE spec
                    const message = `data: ${JSON.stringify(activeOrders)}\n\n`;
                    controller.enqueue(encoder.encode(message));
                } catch (error) {
                    console.error("Error fetching kitchen orders for SSE:", error);
                    // Do not close stream, just log error and try again next tick
                }
            };

            // Send initial payload immediately
            await sendUpdate();

            // Poll database every 3 seconds to push to client
            const intervalId = setInterval(sendUpdate, 3000);

            // Close connection cleanly when client aborts
            request.signal.addEventListener("abort", () => {
                clearInterval(intervalId);
                try {
                    controller.close();
                } catch (e) {
                    // Ignore already closed stream errors
                }
            });
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    });
}
