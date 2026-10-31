import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSalesOrAdmin } from "@/lib/auth";
import { buildLeadUpdate, LeadPermissionError, updateLeadSchema } from "@/lib/sales/leads";
import { leadSelect } from "@/lib/sales/data";

export const dynamic = "force-dynamic";

const ERRORS: Record<string, [number, string]> = {
  NOT_FOUND: [404, "Lead nicht gefunden"],
  LEAD_CLOSED: [403, "Abgeschlossene Leads kann nur der Admin aendern"],
  STATUS_ADMIN_ONLY: [403, "Gewonnen/Verloren setzt nur der Admin"],
  VALUES_ADMIN_ONLY: [403, "Auftragswerte setzt nur der Admin"],
};

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  let actor;
  try {
    actor = await requireSalesOrAdmin();
  } catch {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const { id } = await ctx.params;

  const parsed = updateLeadSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Ungueltige Eingabe" }, { status: 400 });

  const lead = await prisma.salesLead.findUnique({
    where: { id },
    select: { ownerId: true, status: true, commissionPercentAtWin: true, owner: { select: { commissionPercent: true } } },
  });
  // Fremde Leads fuer SALES wie nicht existent behandeln.
  if (!lead || (actor.role !== "ADMIN" && lead.ownerId !== actor.sub)) {
    return NextResponse.json({ message: ERRORS.NOT_FOUND[1] }, { status: 404 });
  }

  let data: Record<string, unknown>;
  try {
    data = buildLeadUpdate(actor, lead, parsed.data, lead.owner.commissionPercent);
  } catch (err) {
    if (err instanceof LeadPermissionError) {
      const [status, message] = ERRORS[err.message] ?? [403, "Forbidden"];
      return NextResponse.json({ message }, { status });
    }
    throw err;
  }

  // updateMany mit Status-Bedingung: verhindert, dass ein paralleler Admin-Abschluss
  // von einem veralteten SALES-Request ueberschrieben wird.
  const res = await prisma.salesLead.updateMany({ where: { id, status: lead.status }, data });
  if (res.count === 0) return NextResponse.json({ message: "Lead wurde zwischenzeitlich geaendert" }, { status: 409 });
  const updated = await prisma.salesLead.findUnique({ where: { id }, select: leadSelect });
  return NextResponse.json({ lead: updated });
}
