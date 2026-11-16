import type { Metadata } from "next";
import { getServerI18n } from "@/i18n/server";
import { createPageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const { lang } = await getServerI18n();
  const isDe = lang === "de";
  return createPageMetadata({
    path: "/consultation",
    title: isDe ? "Kostenlose Erstberatung buchen" : "Free Consultation",
    description: isDe
      ? "Kostenlose Erstberatung zu Website, KI-Telefonassistenz oder Software: 30 Minuten per Zoom, unverbindlich. Oder kurz per WhatsApp oder Telefon melden."
      : "Book a free Zoom strategy call – 30 minutes, no obligation.",
    locale: isDe ? "de_DE" : "en_US",
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
