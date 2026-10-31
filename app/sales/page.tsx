import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getUserFromCookie } from "@/lib/auth";
import { getSalesProfile, listLeads, listReferredBookings } from "@/lib/sales/data";
import { referralLink, salesDemos, salesOffers, salesPackages, salesTaxNote, salesTerms } from "@/lib/sales/kit";
import SalesPortal from "@/components/SalesPortal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sales-Portal",
  robots: { index: false, follow: false },
};

export default async function SalesPage() {
  const me = await getUserFromCookie();
  if (!me || (me.role !== "SALES" && me.role !== "ADMIN")) redirect("/dashboard");

  const [profile, leads, bookings] = await Promise.all([
    getSalesProfile(me),
    listLeads(me),
    listReferredBookings(me),
  ]);

  return (
    <section className="section-pad">
      <div className="max-w-screen-xl mx-auto">
        <span className="label-mono block mb-6">Sales-Portal</span>
        <h1 className="page-title mb-8">Vertrieb</h1>
        <SalesPortal
          isAdmin={me.role === "ADMIN"}
          me={{ email: profile?.email ?? "", commissionPercent: profile?.commissionPercent ?? null }}
          referralUrl={profile?.referralCode ? referralLink(profile.referralCode) : null}
          initialLeads={JSON.parse(JSON.stringify(leads))}
          bookings={bookings.map((b) => ({
            id: b.id,
            email: b.email,
            createdAt: b.createdAt.toISOString(),
            start: b.slot.start.toISOString(),
            consultationType: b.consultationType,
            referredBy: b.referredBy?.email ?? null,
          }))}
          kit={{ packages: salesPackages, offers: salesOffers, demos: salesDemos, taxNote: salesTaxNote, terms: salesTerms }}
        />
      </div>
    </section>
  );
}
