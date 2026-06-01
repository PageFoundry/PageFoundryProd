import { redirect } from "next/navigation";
import { getUserFromCookie } from "@/lib/auth";
import { getPagefoundryHqSnapshot } from "@/lib/pagefoundryHq";
import PagefoundryHqPanel from "@/components/PagefoundryHqPanel";

export const dynamic = "force-dynamic";

export default async function PagefoundryHqPage() {
  const me = await getUserFromCookie();
  if (!me || me.role !== "ADMIN") redirect("/dashboard");

  const snapshot = JSON.parse(JSON.stringify(await getPagefoundryHqSnapshot()));

  return (
    <section className="section-pad">
      <div className="mx-auto max-w-screen-xl space-y-8 fade-in">
        <div className="border-b border-pfBorder pb-7">
          <span className="label-mono mb-4 block">Pagefoundry · HQ</span>
          <h1
            className="leading-none text-pfText"
            style={{
              fontFamily: "var(--font-display), Impact, sans-serif",
              fontSize: "clamp(3rem, 7vw, 5rem)",
            }}
          >
            Services & Rechnungen
          </h1>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href="/admin"
              className="inline-flex items-center rounded-sm border border-pfBorder px-4 py-2 font-mono text-[0.65rem] uppercase tracking-widest text-pfSubtle transition-colors hover:border-pfBorderAccent hover:text-pfAccent"
            >
              Admin Dashboard
            </a>
            <a
              href="/outreach"
              className="inline-flex items-center rounded-sm border border-pfBorder px-4 py-2 font-mono text-[0.65rem] uppercase tracking-widest text-pfSubtle transition-colors hover:border-pfBorderAccent hover:text-pfAccent"
            >
              Outreach Control
            </a>
          </div>
        </div>

        <PagefoundryHqPanel snapshot={snapshot} />
      </div>
    </section>
  );
}
