import { NextRequest, NextResponse } from "next/server";
import { sendDiscordLeadNotification } from "@/lib/retell/discord";
import { upsertCallLead } from "@/lib/retell/leads";
import { verifyRetellSignature } from "@/lib/retell/signature";
import { parseRetellToolBody, saveLeadSchema } from "@/lib/retell/validation";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-retell-signature");

  if (!verifyRetellSignature(rawBody, signature)) {
    return NextResponse.json({ success: false, error: "invalid signature" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ success: false, error: "invalid json" }, { status: 400 });
  }

  const parsed = saveLeadSchema.safeParse(parseRetellToolBody(json));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "invalid payload" }, { status: 400 });
  }

  const lead = await upsertCallLead({
    ...parsed.data,
    appointmentRequested: false,
    appointmentBooked: false,
    callStatus: "lead_saved",
  });

  try {
    await sendDiscordLeadNotification(lead.id);
  } catch (error) {
    console.error("Retell lead Discord notification failed", error);
  }

  return NextResponse.json({
    success: true,
    leadId: lead.id,
    message: "Die Anfrage wurde gespeichert und intern weitergeleitet.",
  });
}
