import { prisma } from "@/lib/prisma";
import { getUserFromCookie } from "@/lib/auth";
import { redirect } from "next/navigation";
import StatusBadge from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

type AdminOrderRow = {
  id: string;
  status: "RECEIVED" | "IN_PROGRESS" | "DONE";
  createdAt: Date;
  priceCents: number;
  productName: string;
  user: { id: string; email: string; phone: string | null; createdAt: Date };
};

type ConsultationRow = {
  id: string;
  name: string;
  phone: string | null;
  preferredTime: string;
  note: string | null;
  createdAt: Date;
};

export default async function AdminPage() {
  const me = await getUserFromCookie();
  if (!me || me.role !== "ADMIN") redirect("/dashboard");

  const ordersRaw = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, status: true, createdAt: true, priceCents: true,
      product: { select: { name: true } },
      user: { select: { id: true, email: true, phone: true, createdAt: true } },
    },
  });

  const orders: AdminOrderRow[] = ordersRaw.map((o) => ({
    id: o.id,
    status: o.status as AdminOrderRow["status"],
    createdAt: o.createdAt,
    priceCents: o.priceCents,
    productName: o.product?.name ?? "Unknown product",
    user: o.user!,
  }));

  let consultations: ConsultationRow[] = [];
  try {
    consultations = (await prisma.$queryRawUnsafe<ConsultationRow[]>(
      'SELECT * FROM "ConsultationRequest" ORDER BY "createdAt" ASC'
    )) as ConsultationRow[];
  } catch (e) {
    consultations = [];
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekdayMonBased = (firstOfMonth.getDay() + 6) % 7;

  const bookingsPerDay = new Map<string, number>();
  for (const c of consultations) {
    const key = new Date(c.createdAt).toISOString().slice(0, 10);
    bookingsPerDay.set(key, (bookingsPerDay.get(key) ?? 0) + 1);
  }

  const monthLabel = now.toLocaleDateString("de-DE", { month: "long", year: "numeric" });

  const money = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });
  const dateFmt = new Intl.DateTimeFormat("de-DE", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });

  return (
    <section className="section-pad">
      <div className="max-w-screen-xl mx-auto space-y-12 fade-in">

        {/* Header */}
        <div className="border-b border-pfBorder pb-8">
          <span className="label-mono block mb-4">Control Panel · Admin</span>
          <h1
            className="leading-none text-pfText"
            style={{
              fontFamily: "var(--font-display), Impact, sans-serif",
              fontSize: "clamp(3rem, 7vw, 5rem)",
            }}
          >
            Admin Dashboard
          </h1>
          <p className="text-pfSubtle text-sm mt-3">
            Beratungsanfragen &amp; Bestellungen auf einen Blick.
          </p>
        </div>

        {/* Calendar */}
        <div className="pf-card p-6">
          <div className="flex items-baseline justify-between mb-6">
            <span className="label-mono">Beratungen — {monthLabel}</span>
            <span className="text-pfMuted font-mono text-[0.6rem]">
              {consultations.length} Anfragen gesamt
            </span>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 text-center mb-2">
            {["Mo","Di","Mi","Do","Fr","Sa","So"].map(d => (
              <div key={d} className="text-pfMuted font-mono text-[0.58rem] tracking-widest uppercase py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstWeekdayMonBased }).map((_, i) => (
              <div key={`e-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const date = new Date(year, month, day);
              const key = date.toISOString().slice(0, 10);
              const count = bookingsPerDay.get(key) ?? 0;
              return (
                <div
                  key={key}
                  className={`h-14 rounded-sm border flex flex-col justify-between px-1.5 py-1 ${
                    count > 0
                      ? "border-pfBorderAccent bg-pfAccentDim"
                      : "border-pfBorder bg-pfSurface/50"
                  }`}
                >
                  <span className="font-mono text-[0.6rem] text-pfSubtle">{day}</span>
                  {count > 0 && (
                    <span
                      className="self-end text-[0.55rem] font-bold font-mono text-black bg-pfAccent rounded-sm px-1"
                    >
                      {count}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Consultations list */}
          {consultations.length > 0 && (
            <div className="mt-6">
              <span className="label-mono block mb-3">Chronologisch</span>
              <div className="max-h-64 overflow-y-auto rounded-sm border border-pfBorder">
                <table className="pf-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Telefon</th>
                      <th>Slot</th>
                      <th>Notiz</th>
                      <th>Buchung</th>
                    </tr>
                  </thead>
                  <tbody>
                    {consultations.map((c) => (
                      <tr key={c.id}>
                        <td className="text-pfText font-medium">{c.name}</td>
                        <td className="text-pfSubtle font-mono text-xs">{c.phone || "–"}</td>
                        <td className="text-pfAccent font-mono text-xs">{c.preferredTime}</td>
                        <td className="text-pfMuted text-xs max-w-[200px] truncate">{c.note || "–"}</td>
                        <td className="text-pfMuted font-mono text-xs whitespace-nowrap">
                          {dateFmt.format(new Date(c.createdAt))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {consultations.length === 0 && (
            <p className="text-pfMuted text-xs font-mono mt-4 tracking-wide">
              Noch keine Beratungsanfragen.
            </p>
          )}
        </div>

        {/* Orders */}
        <div className="pf-card p-6">
          <div className="flex items-baseline justify-between mb-6">
            <span className="label-mono">Bestellungen</span>
            <span className="text-pfMuted font-mono text-[0.6rem]">
              {orders.length} total
            </span>
          </div>

          {orders.length === 0 ? (
            <p className="text-pfMuted text-xs font-mono tracking-wide">Noch keine Bestellungen.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="pf-table">
                <thead>
                  <tr>
                    <th>Kunde</th>
                    <th>Produkt</th>
                    <th>Betrag</th>
                    <th>Status</th>
                    <th>Datum</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td>
                        <div className="relative group inline-block">
                          <span className="text-pfText font-medium text-sm">
                            {o.user.email || "–"}
                          </span>
                          {o.user.phone && (
                            <div className="text-pfMuted font-mono text-[0.65rem] mt-0.5">
                              {o.user.phone}
                            </div>
                          )}
                          {/* Hover tooltip */}
                          <div className="absolute left-0 top-full mt-1 hidden w-72 rounded-sm border border-pfBorderMid bg-pfCard p-3 text-xs shadow-xl group-hover:block z-50">
                            <span className="label-mono block mb-2">Kaufinfo</span>
                            <span className="text-pfSubtle">
                              {o.productName} · {dateFmt.format(new Date(o.createdAt))} · {money.format((o.priceCents ?? 0) / 100)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="text-pfSubtle">{o.productName}</td>
                      <td className="text-pfAccent font-mono text-sm font-bold">
                        {money.format((o.priceCents ?? 0) / 100)}
                      </td>
                      <td>
                        <StatusBadge status={o.status} />
                      </td>
                      <td className="text-pfMuted font-mono text-xs">
                        {dateFmt.format(new Date(o.createdAt))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </section>
  );
}
