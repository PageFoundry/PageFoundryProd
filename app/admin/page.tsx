import { prisma } from "@/lib/prisma";
import { getUserFromCookie } from "@/lib/auth";
import { getAdminOverview } from "@/lib/adminOverview";
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
  email: string;
  phone: string | null;
  preferredTime: string;
  note: string | null;
  createdAt: Date;
};

export default async function AdminPage() {
  const me = await getUserFromCookie();
  if (!me || me.role !== "ADMIN") redirect("/dashboard");
  const overview = await getAdminOverview();

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

  const consultationBookings = await prisma.consultationBooking.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      slot: { select: { start: true, end: true } },
      user: { select: { name: true, email: true, phone: true } },
    },
  });

  const consultations: ConsultationRow[] = consultationBookings.map((booking) => ({
    id: booking.id,
    name: booking.user?.name || booking.email,
    email: booking.email,
    phone: booking.user?.phone ?? null,
    preferredTime: `${booking.slot.start.toISOString()} - ${booking.slot.end.toISOString()}`,
    note: booking.description,
    createdAt: booking.createdAt,
  }));

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
  const shortDateFmt = new Intl.DateTimeFormat("de-DE", {
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  });

  const activeProcesses = overview.processes.filter((process) => process.status === "online").length;
  const offlineProcesses = overview.processes.length - activeProcesses;
  const ownedSites = overview.websites.filter((site) => site.owner === "pagefoundry");
  const managedSites = overview.websites.filter((site) => site.owner === "customer");
  const supportOpportunities = overview.opportunities;

  function opportunityTone(severity: "high" | "medium" | "low") {
    if (severity === "high") return "border-red-500/30 bg-red-500/[0.06] text-red-300";
    if (severity === "medium") return "border-amber-500/30 bg-amber-500/[0.06] text-amber-200";
    return "border-pfBorder bg-pfSurface/40 text-pfText";
  }

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
            VPS-, Website- und Vertriebsstatus an einem Ort.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="/api/admin/knowledge-graph"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-sm border border-pfBorderAccent bg-pfAccentDim px-4 py-2 font-mono text-[0.65rem] uppercase tracking-widest text-pfAccent transition-colors hover:bg-pfAccent hover:text-black"
            >
              Second Brain Graph öffnen
            </a>
            <a
              href="/outreach"
              className="inline-flex items-center rounded-sm border border-pfBorder px-4 py-2 font-mono text-[0.65rem] uppercase tracking-widest text-pfSubtle transition-colors hover:border-pfBorderAccent hover:text-pfAccent"
            >
              Outreach Control
            </a>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="pf-card p-5">
            <span className="label-mono block mb-3">Host</span>
            <div className="text-2xl text-pfText font-semibold">{overview.system.hostname}</div>
            <div className="text-pfMuted text-xs font-mono mt-2 break-all">{overview.system.uptime}</div>
          </div>
          <div className="pf-card p-5">
            <span className="label-mono block mb-3">Load</span>
            <div className="text-2xl text-pfText font-semibold">{overview.system.loadAverage}</div>
            <div className="text-pfMuted text-xs font-mono mt-2">
              RAM {overview.system.memory.usedMb ?? "–"}/{overview.system.memory.totalMb ?? "–"} MB
            </div>
          </div>
          <div className="pf-card p-5">
            <span className="label-mono block mb-3">PM2</span>
            <div className="text-2xl text-pfText font-semibold">
              {activeProcesses}/{overview.processes.length}
            </div>
            <div className="text-pfMuted text-xs font-mono mt-2">
              {offlineProcesses > 0 ? `${offlineProcesses} nicht online` : "alle Prozesse online"}
            </div>
          </div>
          <div className="pf-card p-5">
            <span className="label-mono block mb-3">Disk</span>
            <div className="text-2xl text-pfText font-semibold">
              {overview.system.disk?.usedPercent ?? "–"}
            </div>
            <div className="text-pfMuted text-xs font-mono mt-2">
              {overview.system.disk ? `${overview.system.disk.used} / ${overview.system.disk.size}` : "unavailable"}
            </div>
          </div>
        </div>

        <div className="pf-card p-6">
          <div className="flex items-baseline justify-between mb-6">
            <span className="label-mono">Support Opportunities</span>
            <span className="text-pfMuted font-mono text-[0.6rem]">
              priorisiert nach Ausfall- und Vertriebsrelevanz
            </span>
          </div>
          {supportOpportunities.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {supportOpportunities.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-xl border p-4 ${opportunityTone(item.severity)}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-mono uppercase tracking-wider opacity-80">
                        {item.scope}
                      </div>
                      <div className="mt-2 text-lg font-semibold">{item.title}</div>
                    </div>
                    <span className="status-badge border-current/30 bg-black/10 text-current">
                      {item.severity}
                    </span>
                  </div>
                  <div className="mt-3 text-sm opacity-90">{item.detail}</div>
                  <div className="mt-3 text-xs font-mono opacity-70 break-all">{item.target}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-green-500/30 bg-green-500/[0.06] p-4 text-green-200">
              Keine akuten Auffaelligkeiten im letzten Snapshot.
            </div>
          )}
        </div>

        <div className="pf-card p-6">
          <div className="flex items-baseline justify-between mb-6">
            <span className="label-mono">Pagefoundry Sites</span>
            <span className="text-pfMuted font-mono text-[0.6rem]">
              letzter Snapshot {shortDateFmt.format(new Date(overview.generatedAt))}
            </span>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {ownedSites.map((site) => (
              <div key={site.name} className="rounded-xl border border-pfBorder bg-pfSurface/40 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-pfText text-lg font-semibold">{site.name}</div>
                    <div className="text-pfMuted text-xs mt-1">{site.note}</div>
                  </div>
                  <span
                    className={`status-badge ${
                      site.ok
                        ? "border-green-500/30 text-green-400 bg-green-500/[0.07]"
                        : "border-red-500/30 text-red-400 bg-red-500/[0.07]"
                    }`}
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {site.ok ? "OK" : "Down"}
                  </span>
                </div>
                <a
                  href={site.url}
                  target="_blank"
                  className="mt-4 block text-pfAccent hover:underline break-all text-sm"
                >
                  {site.url}
                </a>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-pfMuted text-[0.7rem] uppercase tracking-wider">HTTP</div>
                    <div className="text-pfText font-mono">{site.httpStatus ?? "–"}</div>
                  </div>
                  <div>
                    <div className="text-pfMuted text-[0.7rem] uppercase tracking-wider">Latency</div>
                    <div className="text-pfText font-mono">{site.latencyMs ? `${site.latencyMs} ms` : "–"}</div>
                  </div>
                </div>
                <div className="mt-4 text-xs text-pfMuted font-mono">
                  Deploy-Ordner: {site.deployUpdatedAt ? shortDateFmt.format(new Date(site.deployUpdatedAt)) : "–"}
                </div>
                <div className="mt-2 text-xs text-pfMuted font-mono">
                  TLS: {site.tlsValidTo ? shortDateFmt.format(new Date(site.tlsValidTo)) : "–"}
                </div>
                {site.error && (
                  <div className="mt-3 text-xs text-red-400 font-mono break-all">{site.error}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="pf-card p-6">
          <div className="flex items-baseline justify-between mb-6">
            <span className="label-mono">Managed Customer Sites</span>
            <span className="text-pfMuted font-mono text-[0.6rem]">
              HTTP/TLS immer, Fremd-VPS nur mit Zugriff
            </span>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {managedSites.map((site) => (
              <div key={site.name} className="rounded-xl border border-pfBorder bg-pfSurface/40 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-pfText text-lg font-semibold">{site.name}</div>
                    <div className="text-pfMuted text-xs mt-1">{site.note}</div>
                  </div>
                  <span
                    className={`status-badge ${
                      site.ok
                        ? "border-green-500/30 text-green-400 bg-green-500/[0.07]"
                        : "border-red-500/30 text-red-400 bg-red-500/[0.07]"
                    }`}
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {site.ok ? "OK" : "Down"}
                  </span>
                </div>
                <a
                  href={site.url}
                  target="_blank"
                  className="mt-4 block text-pfAccent hover:underline break-all text-sm"
                >
                  {site.url}
                </a>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-pfMuted text-[0.7rem] uppercase tracking-wider">HTTP</div>
                    <div className="text-pfText font-mono">{site.httpStatus ?? "–"}</div>
                  </div>
                  <div>
                    <div className="text-pfMuted text-[0.7rem] uppercase tracking-wider">Latency</div>
                    <div className="text-pfText font-mono">{site.latencyMs ? `${site.latencyMs} ms` : "–"}</div>
                  </div>
                </div>
                <div className="mt-4 text-xs text-pfMuted font-mono">
                  Deployment: {site.deployment}
                </div>
                <div className="mt-2 text-xs text-pfMuted font-mono">
                  Monitoring: {site.monitoring === "local_vps" ? "lokaler VPS" : "externes HTTP/TLS"}
                </div>
                <div className="mt-2 text-xs text-pfMuted font-mono">
                  Repo-Stand: {site.deployUpdatedAt ? shortDateFmt.format(new Date(site.deployUpdatedAt)) : "–"}
                </div>
                <div className="mt-2 text-xs text-pfMuted font-mono">
                  TLS: {site.tlsValidTo ? shortDateFmt.format(new Date(site.tlsValidTo)) : "–"}
                </div>
                {site.error && (
                  <div className="mt-3 text-xs text-red-400 font-mono break-all">{site.error}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <div className="pf-card p-6">
            <div className="flex items-baseline justify-between mb-6">
              <span className="label-mono">Services & Infra</span>
              <span className="text-pfMuted font-mono text-[0.6rem]">
                nginx {overview.infra.nginx}
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-pfBorder bg-pfSurface/40 p-4">
                <div className="text-pfMuted text-[0.7rem] uppercase tracking-wider mb-3">Ports</div>
                <div className="space-y-2 text-sm font-mono">
                  <div className="flex justify-between gap-4">
                    <span>Postgres :5432</span>
                    <span className={overview.infra.postgres5432 ? "text-green-400" : "text-red-400"}>
                      {overview.infra.postgres5432 ? "listening" : "down"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-pfBorder bg-pfSurface/40 p-4">
                <div className="text-pfMuted text-[0.7rem] uppercase tracking-wider mb-3">Dateisystem</div>
                <div className="space-y-2 text-sm font-mono">
                  <div className="flex justify-between gap-4">
                    <span>Mount</span>
                    <span className="text-pfText">{overview.system.disk?.mount ?? "–"}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Verfügbar</span>
                    <span className="text-pfText">{overview.system.disk?.available ?? "–"}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Frei RAM</span>
                    <span className="text-pfText">{overview.system.memory.freeMb ?? "–"} MB</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <span className="label-mono block mb-3">Cron</span>
              <div className="rounded-sm border border-pfBorder bg-pfSurface/30 p-4 font-mono text-xs text-pfSubtle space-y-2">
                {overview.infra.cronEntries.length > 0 ? (
                  overview.infra.cronEntries.map((entry) => <div key={entry}>{entry}</div>)
                ) : (
                  <div>Keine Cron-Einträge gefunden.</div>
                )}
              </div>
            </div>
          </div>

          <div className="pf-card p-6">
            <div className="flex items-baseline justify-between mb-6">
              <span className="label-mono">PM2 Prozesse</span>
              <span className="text-pfMuted font-mono text-[0.6rem]">{overview.processes.length} total</span>
            </div>
            <div className="space-y-3">
              {overview.processes.map((process) => (
                <div key={process.name} className="rounded-xl border border-pfBorder bg-pfSurface/40 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-pfText font-semibold">{process.name}</div>
                    <span
                      className={`status-badge ${
                        process.status === "online"
                          ? "border-green-500/30 text-green-400 bg-green-500/[0.07]"
                          : "border-red-500/30 text-red-400 bg-red-500/[0.07]"
                      }`}
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {process.status}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-3 text-xs font-mono text-pfSubtle">
                    <div>
                      <div className="text-pfMuted">Uptime</div>
                      <div className="text-pfText mt-1">{process.uptime}</div>
                    </div>
                    <div>
                      <div className="text-pfMuted">CPU</div>
                      <div className="text-pfText mt-1">{process.cpu}</div>
                    </div>
                    <div>
                      <div className="text-pfMuted">RAM</div>
                      <div className="text-pfText mt-1">
                        {process.memoryMb !== null ? `${Math.round(process.memoryMb)} MB` : "–"}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
