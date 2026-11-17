import Image from "next/image";
import TheLoftComparison from "@/components/landing/TheLoftComparison";
import ProjectCaseStudy, { type ProjectCaseStudyData } from "@/components/landing/ProjectCaseStudy";
import JsonLd, { getBreadcrumbSchema, getServiceSchema } from "@/components/JsonLd";
import { createPageMetadata } from "@/lib/seo/metadata";

const TITLE = "Restaurant-Website für The Loft in Wuppertal";
const DESCRIPTION =
  "Restaurant-Webdesign in Wuppertal für The Loft Brunch and Lunch. Mobile Vorher-Nachher-Ansichten zeigen den Weg zur Speisekarte und zu den Öffnungszeiten.";
const URL = "https://pagefoundry.de/projekte/the-loft";

export const metadata = createPageMetadata({
  path: "/projekte/the-loft",
  title: TITLE,
  description: DESCRIPTION,
  locale: "de_DE",
});

const data: ProjectCaseStudyData = {
  eyebrow: "Projekt · The Loft",
  heading: TITLE,
  subline:
    "Wer bei The Loft brunchen möchte, braucht vor dem Besuch die Karte, die Adresse und die Brunchzeiten. Beim Relaunch habe ich diese Angaben auf der Startseite zusammengeführt und das WordPress-Theme durch eine statische Website ersetzt.",
  domain: "theloftbrunch.de",
  url: "https://theloftbrunch.de",
  visitLabel: "Kundenwebsite öffnen",
  image: "/work/the-loft-cover-studio.webp",
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
      "Direkter Zugang zur digitalen Speisekarte vom Startbild und aus der mobilen Navigation.",
      "Statische Auslieferung ohne WordPress-Plugin-Stack — keine laufenden Plugin-Updates oder -Konflikte.",
      "Eigene Karten für Brunchzeiten und allgemeine Öffnungszeiten im Restaurantabschnitt der Startseite.",
    ],
  },
  result: {
    label: "Dokumentierter Stand",
    heading: "5 umgesetzte Kernwünsche, 0 WordPress-Plugins, live seit 06/2026.",
    text: "Die fünf dokumentierten Wünsche aus der Feedbackrunde sind umgesetzt. Die Gäste erreichen die digitale Speisekarte weiterhin unter ihrer bisherigen Adresse. Die neue Startseite wird statisch ausgeliefert.",
    evidenceSource: "Archiv + Live · 07/2026",
  },
  scopeNote:
    "Diese Seite zeigt ausschließlich bereits öffentliche und dokumentierte Informationen zum Relaunch — keine internen Kundendaten, keine erfundenen Umsatz- oder Reservierungszahlen und keine PageFoundry-Testimonials.",
  cta: {
    heading: "Soll Ihre Website auch so überzeugen?",
    text: "In der kostenlosen Erstberatung schauen wir uns Ihre aktuelle Website an und zeigen die Hebel mit der größten Wirkung.",
  },
  whatsappTopic: "Projekt The Loft",
  related: {
    label: "Passende Seiten",
    items: [
      { label: "Website-Rettung", href: "/website-rettung" },
      { label: "Webdesign Bergisches Land", href: "/webdesign-bergisches-land" },
      { label: "Projekt Carbon Care", href: "/projekte/carbon-care" },
      { label: "Website für Restaurants und Cafés", href: "/website-fuer-gastronomie" },
      { label: "Webdesign Wuppertal", href: "/webdesign-wuppertal" },
      { label: "Alle Projekte", href: "/projekte" },
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
      <JsonLd data={getBreadcrumbSchema([{ name: "Projekte", path: "/projekte" }, { name: "The Loft", path: "/projekte/the-loft" }])} />
      <ProjectCaseStudy
        data={data}
        cover={
          <picture className="block">
            <source media="(max-width: 639px)" srcSet="/work/the-loft-cover-mobile.webp" width={900} height={1050} />
            <Image
              src={data.image}
              alt={data.imageAlt}
              width={1920}
              height={1200}
              sizes="(min-width: 1360px) 1280px, 96vw"
              className="block h-auto w-full"
            />
          </picture>
        }
      >
        <TheLoftComparison />
      </ProjectCaseStudy>
    </>
  );
}
