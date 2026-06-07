import type { Metadata } from "next";
import ServiceLanding, { type ServiceLandingData } from "@/components/landing/ServiceLanding";

const TITLE = "Website-Wache";
const DESCRIPTION =
  "Website-Wache von PageFoundry: Wir überwachen Erreichbarkeit, SSL-Zertifikat und Ladezeit Ihrer Website rund um die Uhr, melden Probleme früh und halten die Seite sauber. Ab 39 €/Monat.";
const URL = "https://pagefoundry.de/website-wache";

const TAX_NOTE =
  "Alle Preise sind Endpreise, monatlich kündbar. PageFoundry ist Kleinunternehmer nach § 19 UStG — es wird keine Umsatzsteuer ausgewiesen.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: { url: URL, title: `${TITLE} · PageFoundry`, description: DESCRIPTION },
};

const data: ServiceLandingData = {
  eyebrow: "Website-Wache",
  heroHeading: "Ihre Website im Blick — bevor der Kunde den Ausfall meldet.",
  heroSubline:
    "Wir überwachen Erreichbarkeit, SSL-Zertifikat und Ladezeit Ihrer Website rund um die Uhr, melden Probleme früh und halten die Seite mit kleinen Updates sauber. Damit Ihre Online-Visitenkarte nicht still verfällt.",
  problem: {
    label: "Das Problem",
    heading: "Die meisten Website-Probleme fallen zuerst dem Kunden auf.",
    points: [
      "Ein abgelaufenes SSL-Zertifikat macht die Seite mit einer dicken Warnung unbenutzbar — oft tagelang unbemerkt.",
      "Ausfälle beim Hoster bekommen Sie meist erst mit, wenn jemand anruft.",
      "Langsame Ladezeiten kosten Besucher und Google-Ranking, ganz ohne sichtbaren Fehler.",
    ],
  },
  steps: {
    label: "So funktioniert's",
    heading: "Überwachung, die mitdenkt.",
    items: [
      {
        title: "Einrichten",
        text: "Wir nehmen Ihre Website in die Überwachung auf — Erreichbarkeit, SSL und Antwortzeit, von außen, ganz ohne Eingriff in Ihre Seite.",
      },
      {
        title: "Überwachen & melden",
        text: "Rund um die Uhr prüfen wir Ihre Seite. Fällt etwas auf — Ausfall, ablaufendes Zertifikat, hohe Latenz — schlagen wir früh Alarm.",
      },
      {
        title: "Berichten & pflegen",
        text: "Sie bekommen einen monatlichen Kurzbericht und je nach Paket Zeit für kleine Korrekturen und Updates.",
      },
    ],
  },
  included: {
    label: "Leistungsumfang",
    heading: "Was wir im Blick behalten.",
    items: [
      "Erreichbarkeit (Uptime) rund um die Uhr",
      "SSL-Zertifikat und rechtzeitige Ablauf-Warnung",
      "Antwort- und Ladezeit",
      "Monatlicher Kurzbericht in Klartext",
      "Kleine inhaltliche und technische Korrekturen (je nach Paket)",
      "Fester Ansprechpartner statt Hotline",
    ],
    note: "Ehrlich gesagt: Die Überwachung läuft von außen über HTTP, TLS und Antwortzeit. Das deckt die häufigsten Ausfälle früh ab — ist aber kein automatisches Reparieren jeder denkbaren Störung. Was wir beheben, halten wir im Bericht fest.",
  },
  pricing: {
    label: "Preise",
    heading: "Drei Stufen, monatlich kündbar.",
    tiers: [
      {
        name: "Basic",
        price: "39 €",
        priceNote: "pro Monat",
        features: [
          "Uptime-, SSL- & Ladezeit-Überwachung",
          "Frühwarnung bei Problemen",
          "Monatlicher Kurzbericht",
        ],
      },
      {
        name: "Care",
        price: "79 €",
        priceNote: "pro Monat",
        highlight: true,
        features: [
          "Alles aus Basic",
          "Bis zu 60 Min. Kleinfixes pro Monat",
          "Updates nach Absprache",
          "Bevorzugte Bearbeitung",
        ],
      },
      {
        name: "Care+SEO",
        price: "149 €",
        priceNote: "pro Monat",
        features: [
          "Alles aus Care",
          "Laufende SEO-Pflege",
          "Sichtbarkeits- & Performance-Check",
          "Erweiterter Monatsbericht",
        ],
      },
    ],
    footnote: TAX_NOTE,
  },
  faq: {
    label: "FAQ",
    heading: "Häufige Fragen.",
    items: [
      {
        q: "Muss ich meinen Hoster wechseln?",
        a: "Nein. Die Website-Wache läuft unabhängig von Ihrem Hoster und überwacht Ihre Seite von außen.",
      },
      {
        q: "Was kostet es, wenn mal mehr zu tun ist?",
        a: "Kleinere Arbeiten sind je nach Paket inklusive. Größere Aufgaben stimmen wir vorher transparent ab — keine Überraschungen auf der Rechnung.",
      },
      {
        q: "Bekomme ich mit, was passiert?",
        a: "Ja. Jeden Monat gibt es einen verständlichen Kurzbericht: Verfügbarkeit, Auffälligkeiten und was wir erledigt haben.",
      },
      {
        q: "Kann ich monatlich kündigen?",
        a: "Ja, die Pakete sind monatlich kündbar.",
      },
    ],
  },
  cta: {
    heading: "Sollen wir Ihre Seite in die Wache nehmen?",
    text: "Wir schauen uns Ihre Website kurz an und sagen Ihnen ehrlich, welches Paket sinnvoll ist — kostenlos und unverbindlich.",
  },
};

export default function WebsiteWachePage() {
  return <ServiceLanding data={data} />;
}
