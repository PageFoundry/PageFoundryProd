import type { Metadata } from "next";
import { getServerI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { lang } = await getServerI18n();
  return {
    title: lang === "de" ? "Login – Kundenportal" : "Login – customer portal",
    description:
      lang === "de"
        ? "Anmeldung zum PageFoundry-Kundenportal für Bestandskunden."
        : "Sign in to the PageFoundry customer portal for existing clients.",
    robots: "noindex",
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
