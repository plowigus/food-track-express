import { NextRequest } from "next/server";
import crypto from "crypto";
import { db, orders } from "@/packages/database/src";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
    try {
        // 1. Get raw text body for signature verification
        const rawBody = await req.text();

        // 2. Extract OpenPayu-Signature header
        const signatureHeader = req.headers.get("OpenPayu-Signature");
        if (!signatureHeader) {
            console.error("Missing OpenPayu-Signature header");
            return new Response("Missing signature", { status: 400 });
        }

        // Header format expected: "sender=300746;signature=xxx;algorithm=MD5;mac=..."
        const sigParts = signatureHeader.split(";").map(part => part.trim());
        let providedSignature = "";
        let algorithm = "MD5"; // default fallback

        for (const part of sigParts) {
            if (part.startsWith("signature=")) providedSignature = part.replace("signature=", "");
            if (part.startsWith("algorithm=")) algorithm = part.replace("algorithm=", "");
        }

        if (!providedSignature) {
            console.error("Signature segment not found in header");
            return new Response("Invalid signature format", { status: 400 });
        }

        // 3. Verify Signature
        const secondKey = process.env.PAYU_SECOND_KEY;
        if (!secondKey) {
            console.error("Missing PAYU_SECOND_KEY");
            return new Response("Server configuration error", { status: 500 });
        }

        const concatenatedString = rawBody + secondKey;

        // Node's crypto uses 'md5' or 'sha256'
        const algoFormatted = algorithm.toLowerCase() === "md5" ? "md5" : "sha256";

        const expectedSignature = crypto
            .createHash(algoFormatted)
            .update(concatenatedString)
            .digest("hex");

        if (expectedSignature !== providedSignature) {
            console.error("Signature mismatch", { expected: expectedSignature, provided: providedSignature });
            return new Response("Invalid signature", { status: 400 });
        }

        // 4. Act upon the secure payload
        const body = JSON.parse(rawBody);

        // Ensure structure matches our expectation
        if (!body.order || !body.order.extOrderId || !body.order.status) {
            return new Response("Missing required payload fields", { status: 400 });
        }

        const { extOrderId, status } = body.order;

        console.log(`PayU Webhook: Order ${extOrderId} updated to status -> ${status}`);

        // Update DB if the payment was completed successsfully
        if (status === "COMPLETED") {
            await db.update(orders)
                .set({ status: "PAID" })
                .where(eq(orders.id, extOrderId));
        }

        // PayU requires a 200 OK
        return new Response("OK", { status: 200 });

    } catch (err) {
        console.error("Webhook Error:", err);
        return new Response("Internal Server Error", { status: 500 });
    }
}
