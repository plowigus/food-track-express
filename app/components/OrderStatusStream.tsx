"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Only defining the specific prop we need
interface OrderStatusStreamProps {
    orderId: string;
    initialStatus: string;
}

export function OrderStatusStream({ orderId, initialStatus }: OrderStatusStreamProps) {
    const [currentStatus, setCurrentStatus] = useState(initialStatus);
    const router = useRouter();

    useEffect(() => {
        // Stop streaming if order is in terminal state
        if (currentStatus === "COMPLETED" || currentStatus === "CANCELLED") {
            return;
        }

        let eventSource: EventSource;

        const connect = () => {
            eventSource = new EventSource(`/api/orders/${orderId}/stream`);

            eventSource.onmessage = (event) => {
                try {
                    const parsedData = JSON.parse(event.data);
                    if (parsedData && parsedData.status) {
                        const newStatus = parsedData.status;

                        // Only act if status actually changes to avoid thrashing
                        if (newStatus !== currentStatus) {
                            setCurrentStatus(newStatus);
                            // Also ask the router to refresh underlying Server Component data silently in background
                            router.refresh();
                        }

                        // Close stream if terminal state reached
                        if (newStatus === "COMPLETED" || newStatus === "CANCELLED") {
                            eventSource.close();
                        }
                    }
                } catch (err) {
                    console.error("Failed to parse SSE payload for order status:", err);
                }
            };

            eventSource.onerror = (err) => {
                console.error("SSE Order Status Error:", err);
                eventSource.close();
                // Reconnect if not terminal
                setTimeout(connect, 3000);
            };
        };

        connect();

        return () => {
            if (eventSource) {
                eventSource.close();
            }
        };
    }, [orderId, currentStatus, router]);

    // We only need to return visual representation of active streaming connection
    // and rely on the parent page to re-render naturally. However, if the page doesn't depend
    // on this component for UI, we could return nothing.
    // Given the task says we replace OrderPoller with this and use it to refresh route or drive UI,
    // we return null, OR we could return the connection status indicator if wanted.

    return null;
}
