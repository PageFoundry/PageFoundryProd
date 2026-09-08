import type { Metadata } from "next";
import { getUserFromCookie } from "@/lib/auth";
import OutreachAdminPanel from "@/components/OutreachAdminPanel";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Access is enforced by the redirect() below, not by this metadata — this
// only keeps the internal admin panel out of search index listings.
export const metadata: Metadata = {
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default async function OutreachPage() {
  const me = await getUserFromCookie();
  if (!me || me.role !== "ADMIN") redirect("/dashboard");

  return (
    <section className="section-pad">
      <div className="mx-auto max-w-screen-xl space-y-10 fade-in">
        <div className="border-b border-pfBorder pb-8">
          <span className="label-mono block mb-4">Control Panel · Outreach</span>
          <h1
            className="leading-none text-pfText"
            style={{
              fontFamily: "var(--font-display), Impact, sans-serif",
              fontSize: "clamp(3rem, 7vw, 5rem)",
            }}
          >
            Outreach
          </h1>
          <p className="mt-3 text-sm text-pfSubtle">
            Manueller Lauf fuer PLZ-Auswahl, Gate, Review und anschliessende Freigabe.
          </p>
        </div>

        <OutreachAdminPanel />
      </div>
    </section>
  );
}
