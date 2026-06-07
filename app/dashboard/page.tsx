import { prisma } from "@/lib/prisma";
import { getUserFromCookie } from "@/lib/auth";
import { getServerI18n } from "@/i18n/server";
import StatusBadge from "@/components/StatusBadge";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Manage your orders and projects.",
  robots: "noindex",
};

type OrderRow = {
  id: string;
  status: "RECEIVED" | "IN_PROGRESS" | "DONE";
  createdAt: Date;
  product: { name: string; priceCents: number };
};

export default async function DashboardPage() {
  const { t, lang } = await getServerI18n();
  const user = await getUserFromCookie();

  if (!user) {
    return (
      <section className="section-pad">
        <div className="max-w-screen-xl mx-auto">
          <span className="label-mono block mb-6">Dashboard</span>
          <h1 className="page-title mb-4">{t("dashboard.title")}</h1>
          <p className="text-pfSubtle">{t("dashboard.needLogin")}</p>
        </div>
      </section>
    );
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.sub },
    select: { email: true },
  });

  const rows = (await prisma.order.findMany({
    where: { userId: user.sub },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      createdAt: true,
      product: { select: { name: true, priceCents: true } },
    },
  })) as unknown as OrderRow[];

  const money = new Intl.NumberFormat(lang === "de" ? "de-DE" : "en-US", {
    style: "currency",
    currency: "EUR",
  });

  const fmt = new Intl.DateTimeFormat(lang === "de" ? "de-DE" : "en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });

  return (
    <section className="section-pad">
      <div className="max-w-screen-xl mx-auto fade-in">

        {/* Header */}
        <div className="mb-12 border-b border-pfBorder pb-8">
          <span className="label-mono block mb-4">Customer Portal</span>
          <h1
            className="leading-none text-pfText"
            style={{
              fontFamily: "var(--font-display), Impact, sans-serif",
              fontSize: "clamp(3rem, 7vw, 5.5rem)",
            }}
          >
            {t("dashboard.title")}
          </h1>
          <p className="text-pfSubtle text-sm mt-3">{dbUser?.email ?? ""}</p>
        </div>

        {/* Orders */}
        <div>
          <span className="label-mono block mb-6">{t("dashboard.orders")}</span>

          {rows.length === 0 ? (
            <div className="pf-card p-8 text-pfMuted text-xs font-mono tracking-widest uppercase">
              {t("dashboard.noOrders")}
            </div>
          ) : (
            <div className="pf-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="pf-table">
                  <thead>
                    <tr>
                      <th>{t("dashboard.col.product")}</th>
                      <th>{t("dashboard.col.amount")}</th>
                      <th>{t("dashboard.col.status")}</th>
                      <th>{t("dashboard.col.date")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id}>
                        <td className="font-medium text-pfText">
                          {r.product?.name ?? t("dashboard.unknownProduct")}
                        </td>
                        <td
                          className="text-sm text-pfAccent"
                          style={{ fontFamily: "var(--font-mono)" }}
                        >
                          {money.format((r.product?.priceCents ?? 0) / 100)}
                        </td>
                        <td>
                          <StatusBadge status={r.status} />
                        </td>
                        <td className="text-pfMuted text-xs" style={{ fontFamily: "var(--font-mono)" }}>
                          {fmt.format(new Date(r.createdAt))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

      </div>
    </section>
  );
}
