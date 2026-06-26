import Script from "next/script";
import { redirect } from "next/navigation";
import { getUserFromCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SocialAuditAdminPage() {
  const me = await getUserFromCookie();
  if (!me || me.role !== "ADMIN") redirect("/dashboard");

  return (
    <section className="section-pad">
      <link rel="stylesheet" href="/social-audit-ui/browser/styles.css" />
      <div className="mx-auto max-w-screen-xl space-y-8 fade-in">
        <div className="border-b border-pfBorder pb-7">
          <span className="label-mono mb-4 block">Pagefoundry · Social Audit</span>
          <h1
            className="leading-none text-pfText"
            style={{
              fontFamily: "var(--font-display), Impact, sans-serif",
              fontSize: "clamp(3rem, 7vw, 5rem)",
            }}
          >
            PF Social Audit
          </h1>
          <p className="mt-5 max-w-2xl text-sm text-pfSubtle">
            Interne Lead-Qualifizierung für Firmen mit Social-Media-Reichweite und schwacher Website-Technik.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href="/admin"
              className="inline-flex items-center rounded-sm border border-pfBorder px-4 py-2 font-mono text-[0.65rem] uppercase tracking-widest text-pfSubtle transition-colors hover:border-pfBorderAccent hover:text-pfAccent"
            >
              Admin Dashboard
            </a>
            <a
              href="/admin/hq"
              className="inline-flex items-center rounded-sm border border-pfBorder px-4 py-2 font-mono text-[0.65rem] uppercase tracking-widest text-pfSubtle transition-colors hover:border-pfBorderAccent hover:text-pfAccent"
            >
              HQ
            </a>
            <a
              href="/outreach"
              className="inline-flex items-center rounded-sm border border-pfBorder px-4 py-2 font-mono text-[0.65rem] uppercase tracking-widest text-pfSubtle transition-colors hover:border-pfBorderAccent hover:text-pfAccent"
            >
              Outreach Control
            </a>
          </div>
        </div>

        <div dangerouslySetInnerHTML={{ __html: "<pf-social-audit-app></pf-social-audit-app>" }} />
      </div>
      <Script src="/social-audit-ui/browser/polyfills.js" type="module" strategy="afterInteractive" />
      <Script src="/social-audit-ui/browser/main.js" type="module" strategy="afterInteractive" />
    </section>
  );
}
