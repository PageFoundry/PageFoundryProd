import { NextRequest, NextResponse } from "next/server";
import { errorResponse, forbidden, salesActor } from "@/lib/sales/http";
import { adminDemoSchema, adminUpdateDemo } from "@/lib/sales/demoService";

export const dynamic = "force-dynamic";

// PATCH (nur ADMIN): Status / Demo-Link setzen.
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const actor = await salesActor();
  if (!actor) return forbidden();
  const parsed = adminDemoSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Ungültige Eingabe" }, { status: 400 });
  try {
    const { id } = await ctx.params;
    return NextResponse.json({ demo: await adminUpdateDemo(actor, id, parsed.data) });
  } catch (err) {
    return errorResponse(err, "sales/demos PATCH");
  }
}
