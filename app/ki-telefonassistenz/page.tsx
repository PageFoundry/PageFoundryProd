import type { Metadata } from "next";
import ServiceLanding, { type ServiceLandingData } from "@/components/landing/ServiceLanding";

const TITLE = "KI-Telefonassistenz";
const DESCRIPTION =
  "Die KI-Telefonassistenz von PageFoundry nimmt Anrufe an, erfasst das Anliegen, bucht Termine und gibt jeden Kontakt sauber an Sie weiter. 790 € Einrichtung, 249 €/Monat.";
const URL = "https://pagefoundry.de/ki-telefonassistenz";

const TAX_NOTE =
  "Alle Preise sind Endpreise. PageFoundry ist Kleinunternehmer nach § 19 UStG — es wird keine Umsatzsteuer ausgewiesen.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: { url: URL, title: `${TITLE} · PageFoundry`, description: DESCRIPTION },
};

const data: ServiceLandingData = {
  eyebrow: "KI-Telefonassistenz",
  heroHeading: "Kein verpasster Anruf. Kein verlorener Kunde.",
  heroSubline:
    "Unsere KI-Telefonassistenz nimmt Anrufe entgegen, wenn Sie keine Zeit haben — erfasst das Anliegen, bucht auf Wunsch direkt einen Termin und gibt jeden Kontakt sauber an Sie weiter. Mit echter Festnetznummer.",
  problem: {
    label: "Das Problem",
    heading: "Jeder unbeantwortete Anruf ist ein Auftrag, der woanders landet.",
    points: [
      "Im Tagesgeschäft, am Kunden oder nach Feierabend bleibt das Telefon liegen — Anrufer wählen dann einfach den Nächsten.",
      "Ein klassischer Anrufbeantworter wird selten besprochen und noch seltener zurückgerufen.",
      "Eine eigene Empfangskraft kostet vierstellig im Monat und ist trotzdem nicht immer erreichbar.",
    ],
  },
  steps: {
    label: "So funktioniert's",
    heading: "In drei Schritten erreichbar.",
    items: [
      {
        title: "Nummer & Weiterleitung",
        text: "Sie bekommen eine eigene Festnetznummer oder leiten Ihre bestehende auf die Assistenz um — die Technik übernehmen wir komplett.",
      },
      {
        title: "KI nimmt an & versteht",
        text: "Die Assistenz begrüßt den Anrufer in Ihrem Namen, erfragt das Anliegen und bucht auf Wunsch direkt einen Termin in Ihren Kalender.",
      },
      {
        title: "Sie werden benachrichtigt",
        text: "Name, Anliegen und Wunschtermin landen sofort bei Ihnen — übersichtlich festgehalten. Nichts geht verloren.",
      },
    ],
  },
  included: {
    label: "Leistungsumfang",
    heading: "Was eingerichtet wird.",
    items: [
      "Eigene Festnetznummer oder Weiterleitung Ihrer bestehenden Nummer",
      "Auf Ihren Betrieb abgestimmter Gesprächsleitfaden",
      "Terminbuchung mit Prüfung auf freie Zeiten",
      "Lead-Erfassung, wenn kein Termin zustande kommt",
      "Sofort-Benachrichtigung pro Anruf",
      "Anpassungen an Ansage und Ablauf nach dem Start",
    ],
    note: "Datenschutz: Die Assistenz ist auf geschäftliche Anrufe ausgelegt und sagt Anrufern klar an, dass ein digitaler Assistent antwortet. Den passenden Datenschutz- und Auftragsverarbeitungsrahmen stimmen wir vor dem Start gemeinsam ab.",
  },
  pricing: {
    label: "Preise",
    heading: "Ein Setup, planbare Monatskosten.",
    tiers: [
      {
        name: "Einrichtung",
        price: "790 €",
        priceNote: "einmalig",
        features: [
          "Komplette technische Einrichtung",
          "Eigene Festnetznummer oder Weiterleitung",
          "Individueller Gesprächsleitfaden",
          "Anbindung an Terminbuchung & Benachrichtigung",
        ],
      },
      {
        name: "Betrieb",
        price: "249 €",
        priceNote: "pro Monat",
        highlight: true,
        features: [
          "Laufender Betrieb der Assistenz",
          "300 Gesprächsminuten inklusive",
          "Danach 0,45 € je weitere Minute",
          "Laufende Anpassungen des Ablaufs",
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
        q: "Klingt das wie ein Roboter?",
        a: "Die Assistenz spricht natürlich und in Ihrem Namen. Anrufern wird zu Beginn transparent gesagt, dass ein digitaler Assistent antwortet.",
      },
      {
        q: "Was passiert, wenn die KI nicht weiterweiß?",
        a: "Dann erfasst sie sauber Name, Anliegen und Rückrufwunsch und gibt den Kontakt an Sie weiter — kein Anrufer fällt durchs Raster.",
      },
      {
        q: "Kann ich meine vorhandene Nummer behalten?",
        a: "Ja. Sie können Ihre bestehende Nummer auf die Assistenz umleiten oder eine eigene Festnetznummer von uns nutzen.",
      },
      {
        q: "Für wen lohnt sich das?",
        a: "Vor allem für Betriebe mit vielen Anrufen und wenig Zeit am Telefon — etwa Gastronomie, Friseure, Werkstätten und Handwerk.",
      },
    ],
  },
  cta: {
    heading: "Testen wir es an Ihrem Betrieb?",
    text: "In einem kurzen, kostenlosen Gespräch klären wir, wie Ihre Anrufe heute laufen und wie die Assistenz konkret aussehen würde.",
  },
};

export default function KiTelefonassistenzPage() {
  return <ServiceLanding data={data} />;
}
