"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface OrderPollerProps {
    orderId: string;
    currentStatus: string;
}

export function OrderPoller({ orderId, currentStatus }: OrderPollerProps) {
    const router = useRouter();

    useEffect(() => {
        // Only run polling if the status is not terminal
        if (currentStatus === "COMPLETED" || currentStatus === "CANCELLED") {
            return;
        }

        const intervalId = setInterval(() => {
            // refresh() magically re-fetches the Server Component RSC payload
            // without a hard reload, retaining scroll and client state!
            router.refresh();
        }, 4000);

        return () => clearInterval(intervalId);
    }, [currentStatus, router]);

    return null; // Headless logical component
}
