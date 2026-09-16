import ProjectCaseStudy, { type ProjectCaseStudyData } from "@/components/landing/ProjectCaseStudy";
import JsonLd, { getServiceSchema } from "@/components/JsonLd";
import { createPageMetadata } from "@/lib/seo/metadata";

const TITLE = "Projekt The Loft";
const DESCRIPTION =
  "Projektseite The Loft: Website-Relaunch für ein Gastronomie-Unternehmen in Wuppertal, live seit 06/2026 — Ausgangslage, Umsetzung und dokumentiertes Ergebnis.";
const URL = "https://pagefoundry.de/projekte/the-loft";

export const metadata = createPageMetadata({
  path: "/projekte/the-loft",
  title: TITLE,
  description: DESCRIPTION,
  locale: "de_DE",
});

const data: ProjectCaseStudyData = {
  eyebrow: "Projekt · The Loft",
  heading: "Eine Website, die sich so hochwertig anfühlt wie der Ort.",
  subline:
    "The Loft Brunch and Lunch in Wuppertal betrieb zuvor ein WordPress-Theme mit Plugin-Stack. Atmosphäre, Öffnungszeiten und Besucherführung waren nicht klar priorisiert.",
  domain: "theloftbrunch.de",
  url: "https://theloftbrunch.de",
  visitLabel: "Kundenwebsite öffnen",
  image: "/work/the-loft-desktop.jpg",
  imageAspectRatio: "1440 / 1000",
  imageAlt: "Startseite von The Loft Brunch and Lunch in Wuppertal",
  situation: {
    label: "Ausgangslage",
    heading: "WordPress mit Plugin-Stack.",
    text: "Die bisherige Website lief auf einem WordPress-Theme mit mehreren Plugins. Atmosphäre, Öffnungszeiten und der Zugang zur Speisekarte waren nicht klar geführt.",
  },
  task: {
    label: "Aufgabe",
    heading: "Relaunch ohne zusätzliche Redaktionssoftware.",
    text: "Ziel war eine Website, die die Atmosphäre des Ortes transportiert, Öffnungszeiten und Speisekarte klar zugänglich macht und ohne die Wartungslast eines Plugin-Stacks auskommt.",
  },
  implementation: {
    label: "Umsetzung",
    heading: "Statischer Relaunch mit klarer Besucherführung.",
    points: [
      "Neue Startseite mit klarer Priorisierung von Atmosphäre, Öffnungszeiten und Besuchsinformationen.",
      "Statische Auslieferung ohne WordPress-Plugin-Stack — keine laufenden Plugin-Updates oder -Konflikte.",
      "Fünf Kernwünsche aus einer Kundenfeedback-Runde wurden im Relaunch konkret umgesetzt.",
    ],
  },
  result: {
    label: "Dokumentierter Stand",
    heading: "5 umgesetzte Kernwünsche, 0 WordPress-Plugins, live seit 06/2026.",
    text: "Die fünf dokumentierten Kernwünsche aus der Kundenfeedback-Runde sind im Relaunch umgesetzt. Die ausgelieferte Website ist statisch und kommt ohne WordPress-Plugins aus. Der Relaunch ist seit Juni 2026 live.",
    evidenceSource: "Archiv + Live · 07/2026",
  },
  scopeNote:
    "Diese Seite zeigt ausschließlich bereits öffentliche und dokumentierte Informationen zum Relaunch — keine internen Kundendaten, keine erfundenen Umsatz- oder Reservierungszahlen und keine PageFoundry-Testimonials.",
  cta: {
    heading: "Soll Ihre Website auch so überzeugen?",
    text: "In der kostenlosen Erstberatung schauen wir uns Ihre aktuelle Website an und zeigen die Hebel mit der größten Wirkung.",
  },
  related: {
    label: "Passende Seiten",
    items: [
      { label: "Website-Rettung", href: "/website-rettung" },
      { label: "Webdesign Bergisches Land", href: "/webdesign-bergisches-land" },
      { label: "Projekt Carbon Care", href: "/projekte/carbon-care" },
    ],
  },
};

export default function TheLoftProjectPage() {
  return (
    <>
      <JsonLd
        data={getServiceSchema({
          name: "The Loft · Website-Relaunch",
          description: DESCRIPTION,
          url: URL,
        })}
      />
      <ProjectCaseStudy data={data} />
    </>
  );
}
