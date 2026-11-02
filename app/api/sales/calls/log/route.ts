import { NextRequest, NextResponse } from "next/server";
import { errorResponse, forbidden, salesActor } from "@/lib/sales/http";
import { logCall } from "@/lib/sales/callService";
import { callLogSchema } from "@/lib/sales/callGuide";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const actor = await salesActor();
  if (!actor) return forbidden();
  const parsed = callLogSchema().safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json({ message: issue?.message || "Ungültige Eingabe", field: issue?.path?.join(".") }, { status: 400 });
  }
  try {
    return NextResponse.json(await logCall(actor, parsed.data));
  } catch (err) {
    return errorResponse(err, "sales/calls log");
  }
}
