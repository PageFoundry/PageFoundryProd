import { regionalPricing } from "@/lib/seo/regionalWebdesign";
import ServiceLanding, { type ServiceLandingData } from "@/components/landing/ServiceLanding";
import JsonLd, { getServiceSchema } from "@/components/JsonLd";
import { createPageMetadata } from "@/lib/seo/metadata";

const TITLE = "Bestehende Website neu — Analyse und Relaunch";
const DESCRIPTION =
  "Website-Rettung von PageFoundry: Ich überarbeite Ihre bestehende Website oder setze einen Website-Relaunch um — verständlich positioniert, schnell und mit Vorschau vorab. Ab 790 €.";
const URL = "https://pagefoundry.de/website-rettung";

const TAX_NOTE =
  "Alle Preise sind Endpreise. PageFoundry ist Kleinunternehmer nach § 19 UStG — es wird keine Umsatzsteuer ausgewiesen.";

export const metadata = createPageMetadata({
  path: "/website-rettung",
  title: TITLE,
  description: DESCRIPTION,
  locale: "de_DE",
});

const data: ServiceLandingData = {
  eyebrow: "Website-Rettung",
  heroHeading: "Ihre bestehende Website. Mit einer passenden neuen Basis.",
  heroSubline:
    "Ich analysiere Ihre bestehende Website und kläre, welche Inhalte und Funktionen erhalten bleiben. Für den Neubau gelten dieselben drei Stufen wie für neue Websites: Sichtbar, Gefunden und Gebucht. Sie erhalten eine Vorschau vor der Entscheidung.",
  problem: {
    label: "Das Problem",
    heading: "Eine schwache Website kostet jeden Tag leise Geld.",
    points: [
      "Besucher verstehen in den ersten Sekunden nicht, was Sie anbieten — und springen ab.",
      "Auf dem Handy ist die Seite kaum bedienbar, dabei kommt der Großteil der Besucher genau von dort.",
      "Es gibt keinen klaren nächsten Schritt: kein sichtbarer Anruf-Button, kein einfaches Kontaktformular.",
    ],
  },
  steps: {
    label: "So funktioniert's",
    heading: "Vom Audit zur fertigen Seite.",
    items: [
      {
        title: "Audit & Vorschau",
        text: "Ich analysiere Ihre aktuelle Seite und bauen eine konkrete Vorher/Nachher-Vorschau — Sie sehen das Ergebnis, bevor Sie sich festlegen.",
      },
      {
        title: "Umsetzung",
        text: "Ich baue die neue Startseite bzw. Landingpage: klare Struktur, starke erste Sekunde, sauber auf dem Handy, mit eindeutigem Call-to-Action.",
      },
      {
        title: "Live & gefunden",
        text: "Ich bringe die Seite live, richten lokale Auffindbarkeit (LocalBusiness-SEO) ein und verlinken Impressum und Datenschutz korrekt.",
      },
    ],
  },
  included: {
    label: "Leistungsumfang",
    heading: "Vom Bestand zum vereinbarten Neubau.",
    items: [
      "Analyse Ihrer bestehenden Website",
      "Konkrete Vorschau vor der Entscheidung",
      "Neue Startseite bzw. Landingpage",
      "Saubere mobile Umsetzung",
      "Klarer Kontakt-/Anruf-CTA",
      "Lokale Auffindbarkeit (LocalBusiness-SEO)",
    ],
    note: "Sichtbar umfasst eine Seite, Gefunden bis zu fünf Seiten. Gebucht umfasst bis zu zehn Inhaltsseiten oder bis zu fünf Seiten mit genau einem Standardmodul. Den Umfang lege ich mit Ihnen vorab fest.",
  },
  pricing: regionalPricing,
  faq: {
    label: "FAQ",
    heading: "Häufige Fragen.",
    items: [
      {
        q: "Sehe ich vorher, wie es aussieht?",
        a: "Ja. Sie bekommen eine konkrete Vorschau, bevor Sie sich entscheiden — kein Blindkauf.",
      },
      {
        q: "Kann ich meine Inhalte und Bilder behalten?",
        a: "Ja, vorhandene Inhalte und Bilder übernehme ich, wo sinnvoll, und ergänzen, was fehlt.",
      },
      {
        q: "Wie lange dauert das?",
        a: "Ein Neubau geht in der Regel nach rund 10–14 Tagen online — abhängig davon, wie schnell Inhalte und Freigaben da sind.",
      },
      {
        q: "Was ist mit laufender Pflege?",
        a: "Sie wählen Kauf mit optionalem Betrieb für 25 €/Monat oder die betreute Variante für Unternehmen über 24 Monate.",
      },
    ],
  },
  cta: {
    heading: "Soll ich Ihre bestehende Website prüfen?",
    text: "In der kostenlosen Erstberatung schaue ich auf Ihre aktuelle Website und zeigen die Hebel mit der größten Wirkung — ohne Verkaufsgespräch.",
  },
  related: {
    label: "Passende Seiten",
    items: [
      { label: "Webdesign Bergisches Land", href: "/webdesign-bergisches-land" },
      { label: "SEO Hückeswagen", href: "/seo-hueckeswagen" },
      { label: "Website-Wache", href: "/website-wache" },
    ],
  },
};

export default function WebsiteRettungPage() {
  return (
    <>
      <JsonLd data={getServiceSchema({ name: TITLE, description: DESCRIPTION, url: URL })} />
      <ServiceLanding data={data} />
    </>
  );
}
