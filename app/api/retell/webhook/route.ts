import { NextRequest, NextResponse } from "next/server";
import { retellWebhookSchema } from "@/lib/retell/validation";
import { verifyRetellSignature } from "@/lib/retell/signature";
import { handleRetellWebhookEvent } from "@/lib/retell/webhook";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-retell-signature");

  if (!verifyRetellSignature(rawBody, signature)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const parsed = retellWebhookSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  const result = await handleRetellWebhookEvent(parsed.data.event, parsed.data.call);
  return NextResponse.json({ received: true, ...result }, { status: 200 });
}
