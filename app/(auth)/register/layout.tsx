import type { Metadata } from "next";
import { getServerI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { lang } = await getServerI18n();
  return {
    title: lang === "de" ? "Registrieren – Kundenportal" : "Register – customer portal",
    description:
      lang === "de"
        ? "Konto für das PageFoundry-Kundenportal anlegen."
        : "Create an account for the PageFoundry customer portal.",
    robots: "noindex",
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
