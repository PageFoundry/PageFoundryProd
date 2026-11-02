import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { firstValidPhoneDE } from "@/lib/sales/phone";
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

  const phoneChanged = "phone" in data;
  if (phoneChanged) data.phoneNorm = firstValidPhoneDE(data.phone as string | null, { assumeDE: true });

  // updateMany mit Status-Bedingung: verhindert, dass ein paralleler Admin-Abschluss
  // von einem veralteten SALES-Request ueberschrieben wird.
  let res;
  try {
    res = await prisma.$transaction(async (tx) => {
      const r = await tx.salesLead.updateMany({ where: { id, status: lead.status }, data });
      if (r.count === 1) {
        // Neue Nummer: offene Anrufversuche fuer die alte Nummer verfallen.
        if (phoneChanged) await tx.callAttempt.updateMany({ where: { salesLeadId: id, log: null }, data: { expiresAt: new Date() } });
        // Abschluss: Wiedervorlagen beenden.
        if (data.status === "WON" || data.status === "LOST") {
          await tx.callTask.updateMany({ where: { salesLeadId: id, state: "OPEN" }, data: { state: "CANCELLED" } });
        }
      }
      return r;
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ message: "Diese Telefonnummer ist bereits bei einem anderen Lead erfasst." }, { status: 409 });
    }
    throw err;
  }
  if (res.count === 0) return NextResponse.json({ message: "Lead wurde zwischenzeitlich geaendert" }, { status: 409 });
  const updated = await prisma.salesLead.findUnique({ where: { id }, select: leadSelect });
  return NextResponse.json({ lead: updated });
}
