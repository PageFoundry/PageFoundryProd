import type { Metadata } from "next";
import { getServerI18n } from "@/i18n/server";
import { createPageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const { lang } = await getServerI18n();
  const isDe = lang === "de";
  return createPageMetadata({
    path: "/consultation",
    title: isDe ? "Kostenlose Beratung" : "Free Consultation",
    description: isDe
      ? "Kostenloses Zoom-Beratungsgespräch buchen – 30 Minuten, unverbindlich."
      : "Book a free Zoom strategy call – 30 minutes, no obligation.",
    locale: isDe ? "de_DE" : "en_US",
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
