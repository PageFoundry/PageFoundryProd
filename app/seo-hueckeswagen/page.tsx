import ServiceLanding, { type ServiceLandingData } from "@/components/landing/ServiceLanding";
import JsonLd, { getServiceSchema } from "@/components/JsonLd";
import { createPageMetadata } from "@/lib/seo/metadata";

const TITLE = "SEO Hückeswagen";
const DESCRIPTION =
  "SEO aus Hückeswagen für Unternehmen im Bergischen Land: Technik, Suchinhalte und interne Links gezielt verbessern. Google-Profil-Paket 149 €, AI-Readiness-Umsetzung 490 €. Kostenlose Erstberatung.";
const URL = "https://pagefoundry.de/seo-hueckeswagen";

const TAX_NOTE =
  "Alle Preise sind Endpreise. PageFoundry ist Kleinunternehmer nach § 19 UStG — es wird keine Umsatzsteuer ausgewiesen.";

export const metadata = createPageMetadata({
  path: "/seo-hueckeswagen",
  title: TITLE,
  description: DESCRIPTION,
  locale: "de_DE",
});

const data: ServiceLandingData = {
  eyebrow: "SEO · Hückeswagen",
  heroHeading: "SEO für Unternehmen in Hückeswagen und im Bergischen Land.",
  heroSubline:
    "Ich prüfe, bei welchen Suchanfragen Ihre Website erscheint, welche Seiten Besucher erreichen und wo der Kontaktweg stockt. Daraus entsteht ein konkreter Arbeitsplan für Technik, Inhalte und lokale Auffindbarkeit.",
  problem: {
    label: "Das Problem",
    heading: "Einblendungen sollen zu passenden Besuchern werden.",
    points: [
      "Die Seite hat Impressionen in Google, aber kaum Klicks — Snippet und Suchintention passen nicht zusammen.",
      "Wichtige Seiten sind schwer auffindbar, laden langsam oder erklären das Angebot nicht klar genug.",
      "Es fehlt eine nachvollziehbare Verbindung zwischen Suchbesuchern und eingehenden Anfragen.",
    ],
  },
  steps: {
    label: "So arbeite ich",
    heading: "Analyse zuerst. Dann Umsetzung.",
    items: [
      {
        title: "Bestandsaufnahme",
        text: "Ich prüfe Technik, Inhalte und Sichtbarkeit Ihrer Seite und zeigen, wo die größten Hebel liegen — ehrlich, auch wenn es heißt: hier lohnt sich wenig.",
      },
      {
        title: "Priorisierung",
        text: "Ich lege fest, welche Seiten und Suchintentionen zuerst bearbeitet werden: Snippets, Struktur, Technik, Inhalte — abgestimmt auf Ihr Angebot.",
      },
      {
        title: "Umsetzung & Kontrolle",
        text: "Ich setze die Maßnahmen um und beobachten, wie Impressionen, Klicks und Interaktion sich entwickeln. Weitere Optimierungsschritte vereinbare ich abhängig vom beauftragten Umfang.",
      },
    ],
  },
  included: {
    label: "Leistungsumfang",
    heading: "Diese Bereiche prüfe ich gemeinsam.",
    items: [
      "Technisches SEO: Ladezeiten, Crawlbarkeit, Struktur, Meta-Daten",
      "Inhaltliches SEO: Suchintention, Titles, Descriptions, interne Verlinkung",
      "Lokale Auffindbarkeit: verständliche Standortangaben und konsistente Kontaktdaten",
      "Verständliche Berichte: was wurde gemacht, was hat es bewegt",
    ],
    note: "Je nach Auftrag erhalten Sie eine priorisierte Maßnahmenliste aus der Analyse, eine Dokumentation der tatsächlich geänderten Punkte aus der Umsetzung und eine Auswertung verfügbarer Suchdaten aus der Kontrolle. Der konkrete Umfang wird im Angebot festgelegt. Rankings, Klickzahlen oder Umsatzsteigerungen kann ich nicht garantieren.",
  },
  pricing: {
    label: "Preise", heading: "Google-Profil, technische Lesbarkeit oder neue Website.",
    tiers: [
      { name: "Google-Profil-Paket", price: "149 €", priceNote: "einmalig", features: ["Unternehmensprofil einrichten oder bereinigen", "Kategorien, Leistungen, Fotos und Bewertungslink"] },
      { name: "AI-Readiness-Umsetzung", price: "490 €", priceNote: "einmalig", features: ["llms.txt und, wo sinnvoll, Korrektur der strukturierten Daten (JSON-LD)", "Behebung von bis zu drei im Report belegten technischen Befunden", "Einbau oder Überarbeitung einer kompakten Informations- oder FAQ-Sektion", "Prüfung der gelieferten Dateien auf der Live-Seite und kurzer Abschlussnachweis", "Eine Korrekturschleife für Umsetzungsfehler"] },
      { name: "Gefunden — Firmenwebsite mit lokaler SEO-Grundlage", price: "1.390 €", priceNote: "Kauf, einmalig", features: ["Bis zu 5 Seiten und Kontaktformular", "Google-Unternehmensprofil eingerichtet und lokale SEO", "Betreut nur für Unternehmen: 390 € Einrichtung + 79 €/Monat über 24 Monate", "4 Änderungen / 45 Min pro Monat; ab Monat 25 39 €/Monat mit 15 Min"] },
    ],
    footnote: `${TAX_NOTE} AI-Readiness: keine CMS-/Hosting-Migration oder Beschaffung von Zugängen, neuen Unterseiten, umfangreichen Texte oder Bildarbeiten. Keine Garantie für Rankings oder Erwähnungen in KI-Systemen. Befunde mit mehr als rund vier Arbeitsstunden erhalten nach Sichtung ein eigenes Angebot. Betreut: Domain ab Tag 1 auf Ihren Namen; Eigentum und Übergabepaket nach 24 Monaten oder Ablöse, jederzeit ablösbar; danach mit einem Monat Frist kündbar.`,
  },
  faq: {
    label: "FAQ",
    heading: "Häufige Fragen.",
    items: [
      {
        q: "Garantieren Sie ein bestimmtes Ranking?",
        a: "Nein. Google entscheidet, welche Ergebnisse angezeigt werden. Ich verbessere die technischen und inhaltlichen Voraussetzungen und prüfen anschließend die Entwicklung der verfügbaren Messwerte.",
      },
      {
        q: "Was ist der erste Schritt?",
        a: "Mit der kostenlosen Erstberatung. Zusätzlich prüft mein Website-Check auf audit.pagefoundry.de öffentlich abrufbare Inhalte auf technische Lesbarkeit und Struktur. Sein Score misst keine tatsächlichen Platzierungen oder Erwähnungen bei Google oder KI-Diensten.",
      },
      {
        q: "Unterscheidet sich lokales SEO von normaler Optimierung?",
        a: "Lokale Suche ergänzt das Angebot um einen Standortbezug. Ich prüfe beispielsweise, ob eine Seite zu einer Anfrage aus Hückeswagen, Remscheid oder Wermelskirchen passt und ob Leistungen und Einzugsgebiet verständlich beschrieben sind.",
      },
      {
        q: "Bringt SEO sofort etwas?",
        a: "Technische Änderungen lassen sich direkt prüfen. Bis Google Seiten erneut verarbeitet und sich Suchdaten verändern, kann deutlich mehr Zeit vergehen. Einen festen Termin für bessere Rankings verspreche ich nicht.",
      },
    ],
  },
  cta: {
    heading: "Erst sehen, dann optimieren.",
    text: "Kostenlose Erstberatung: Ich schaue mir Ihre Sichtbarkeit an und sage Ihnen, ob und wo SEO bei Ihnen Hebel hat — ehrlich und ohne Verkaufsdruck.",
  },
  related: {
    label: "Passende Seiten",
    items: [
      { label: "Webdesign Bergisches Land", href: "/webdesign-bergisches-land" },
      { label: "Website-Wache", href: "/website-wache" },
      { label: "KI-Sichtbarkeits-Check", href: "https://audit.pagefoundry.de" },
    ],
  },
};

export default function SeoHueckeswagenPage() {
  return (
    <>
      <JsonLd
        data={{
          ...getServiceSchema({ name: TITLE, description: DESCRIPTION, url: URL }),
          areaServed: [
            { "@type": "City", name: "Hückeswagen" },
            { "@type": "City", name: "Remscheid" },
            { "@type": "City", name: "Wermelskirchen" },
            { "@type": "City", name: "Wipperfürth" },
          ],
        }}
      />
      <ServiceLanding data={data} />
    </>
  );
}
