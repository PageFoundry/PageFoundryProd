import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { errorResponse, forbidden, salesActor } from "@/lib/sales/http";
import { confirmCall } from "@/lib/sales/callService";

export const dynamic = "force-dynamic";

const schema = z.object({
  entryId: z.string().min(1).max(40).optional(),
  taskId: z.string().min(1).max(40).optional(),
  confirmed: z.literal(true),
});

// POST: Checkbox "Anrufgrund passt, Gegenueber ist ein Unternehmen" -> Anrufversuch.
export async function POST(req: NextRequest) {
  const actor = await salesActor();
  if (!actor) return forbidden();
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Bitte die Bestätigung anhaken." }, { status: 400 });
  try {
    return NextResponse.json(await confirmCall(actor, parsed.data));
  } catch (err) {
    return errorResponse(err, "sales/calls confirm");
  }
}
