import ServiceLanding, { type ServiceLandingData } from "@/components/landing/ServiceLanding";
import JsonLd, { getServiceSchema } from "@/components/JsonLd";
import { createPageMetadata } from "@/lib/seo/metadata";

const TITLE = "KI-Telefonassistenz";
const META_TITLE = "KI-Telefonassistent für Betriebe: 790 € + 249 €/Monat";
const DESCRIPTION =
  "KI-Telefonassistent für Handwerk, Gastronomie und Werkstätten: nimmt Anrufe an, erfasst das Anliegen, bucht Termine. 790 € Einrichtung, 249 €/Monat.";
const URL = "https://pagefoundry.de/ki-telefonassistenz";

const TAX_NOTE =
  "Alle Preise sind Endpreise. PageFoundry ist Kleinunternehmer nach § 19 UStG — es wird keine Umsatzsteuer ausgewiesen.";

export const metadata = createPageMetadata({
  path: "/ki-telefonassistenz",
  title: META_TITLE,
  description: DESCRIPTION,
  locale: "de_DE",
});

const data: ServiceLandingData = {
  eyebrow: "KI-Telefonassistenz",
  heroHeading: "KI-Telefonassistent: Anrufe annehmen, Anliegen erfassen, Rückrufe vorbereiten.",
  heroSubline:
    "Meine KI-Telefonassistenz nimmt Anrufe entgegen, wenn Sie keine Zeit haben — erfasst das Anliegen, bucht auf Wunsch direkt einen Termin und gibt jeden Kontakt sauber an Sie weiter. Mit echter Festnetznummer.",
  heroNote: (
    <>
      Live testen: Rufen Sie{" "}
      <a href="tel:+4921928743999" className="text-pfAccent underline underline-offset-4">02192 8743999</a>{" "}
      an. Dort nimmt die Assistenz ab.
    </>
  ),
  problem: {
    label: "Das Problem",
    heading: "Im Tagesgeschäft bleibt wenig Zeit für das Telefon.",
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
        text: "Sie bekommen eine eigene Festnetznummer oder leiten Ihre bestehende auf die Assistenz um — die Technik übernehme ich komplett.",
      },
      {
        title: "KI nimmt an & versteht",
        text: "Die Assistenz begrüßt den Anrufer in Ihrem Namen, erfragt das Anliegen und bucht auf Wunsch direkt einen Termin in Ihren Kalender.",
      },
      {
        title: "Sie werden benachrichtigt",
        text: "Name, Anliegen und Wunschtermin landen sofort bei Ihnen — übersichtlich festgehalten. Die Angaben werden für Ihren Rückruf festgehalten.",
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
    note: "Datenschutz: Die Assistenz ist auf geschäftliche Anrufe ausgelegt und sagt Anrufern klar an, dass ein digitaler Assistent antwortet. Den passenden Datenschutz- und Auftragsverarbeitungsrahmen stimme ich vor dem Start gemeinsam ab.",
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
        q: "Was kostet ein KI-Telefonassistent?",
        a: "790 € Einrichtung und 249 € im Monat. Enthalten sind 300 Gesprächsminuten, jede weitere Minute kostet 0,45 €. Alle Preise sind Endpreise.",
      },
      {
        q: "Kann der Assistent Termine buchen?",
        a: "Ja. Die Assistenz prüft freie Zeiten und bucht auf Wunsch direkt einen Termin in Ihren Kalender. Kommt kein Termin zustande, erfasst sie Name, Anliegen und Rückrufwunsch.",
      },
      {
        q: "Klingt das wie ein Roboter?",
        a: "Die Assistenz spricht natürlich und in Ihrem Namen. Anrufern wird zu Beginn transparent gesagt, dass ein digitaler Assistent antwortet.",
      },
      {
        q: "Was passiert, wenn die KI nicht weiterweiß?",
        a: "Dann erfasst sie sauber Name, Anliegen und Rückrufwunsch und gibt den Kontakt an Sie weiter — damit Sie den Rückruf vorbereiten können.",
      },
      {
        q: "Kann ich meine vorhandene Nummer behalten?",
        a: "Ja. Sie können Ihre bestehende Nummer auf die Assistenz umleiten oder eine eigene Festnetznummer von mir nutzen.",
      },
      {
        q: "Für wen lohnt sich das?",
        a: "Vor allem für Betriebe mit vielen Anrufen und wenig Zeit am Telefon — etwa Gastronomie, Friseure, Werkstätten und Handwerk.",
      },
    ],
  },
  cta: {
    heading: "Wie soll Ihre Telefonassistenz arbeiten?",
    text: "In einem kurzen, kostenlosen Gespräch kläre ich, wie Ihre Anrufe heute laufen und wie die Assistenz konkret aussehen würde.",
  },
  related: {
    label: "Passende Seiten",
    items: [
      { label: "Website für Handwerker", href: "/website-fuer-handwerker" },
      { label: "Website für Restaurants und Cafés", href: "/website-fuer-gastronomie" },
      { label: "Website-Wache", href: "/website-wache" },
      { label: "Individuelle Software", href: "/individuelle-software" },
    ],
  },
};

export default function KiTelefonassistenzPage() {
  return (
    <>
      <JsonLd
        data={{
          ...getServiceSchema({ name: TITLE, description: DESCRIPTION, url: URL }),
          offers: [
            { "@type": "Offer", name: "Einrichtung, einmalig", price: 790, priceCurrency: "EUR" },
            {
              "@type": "Offer",
              name: "Betrieb pro Monat, 300 Gesprächsminuten inklusive, danach 0,45 € je Minute",
              price: 249,
              priceCurrency: "EUR",
            },
          ],
        }}
      />
      <ServiceLanding data={data} seo={{ breadcrumb: [{ name: TITLE, path: "/ki-telefonassistenz" }] }} />
    </>
  );
}
