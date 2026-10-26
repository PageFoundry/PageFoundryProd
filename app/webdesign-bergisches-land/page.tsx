import { regionalPricing } from "@/lib/seo/regionalWebdesign";
import ServiceLanding, { type ServiceLandingData } from "@/components/landing/ServiceLanding";
import JsonLd, { getServiceSchema } from "@/components/JsonLd";
import { createPageMetadata } from "@/lib/seo/metadata";

const TITLE = "Webdesign Bergisches Land";
const DESCRIPTION =
  "Webdesign im Bergischen Land für Websites und Landingpages: klare Angebote, mobile Umsetzung und transparente Festpreise ab 790 €. Kostenlose Erstberatung anfragen.";
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
    label: "So laufen Projekte bei mir",
    heading: "Klarer Ablauf, ohne Umwege.",
    items: [
      {
        title: "Erstgespräch",
        text: "Kostenloses 30-Minuten-Gespräch per Zoom oder Telefon: Ziel, Angebot und Zielgruppe klären — ohne Verkaufsdruck.",
      },
      {
        title: "Konzept & Festpreis",
        text: "Ich stimme Seitenumfang, Gestaltung, Inhalte und einen verbindlichen Angebotspreis mit Ihnen ab.",
      },
      {
        title: "Build & Launch",
        text: "Ich setze die Seite um, prüfe die mobile Darstellung und den Kontaktweg und bereite den gemeinsamen Start vor.",
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
    note: "Ehrliche Grenzen: Der Einstiegspreis umfasst eine fokussierte Seite, keine unbegrenzten Revisionen, kein Redaktionssystem und keine laufende redaktionelle Betreuung. Mehr Seiten und Standardfunktionen sind in Gefunden und Gebucht enthalten. Individuelle Software kalkuliere ich ab 2.500 € separat.",
  },
  pricing: regionalPricing,
  faq: {
    label: "FAQ",
    heading: "Häufige Fragen.",
    items: [
      {
        q: "Wo genau sitzt PageFoundry?",
        a: "PageFoundry sitzt in Hückeswagen. Ich betreue auch Unternehmen in Remscheid, Wermelskirchen, Wipperfürth und der Umgebung. Die Zusammenarbeit erfolgt per Telefon oder Videogespräch; Termine vor Ort vereinbare ich individuell.",
      },
      {
        q: "Können Sie eine bestehende Website übernehmen?",
        a: "Ja. Wenn die Basis brauchbar ist, optimiere ich gezielt (bei einem Neubau gelten Sichtbar, Gefunden und Gebucht ab 790 €). Wenn nicht, baue ich neu — das kläre ich ehrlich im Erstgespräch.",
      },
      {
        q: "Welche Referenzen haben Sie aus der Region?",
        a: "Carbon Care (Fahrzeugaufbereitung): Landingpage und eine individuelle Rechnungssoftware im Tagesbetrieb. The Loft (Gastronomie, Wuppertal): statischer Website-Relaunch ohne WordPress-Plugin-Stack. Die Projektbeispiele und Links zu den Kunden finden Sie auf dieser Seite. Sie zeigen umgesetzte Leistungen, keine behaupteten SEO- oder Umsatzsteigerungen.",
      },
      {
        q: "Wie lange dauert ein Projekt?",
        a: "Eine fokussierte Landingpage typischerweise wenige Wochen nach Kickoff — abhängig von Ihren Materialien und Freigaben. Den konkreten Zeitplan lege ich vor dem Start fest.",
      },
    ],
  },
  cta: {
    heading: "Sprechen Sie mit mir über Ihre Website.",
    text: "Kostenlose Erstberatung: Ich schaue mir Ihre Situation an und sage Ihnen ehrlich, was etwas bringen würde — auch wenn die Antwort „Ihre Seite ist okay“ lautet.",
  },
  references: {
    heading: "Zwei umgesetzte Kundenprojekte.",
    items: [
      {
        name: "Carbon Care · Fahrzeugaufbereitung",
        text: "Landingpage und individuelle Rechnungssoftware als digitale Basis für den Betrieb. Zwei umgesetzte Systeme mit unterschiedlichen Aufgaben.",
        href: "https://carbon-care.de",
        label: "Carbon Care ansehen",
        internalLink: { href: "/projekte/carbon-care", label: "Projektseite ansehen" },
      },
      {
        name: "The Loft · Gastronomie in Wuppertal",
        text: "Statischer Website-Relaunch mit klarer Besucherführung und Zugang zur Speisekarte. Die Website kommt ohne WordPress-Plugin-Stack aus.",
        href: "https://theloftbrunch.de",
        label: "The Loft ansehen",
        internalLink: { href: "/projekte/the-loft", label: "Projektseite ansehen" },
      },
    ],
  },
  related: {
    label: "Passende Seiten",
    items: [
      { label: "SEO in Hückeswagen", href: "/seo-hueckeswagen" },
      { label: "Webdesign Wipperfürth", href: "/webdesign-wipperfuerth" },
      { label: "Webdesign Wermelskirchen", href: "/webdesign-wermelskirchen" },
      { label: "Webdesign Remscheid", href: "/webdesign-remscheid" },
      { label: "Webdesign Radevormwald", href: "/webdesign-radevormwald" },
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
            { "@type": "City", name: "Radevormwald" },
          ],
        }}
      />
      <ServiceLanding data={data} />
    </>
  );
}
