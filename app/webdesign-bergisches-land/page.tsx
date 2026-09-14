import { productDisplayInfo } from "@/lib/products";
import ServiceLanding, { type ServiceLandingData } from "@/components/landing/ServiceLanding";
import JsonLd, { getServiceSchema } from "@/components/JsonLd";
import { createPageMetadata } from "@/lib/seo/metadata";

const TITLE = "Webdesign Bergisches Land";
const DESCRIPTION =
  "Webdesign im Bergischen Land für Websites und Landingpages: klare Angebote, mobile Umsetzung und transparente Festpreise ab 590 €. Kostenlose Erstberatung anfragen.";
const URL = "https://pagefoundry.de/webdesign-bergisches-land";

const TAX_NOTE =
  "Alle Preise sind Endpreise. PageFoundry ist Kleinunternehmer nach § 19 UStG — es wird keine Umsatzsteuer ausgewiesen.";

export const metadata = createPageMetadata({
  path: "/webdesign-bergisches-land",
  title: TITLE,
  description: DESCRIPTION,
  locale: "de_DE",
});

const data: ServiceLandingData = {
  eyebrow: "Webdesign · Bergisches Land",
  heroHeading: "Webdesign aus Hückeswagen für das Bergische Land.",
  heroSubline:
    "PageFoundry sitzt in Hückeswagen und baut Websites und Landingpages für Unternehmen im Bergischen Land: Remscheid, Wermelskirchen, Wipperfürth und die Städte drumherum. Sie sprechen direkt mit Fabian Franke: von der ersten Planung bis zum laufenden Betrieb.",
  problem: {
    label: "Das Problem",
    heading: "Eine Website muss Ihr Angebot verständlich machen.",
    points: [
      "Veraltete Inhalte oder lange Ladezeiten erschweren den ersten Kontakt.",
      "Besucher finden Leistungen, Preise oder die passende Kontaktmöglichkeit nicht schnell genug.",
      "Für Änderungen und technische Fragen fehlt ein fester Ansprechpartner.",
    ],
  },
  steps: {
    label: "So laufen Projekte bei uns",
    heading: "Klarer Ablauf, ohne Umwege.",
    items: [
      {
        title: "Erstgespräch",
        text: "Kostenloses 30-Minuten-Gespräch per Zoom oder Telefon: Ziel, Angebot und Zielgruppe klären — ohne Verkaufsdruck.",
      },
      {
        title: "Konzept & Festpreis",
        text: "Wir stimmen Seitenumfang, Gestaltung, Inhalte und einen verbindlichen Angebotspreis mit Ihnen ab.",
      },
      {
        title: "Build & Launch",
        text: "Wir setzen die Seite um, prüfen die mobile Darstellung und den Kontaktweg und bereiten den gemeinsamen Start vor.",
      },
    ],
  },
  included: {
    label: "Leistungsumfang",
    heading: "Was drin ist — und was nicht.",
    items: [
      "Individuelle Landingpage oder Website mit klarem Kontaktweg",
      "Saubere mobile Umsetzung und schnelle Ladezeiten",
      "Klare Leistungs- und Standortangaben; SEO-Umfang nach gewähltem Paket",
      "Fester Ansprechpartner aus Hückeswagen",
      "Änderungswünsche im abgesprochenen Rahmen",
    ],
    note: "Ehrliche Grenzen: Der Einstiegspreis umfasst eine fokussierte Seite, keine unbegrenzten Revisionen, kein Redaktionssystem und keine laufende redaktionelle Betreuung. Größere Vorhaben — mehrere Unterseiten, Buchung, Online-Zahlung — kalkulieren wir separat und transparent.",
  },
  pricing: {
    label: "Preise",
    heading: "Ein klarer Einstieg für Ihr Vorhaben.",
    tiers: [
      {
        name: "Landingpage",
        price: productDisplayInfo.landing_page.from.replace("from €", "ab ") + " €",
        priceNote: "einmalig",
        features: [
          "Eine fokussierte Seite für Ihr Angebot",
          "Mobile Umsetzung",
          "Klarer Kontakt-/Anruf-CTA",
        ],
      },
      {
        name: "All-Inclusive",
        price: productDisplayInfo.all_inclusive.from.replace("from €", "ab ") + " €",
        priceNote: "einmalig",
        highlight: true,
        features: [
          "Landingpage + Domain",
          "Basic-SEO & Vorbereitung der Google-Indexierung",
          "Inkl. 12 Monate Hosting, danach 19 €/Monat",
        ],
      },
      {
        name: "Hosting",
        price: productDisplayInfo.landing_page_hosting.from.replace("from €", "ab ").replace("/month", " €"),
        priceNote: "pro Monat",
        features: [
          "Hosting & Erreichbarkeit",
          "Website-Wache optional ab 49 €/Monat",
          "Wartung optional ab 79 €/Monat",
        ],
      },
    ],
    footnote: `${TAX_NOTE} Der endgültige Umfang wird vorab vereinbart. Beim All-Inclusive-Paket wird die Domainverlängerung separat berechnet. Google entscheidet über die Indexierung.`,
  },
  faq: {
    label: "FAQ",
    heading: "Häufige Fragen.",
    items: [
      {
        q: "Wo genau sitzt PageFoundry?",
        a: "PageFoundry sitzt in Hückeswagen. Wir betreuen auch Unternehmen in Remscheid, Wermelskirchen, Wipperfürth und der Umgebung. Die Zusammenarbeit erfolgt per Telefon oder Videogespräch; Termine vor Ort vereinbaren wir individuell.",
      },
      {
        q: "Können Sie eine bestehende Website übernehmen?",
        a: "Ja. Wenn die Basis brauchbar ist, optimieren wir gezielt (Website-Rettung ab 890 €). Wenn nicht, bauen wir neu — das klären wir ehrlich im Erstgespräch.",
      },
      {
        q: "Welche Referenzen haben Sie aus der Region?",
        a: "Carbon Care (Fahrzeugaufbereitung): Landingpage und eine individuelle Rechnungssoftware im Tagesbetrieb. The Loft (Gastronomie, Wuppertal): statischer Website-Relaunch ohne WordPress-Plugin-Stack. Die Projektbeispiele und Links zu den Kunden finden Sie auf dieser Seite. Sie zeigen umgesetzte Leistungen, keine behaupteten SEO- oder Umsatzsteigerungen.",
      },
      {
        q: "Wie lange dauert ein Projekt?",
        a: "Eine fokussierte Landingpage typischerweise wenige Wochen nach Kickoff — abhängig von Ihren Materialien und Freigaben. Den konkreten Zeitplan legen wir vor dem Start fest.",
      },
    ],
  },
  cta: {
    heading: "Lassen Sie uns über Ihre Website sprechen.",
    text: "Kostenlose Erstberatung: Wir schauen uns Ihre Situation an und sagen Ihnen ehrlich, was etwas bringen würde — auch wenn die Antwort „Ihre Seite ist okay“ lautet.",
  },
  references: {
    heading: "Zwei umgesetzte Kundenprojekte.",
    items: [
      { name: "Carbon Care · Fahrzeugaufbereitung", text: "Landingpage und individuelle Rechnungssoftware als digitale Basis für den Betrieb. Zwei umgesetzte Systeme mit unterschiedlichen Aufgaben.", href: "https://carbon-care.de", label: "Carbon Care ansehen" },
      { name: "The Loft · Gastronomie in Wuppertal", text: "Statischer Website-Relaunch mit klarer Besucherführung und Zugang zur Speisekarte. Die Website kommt ohne WordPress-Plugin-Stack aus.", href: "https://theloftbrunch.de", label: "The Loft ansehen" },
    ],
  },
  related: {
    label: "Passende Seiten",
    items: [
      { label: "SEO in Hückeswagen", href: "/seo-hueckeswagen" },
      { label: "Website-Rettung", href: "/website-rettung" },
      { label: "Website-Wache (Monitoring)", href: "/website-wache" },
      { label: "KI-Sichtbarkeits-Check", href: "https://audit.pagefoundry.de" },
    ],
  },
};

export default function WebdesignBergischesLandPage() {
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
