import { prisma } from "@/lib/prisma";
import { getUserFromCookie } from "@/lib/auth";
import StatusBadge from "@/components/StatusBadge";
import StatusSelector from "@/components/StatusSelector";
import BriefEditor from "@/components/BriefEditor";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const me = getUserFromCookie();
  if (!me || me.role !== "ADMIN") return <div className="p-6 text-center text-red-500">Unauthorized</div>;

  const orders = await prisma.order.findMany({
    where: { NOT: { status: "DONE" } },
    include: { product: true, user: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <section className="relative z-10 px-6 py-16 text-white">
      <div className="mx-auto max-w-screen-xl">
        <h1 className="text-2xl font-semibold mb-6">Offene Projekte</h1>

        <div className="space-y-6">
          {orders.map((o) => (
            <div key={o.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <div className="font-medium">{o.product.name}</div>
                  <div className="text-xs text-zinc-400">
                    Kunde: {o.user.email} • Erstellt: {new Date(o.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={o.status} />
                  <StatusSelector orderId={o.id} value={o.status} />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-zinc-300 mb-2">Briefing</div>
                  <BriefEditor orderId={o.id} initial={o.brief as any} />
                </div>
                <div className="text-sm text-zinc-400">
                  <div className="mb-2">Checkliste:</div>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Brand-Farben (HEX)</li>
                    <li>Wording/Tonality, Haupt-Headlines</li>
                    <li>Bildmaterial oder Bild-Links</li>
                    <li>Referenzseiten</li>
                    <li>Besondere Funktionen/CTAs</li>
                    <li>Impressum/Datenschutz-Infos</li>
                  </ul>
                </div>
              </div>
            </div>
          ))}

          {orders.length === 0 && <div className="text-zinc-400 text-sm">Keine offenen Projekte.</div>}
        </div>
      </div>
    </section>
  );
}
