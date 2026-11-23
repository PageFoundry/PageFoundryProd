import ProjectCaseStudy, { type ProjectCaseStudyData } from "@/components/landing/ProjectCaseStudy";
import JsonLd, { getBreadcrumbSchema, getServiceSchema } from "@/components/JsonLd";
import { createPageMetadata } from "@/lib/seo/metadata";

const TITLE = "Individuelle Rechnungssoftware für Carbon Care";
const DESCRIPTION =
  "Für die Fahrzeugaufbereitung Carbon Care habe ich eine Landingpage und eine eigene Rechnungssoftware entwickelt. Die Demo zeigt Rechnungen und Zahlungsstände.";
const URL = "https://pagefoundry.de/projekte/carbon-care";

export const metadata = createPageMetadata({
  path: "/projekte/carbon-care",
  title: TITLE,
  description: DESCRIPTION,
  locale: "de_DE",
});

const data: ProjectCaseStudyData = {
  eyebrow: "Projekt · Carbon Care",
  heading: TITLE,
  subline:
    "Für die Fahrzeugaufbereitung Carbon Care habe ich eine Website und eine eigene Rechnungsanwendung entwickelt. In der Rechnungsübersicht kann der Betrieb einen Vorgang einem Kunden und Fahrzeug zuordnen und direkt sehen, ob der Betrag noch offen ist.",
  domain: "rechnung.carbon-care.de",
  url: "https://carbon-care.de",
  visitLabel: "Kundenwebsite öffnen",
  image: "/work/carbon-care.jpg",
  imageAlt:
    "Rechnungssoftware für Carbon Care: Rechnungsübersicht (Demoansicht mit Beispieldaten)",
  imageCaption:
    "Rechnungsübersicht mit Beispieldaten. Jede Zeile zeigt die Rechnungsnummer, den Kunden, das Fahrzeug und den Betrag. Rechts kennzeichnet die Spalte „Bezahlt“, welche Rechnungen offen und welche bezahlt sind.",
  situation: {
    label: "Ausgangslage",
    heading: "0 eigene Web-Systeme.",
    text: "Carbon Care hatte weder eine eigene Website noch ein Werkzeug für Rechnungen. Angebote und Rechnungen liefen manuell, ohne festen, wiederholbaren Ablauf.",
  },
  task: {
    label: "Aufgabe",
    heading: "Sichtbarkeit und ein eigener Rechnungsablauf.",
    text: "Zwei Aufgaben in einem Projekt: eine fokussierte Landingpage, über die Interessenten Carbon Care finden und kontaktieren können, und eine individuelle Rechnungssoftware für den täglichen Ablauf im Betrieb.",
  },
  implementation: {
    label: "Umsetzung",
    heading: "Zwei Systeme, ein gemeinsamer Ansprechpartner.",
    points: [
      "Landingpage: klare Darstellung des Angebots, direkter Kontaktweg, live unter carbon-care.de.",
      "In der Anwendung lässt sich ein Rechnungsvorgang anhand von Nummer, Kunde oder Fahrzeug in der Übersicht wiederfinden. Rechnungsstatus und Zahlungsstand stehen getrennt in derselben Zeile.",
      "Beide Systeme sind eigenständig nutzbar und laufen unabhängig voneinander im Tagesbetrieb.",
    ],
  },
  result: {
    label: "Dokumentierter Stand",
    heading: "Zwei Systeme live, Google-Stand vom 22.04.2026: 10 Bewertungen, Ø 5,0.",
    text: "Nach dem Go-live im Februar 2026 sind Website und Rechnungstool live im Einsatz. Der gespeicherte Google-Unternehmensprofil-Stand vom 22.04.2026 weist 10 Bewertungen mit einem Durchschnitt von 5,0 aus. Diese Bewertungen sind Bewertungen des Kunden Carbon Care, nicht Bewertungen von PageFoundry.",
    evidenceSource: "Stand 22.04.2026",
  },
  scopeNote:
    "Diese Seite zeigt ausschließlich bereits öffentliche und mit Carbon Care abgestimmte Informationen zur Landingpage und zur Rechnungssoftware — keine internen Kundendaten, keine erfundenen Umsatz- oder Conversion-Zahlen und keine PageFoundry-Testimonials.",
  cta: {
    heading: "Ein ähnliches Projekt für Ihren Betrieb?",
    text: "In der kostenlosen Erstberatung schauen wir, ob eine Website, eine individuelle Software oder beides für Sie der richtige nächste Schritt ist.",
  },
  whatsappTopic: "Projekt Carbon Care",
  related: {
    label: "Passende Seiten",
    items: [
      { label: "Softwareentwicklung im Bergischen Land", href: "/individuelle-software" },
      { label: "Webdesign Bergisches Land", href: "/webdesign-bergisches-land" },
      { label: "Projekt The Loft", href: "/projekte/the-loft" },
      { label: "Alle Projekte", href: "/projekte" },
    ],
  },
};

export default function CarbonCareProjectPage() {
  return (
    <>
      <JsonLd
        data={getServiceSchema({
          name: "Carbon Care · Landingpage und individuelle Rechnungssoftware",
          description: DESCRIPTION,
          url: URL,
        })}
      />
      <JsonLd data={getBreadcrumbSchema([{ name: "Projekte", path: "/projekte" }, { name: "Carbon Care", path: "/projekte/carbon-care" }])} />
      <ProjectCaseStudy data={data} />
    </>
  );
}
