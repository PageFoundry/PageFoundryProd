import ProjectCaseStudy, { type ProjectCaseStudyData } from "@/components/landing/ProjectCaseStudy";
import JsonLd, { getServiceSchema } from "@/components/JsonLd";
import { createPageMetadata } from "@/lib/seo/metadata";

const TITLE = "Projekt Carbon Care";
const DESCRIPTION =
  "Projektseite Carbon Care: Landingpage und individuelle Rechnungssoftware für die Fahrzeugaufbereitung, live seit 02/2026 — Ausgangslage, Umsetzung und dokumentiertes Ergebnis.";
const URL = "https://pagefoundry.de/projekte/carbon-care";

export const metadata = createPageMetadata({
  path: "/projekte/carbon-care",
  title: TITLE,
  description: DESCRIPTION,
  locale: "de_DE",
});

const data: ProjectCaseStudyData = {
  eyebrow: "Projekt · Carbon Care",
  heading: "Vom Neustart zur funktionierenden digitalen Basis.",
  subline:
    "Carbon Care bietet Fahrzeugaufbereitung an. Vor dem Projekt gab es weder eine Website noch einen eigenen, wiederholbaren Rechnungsablauf. Heute laufen beide Systeme im täglichen Betrieb.",
  domain: "rechnung.carbon-care.de",
  url: "https://carbon-care.de",
  visitLabel: "Kundenwebsite öffnen",
  image: "/work/carbon-care.jpg",
  imageAlt:
    "Individuelle Rechnungssoftware für Carbon Care: Rechnungsübersicht mit Status und Zahlungsstand (Demoansicht mit Beispieldaten)",
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
      "Individuelle Rechnungssoftware: eigenes Datenmodell für Rechnungen, Status und Zahlungsstand statt Zettelwirtschaft — im Screenshot als Demoansicht mit Beispieldaten gezeigt.",
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
  related: {
    label: "Passende Seiten",
    items: [
      { label: "Individuelle Software", href: "/individuelle-software" },
      { label: "Webdesign Bergisches Land", href: "/webdesign-bergisches-land" },
      { label: "Projekt The Loft", href: "/projekte/the-loft" },
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
      <ProjectCaseStudy data={data} />
    </>
  );
}
