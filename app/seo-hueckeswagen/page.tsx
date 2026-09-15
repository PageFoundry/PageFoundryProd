import { productDisplayInfo } from "@/lib/products";
import ServiceLanding, { type ServiceLandingData } from "@/components/landing/ServiceLanding";
import JsonLd, { getServiceSchema } from "@/components/JsonLd";
import { createPageMetadata } from "@/lib/seo/metadata";

const TITLE = "SEO Hückeswagen";
const DESCRIPTION =
  "SEO aus Hückeswagen für Unternehmen im Bergischen Land: Technik, Suchinhalte und interne Links gezielt verbessern. SEO Basic ab 149 €. Kostenlose Erstberatung.";
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
    "Wir prüfen, bei welchen Suchanfragen Ihre Website erscheint, welche Seiten Besucher erreichen und wo der Kontaktweg stockt. Daraus entsteht ein konkreter Arbeitsplan für Technik, Inhalte und lokale Auffindbarkeit.",
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
    label: "So arbeiten wir",
    heading: "Analyse zuerst. Dann Umsetzung.",
    items: [
      {
        title: "Bestandsaufnahme",
        text: "Wir prüfen Technik, Inhalte und Sichtbarkeit Ihrer Seite und zeigen, wo die größten Hebel liegen — ehrlich, auch wenn es heißt: hier lohnt sich wenig.",
      },
      {
        title: "Priorisierung",
        text: "Wir legen fest, welche Seiten und Suchintentionen zuerst bearbeitet werden: Snippets, Struktur, Technik, Inhalte — abgestimmt auf Ihr Angebot.",
      },
      {
        title: "Umsetzung & Kontrolle",
        text: "Wir setzen die Maßnahmen um und beobachten, wie Impressionen, Klicks und Interaktion sich entwickeln. Weitere Optimierungsschritte vereinbaren wir abhängig vom beauftragten Umfang.",
      },
    ],
  },
  included: {
    label: "Leistungsumfang",
    heading: "Diese Bereiche prüfen wir gemeinsam.",
    items: [
      "Technisches SEO: Ladezeiten, Crawlbarkeit, Struktur, Meta-Daten",
      "Inhaltliches SEO: Suchintention, Titles, Descriptions, interne Verlinkung",
      "Lokale Auffindbarkeit: verständliche Standortangaben und konsistente Kontaktdaten",
      "Verständliche Berichte: was wurde gemacht, was hat es bewegt",
    ],
    note: "Je nach Auftrag erhalten Sie eine priorisierte Maßnahmenliste aus der Analyse, eine Dokumentation der tatsächlich geänderten Punkte aus der Umsetzung und eine Auswertung verfügbarer Suchdaten aus der Kontrolle. Laufende Pflege und der erweiterte Monatsbericht gehören nur zu Care+SEO; der konkrete Umfang wird im Angebot festgelegt. Rankings, Klickzahlen oder Umsatzsteigerungen können wir nicht garantieren.",
  },
  pricing: {
    label: "Preise",
    heading: "Einmalig optimieren oder laufend pflegen.",
    tiers: [
      {
        name: "SEO Basic",
        price: productDisplayInfo.seo_basic.from.replace("from €", "ab ") + " €",
        priceNote: "einmalig",
        features: [
          "Technische Basis-Optimierung",
          "Titles & Descriptions",
          "Interne Verlinkung schärfen",
        ],
      },
      {
        name: "SEO Advanced",
        price: productDisplayInfo.seo_advanced.from.replace("from €", "ab ") + " €",
        priceNote: "einmalig",
        highlight: true,
        features: [
          "Alles aus Basic",
          "Vertiefte Analyse & Keyword-Strategie",
          "Suchintention und Seitenaufbau prüfen",
        ],
      },
      {
        name: "Website-Wache Care+SEO",
        price: "199 €",
        priceNote: "pro Monat",
        features: [
          "Monitoring und Care-Paket der Website-Wache",
          "Laufende SEO-Pflege und Sichtbarkeits-Check",
          "Bis 60 Minuten Kleinfixes; erweiterter Monatsbericht",
        ],
      },
    ],
    footnote: `${TAX_NOTE} Der Umfang wird vorab im Angebot festgelegt. Care+SEO ist das bestehende Paket der Website-Wache.`,
  },
  faq: {
    label: "FAQ",
    heading: "Häufige Fragen.",
    items: [
      {
        q: "Garantieren Sie ein bestimmtes Ranking?",
        a: "Nein. Google entscheidet, welche Ergebnisse angezeigt werden. Wir verbessern die technischen und inhaltlichen Voraussetzungen und prüfen anschließend die Entwicklung der verfügbaren Messwerte.",
      },
      {
        q: "Wo fangen wir am besten an?",
        a: "Mit der kostenlosen Erstberatung. Zusätzlich prüft unser Website-Check auf audit.pagefoundry.de öffentlich abrufbare Inhalte auf technische Lesbarkeit und Struktur. Sein Score misst keine tatsächlichen Platzierungen oder Erwähnungen bei Google oder KI-Diensten.",
      },
      {
        q: "Unterscheidet sich lokales SEO von normaler Optimierung?",
        a: "Lokale Suche ergänzt das Angebot um einen Standortbezug. Wir prüfen beispielsweise, ob eine Seite zu einer Anfrage aus Hückeswagen, Remscheid oder Wermelskirchen passt und ob Leistungen und Einzugsgebiet verständlich beschrieben sind.",
      },
      {
        q: "Bringt SEO sofort etwas?",
        a: "Technische Änderungen lassen sich direkt prüfen. Bis Google Seiten erneut verarbeitet und sich Suchdaten verändern, kann deutlich mehr Zeit vergehen. Einen festen Termin für bessere Rankings versprechen wir nicht.",
      },
    ],
  },
  cta: {
    heading: "Erst sehen, dann optimieren.",
    text: "Kostenlose Erstberatung: Wir schauen uns Ihre Sichtbarkeit an und sagen Ihnen, ob und wo SEO bei Ihnen Hebel hat — ehrlich und ohne Verkaufsdruck.",
  },
  related: {
    label: "Passende Seiten",
    items: [
      { label: "Webdesign Bergisches Land", href: "/webdesign-bergisches-land" },
      { label: "Website-Wache (Care+SEO)", href: "/website-wache" },
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
