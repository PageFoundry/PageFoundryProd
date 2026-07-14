import type { Metadata } from "next";
import ServiceLanding, { type ServiceLandingData } from "@/components/landing/ServiceLanding";

const TITLE = "Website-Rettung";
const DESCRIPTION =
  "Website-Rettung von PageFoundry: Aus einer veralteten oder schwachen Seite machen wir eine, die verständlich positioniert, schnell lädt und zum Kontakt bewegt — mit Vorschau vorab. Ab 890 €.";
const URL = "https://pagefoundry.de/website-rettung";

const TAX_NOTE =
  "Alle Preise sind Endpreise. PageFoundry ist Kleinunternehmer nach § 19 UStG — es wird keine Umsatzsteuer ausgewiesen.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: { url: URL, title: `${TITLE} · PageFoundry`, description: DESCRIPTION },
};

const data: ServiceLandingData = {
  eyebrow: "Website-Rettung",
  heroHeading: "Ihre Website ist da — bringt aber keine Anfragen.",
  heroSubline:
    "Im Website-Rettung-Sprint machen wir aus einer veralteten oder schwachen Seite eine, die verständlich positioniert, schnell lädt und zum Anrufen oder Schreiben bewegt. Mit konkreter Vorschau, bevor Sie sich entscheiden.",
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
        text: "Wir analysieren Ihre aktuelle Seite und bauen eine konkrete Vorher/Nachher-Vorschau — Sie sehen das Ergebnis, bevor Sie sich festlegen.",
      },
      {
        title: "Umsetzung",
        text: "Wir bauen die neue Startseite bzw. Landingpage: klare Struktur, starke erste Sekunde, sauber auf dem Handy, mit eindeutigem Call-to-Action.",
      },
      {
        title: "Live & gefunden",
        text: "Wir bringen die Seite live, richten lokale Auffindbarkeit (LocalBusiness-SEO) ein und verlinken Impressum und Datenschutz korrekt.",
      },
    ],
  },
  included: {
    label: "Leistungsumfang",
    heading: "Was im Sprint steckt.",
    items: [
      "Analyse Ihrer bestehenden Website",
      "Konkrete Vorschau vor der Entscheidung",
      "Neue Startseite bzw. Landingpage",
      "Saubere mobile Umsetzung",
      "Klarer Kontakt-/Anruf-CTA",
      "Lokale Auffindbarkeit (LocalBusiness-SEO)",
    ],
    note: "Der Einstieg ist bewusst klar geschnitten (eine starke Seite). Mehr Unterseiten, Buchung oder Online-Zahlung sind in den größeren Stufen enthalten — Umfang und Preis legen wir vorher gemeinsam fest, kein Scope-Creep.",
  },
  pricing: {
    label: "Preise",
    heading: "Fester Preis. Klarer Umfang.",
    tiers: [
      {
        name: "Sprint",
        price: "890 €",
        priceNote: "einmalig",
        features: [
          "Eine starke Startseite/Landingpage",
          "Mobile Umsetzung",
          "Kontakt-/Anruf-CTA",
          "LocalBusiness-SEO-Grundlage",
        ],
      },
      {
        name: "Sprint+",
        price: "1.490 €",
        priceNote: "einmalig",
        highlight: true,
        features: [
          "Alles aus Sprint",
          "Mehrere Unterseiten",
          "Erweiterte Inhalte & Struktur",
          "Kontaktformular",
        ],
      },
      {
        name: "Komplett",
        price: "2.290 €",
        priceNote: "einmalig",
        features: [
          "Alles aus Sprint+",
          "Terminbuchung",
          "Online-Zahlung (Stripe)",
          "Individuelle Funktionen nach Absprache",
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
        q: "Sehe ich vorher, wie es aussieht?",
        a: "Ja. Sie bekommen eine konkrete Vorschau, bevor Sie sich entscheiden — kein Blindkauf.",
      },
      {
        q: "Kann ich meine Inhalte und Bilder behalten?",
        a: "Ja, vorhandene Inhalte und Bilder übernehmen wir, wo sinnvoll, und ergänzen, was fehlt.",
      },
      {
        q: "Wie lange dauert das?",
        a: "Ein Sprint ist in der Regel in wenigen Tagen live — abhängig davon, wie schnell Inhalte und Freigaben da sind.",
      },
      {
        q: "Was ist mit laufender Pflege?",
        a: "Auf Wunsch übernehmen wir die danach mit der Website-Wache — Überwachung, Updates und kleine Änderungen monatlich.",
      },
    ],
  },
  cta: {
    heading: "Holen wir das Potenzial aus Ihrer Seite?",
    text: "In der kostenlosen Erstberatung schauen wir auf Ihre aktuelle Website und zeigen die Hebel mit der größten Wirkung — ohne Verkaufsgespräch.",
  },
};

export default function WebsiteRettungPage() {
  return <ServiceLanding data={data} />;
}
