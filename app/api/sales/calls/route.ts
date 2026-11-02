import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse, forbidden, salesActor } from "@/lib/sales/http";
import { getOrStartBatch, loadCallView } from "@/lib/sales/callList";
import { berlinDay, dayToDbDate, demoForBranch, GUIDE, websiteSearchUrl } from "@/lib/sales/callGuide";
import { detectBranch } from "@/lib/sales/ranking";
import { formatPhoneDE } from "@/lib/sales/phone";

export const dynamic = "force-dynamic";

// GET: Tagesliste des Verkaeufers. ACHTUNG: erzeugt beim ersten Aufruf des Tages die
// Liste (reserviert Firmen) – kein read-only Healthcheck. ADMIN sieht nur, erzeugt nichts.
export async function GET() {
  const actor = await salesActor();
  if (!actor) return forbidden();
  try {
    if (actor.role === "ADMIN") {
      const batches = await prisma.callListBatch.findMany({
        where: { day: dayToDbDate(berlinDay()) },
        include: { owner: { select: { email: true, name: true } }, entries: { orderBy: { rank: "asc" }, select: { id: true, rank: true, tier: true, companyName: true, city: true, status: true, reasonText: true } } },
      });
      return NextResponse.json({ admin: true, batches });
    }
    const batch = await getOrStartBatch(actor.sub);
    const view = await loadCallView(actor.sub);
    const b = view.batch ?? { ...batch, entries: [] };
    return NextResponse.json({
      admin: false,
      day: view.day,
      batch: {
        state: b.state,
        targetCount: b.targetCount,
        actualCount: b.actualCount,
        note: b.note,
        entries: (b.state === "READY" ? b.entries : []).map((e) => {
          const branch = detectBranch(e.companyName);
          return {
            id: e.id,
            rank: e.rank,
            tier: e.tier,
            status: e.status,
            companyName: e.companyName,
            city: e.city,
            plz: e.plz,
            phoneDisplay: formatPhoneDE(e.phoneNorm),
            isMobile: e.isMobile,
            website: e.website,
            reasonText: e.reasonText,
            salesLeadId: e.salesLeadId,
            searchUrl: websiteSearchUrl(e.companyName, e.city, e.plz),
            demoUrl: demoForBranch(branch),
            opener: GUIDE.intro(e.tier, e.companyName, "{REP}"),
          };
        }),
      },
      tasks: view.tasks.map((t) => ({
        id: t.id,
        kind: t.kind,
        nextAttemptAt: t.nextAttemptAt.toISOString(),
        failedAttempts: t.failedAttempts,
        lead: {
          id: t.salesLead.id,
          companyName: t.salesLead.companyName,
          contactName: t.salesLead.contactName,
          phoneDisplay: t.salesLead.phoneNorm ? formatPhoneDE(t.salesLead.phoneNorm) : t.salesLead.phone,
          website: t.salesLead.website,
          status: t.salesLead.status,
          lastLog: t.salesLead.callLogs[0] ?? null,
        },
      })),
    });
  } catch (err) {
    return errorResponse(err, "sales/calls GET");
  }
}
