import { getUserFromCookie } from "@/lib/auth";
import OutreachAdminPanel from "@/components/OutreachAdminPanel";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

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
            Manueller Lauf fuer PLZ-Auswahl, Gate und Versand aus dem bestehenden Outreach-System.
          </p>
        </div>

        <OutreachAdminPanel />
      </div>
    </section>
  );
}
