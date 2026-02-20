import { db, orders } from "@/packages/database/src";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const p = await params;
    let orderId: string;
    try {
        orderId = p.id;
    } catch {
        return new Response("Invalid ID", { status: 400 });
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            const sendUpdate = async () => {
                try {
                    const orderResult = await db.select({ status: orders.status }).from(orders).where(eq(orders.id, orderId)).limit(1);

                    if (orderResult.length > 0) {
                        const statusMessage = `data: ${JSON.stringify({ status: orderResult[0].status })}\n\n`;
                        controller.enqueue(encoder.encode(statusMessage));

                        // Optionally auto-close if terminal state...
                        if (orderResult[0].status === "COMPLETED" || orderResult[0].status === "CANCELLED") {
                            clearInterval(intervalId);
                            controller.close();
                        }
                    }
                } catch (error) {
                    console.error("Error fetching order status for SSE:", error);
                }
            };

            // Initial immediate send
            await sendUpdate();

            const intervalId = setInterval(sendUpdate, 3000);

            request.signal.addEventListener("abort", () => {
                clearInterval(intervalId);
                try {
                    controller.close();
                } catch (e) {
                    // Ignore
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
