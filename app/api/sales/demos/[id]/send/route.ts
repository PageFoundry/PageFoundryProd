import { NextRequest, NextResponse } from "next/server";
import { errorResponse, forbidden, salesActor } from "@/lib/sales/http";
import { sendDemoSchema, sendDemoToCustomer } from "@/lib/sales/demoService";

export const dynamic = "force-dynamic";

// POST (nur SALES, eigene Anfrage): Demo-Link per E-Mail an den Kunden.
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const actor = await salesActor();
  if (!actor) return forbidden();
  const parsed = sendDemoSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Nachricht fehlt oder ist zu kurz." }, { status: 400 });
  try {
    const { id } = await ctx.params;
    return NextResponse.json({ demo: await sendDemoToCustomer(actor, id, parsed.data.message) });
  } catch (err) {
    return errorResponse(err, "sales/demos send");
  }
}
