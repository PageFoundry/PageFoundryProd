import Image from "next/image";
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

const mobileExamples = [
  {
    heading: "Wo finde ich die Speisekarte?",
    detail: "Der bestehende Link zur digitalen Speisekarte blieb erhalten. Im neuen Startbild steht darüber auch die Adresse in Wuppertal. Über das mobile Menü lässt sich die Karte ebenfalls öffnen.",
    images: [
      { label: "Vor dem Relaunch", src: "/work/the-loft-mobile-speisekarte-vorher.webp", width: 390, height: 314, alt: "Alter Startbereich mit dem Namen The Loft und dem Button zur Speisekarte." },
      { label: "Nach dem Relaunch", src: "/work/the-loft-mobile-speisekarte-nachher.webp", width: 381, height: 320, alt: "Neuer Startbereich mit Wuppertaler Adresse und Zugang zur Speisekarte." },
    ],
  },
  {
    heading: "Bis wann gibt es Brunch?",
    detail: "Auf der früheren Startseite standen Brunch- und Öffnungszeiten im Fußbereich. Heute zeigen zwei Karten diese Angaben bereits im Restaurantabschnitt. Gäste können die Brunchzeiten direkt mit den allgemeinen Öffnungszeiten vergleichen.",
    images: [
      { label: "Vor dem Relaunch", src: "/work/the-loft-mobile-zeiten-vorher.webp", width: 358, height: 253, alt: "Die frühere Fußzeile listet Öffnungs- und Brunchzeiten in einem Textblock." },
      { label: "Nach dem Relaunch", src: "/work/the-loft-mobile-zeiten-nachher.webp", width: 342, height: 488, alt: "Der neue Restaurantabschnitt zeigt eigene Karten für Brunch, Öffnungszeiten und Reservierungshinweise." },
    ],
  },
];

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
      <ProjectCaseStudy data={data}>
        <section id="mobiler-vergleich" aria-labelledby="vergleich-titel" className="scroll-mt-24 border-t border-pfBorder px-6 py-16 md:px-10 md:py-20">
          <div className="mx-auto max-w-screen-xl">
            <h2 id="vergleich-titel" className="font-display text-4xl leading-none text-pfText md:text-6xl">
              Die mobile Website vor und nach dem Relaunch
            </h2>
            <p className="mt-5 max-w-3xl text-sm leading-7 text-pfSubtle">
              Die Ausschnitte zeigen die Startseite auf einem 390 Pixel breiten Bildschirm. Die frühere Version stammt aus dem{" "}
              <a href="https://web.archive.org/web/20260410193012/https://theloftbrunch.de/" className="text-pfAccent underline underline-offset-4">Webarchiv vom 10. April 2026</a>.
              Die neue Website wurde am 17. November 2026 aufgenommen.
            </p>
            {mobileExamples.map((example) => (
              <div key={example.heading} className="mt-12 max-w-3xl">
                <h3 className="font-display text-2xl text-pfText md:text-3xl">{example.heading}</h3>
                <p className="mt-3 text-sm leading-7 text-pfSubtle md:text-base">{example.detail}</p>
                <div className="mt-5 grid items-start gap-5 sm:grid-cols-2">
                  {example.images.map((item) => (
                    <figure key={item.src} className="overflow-hidden border border-pfBorder bg-pfCard">
                      <figcaption className="px-4 py-3 text-sm text-pfText">{item.label}</figcaption>
                      <Image src={item.src} alt={item.alt} width={item.width} height={item.height} sizes="(min-width: 640px) 375px, 90vw" className="h-auto w-full border-t border-pfBorder" />
                    </figure>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </ProjectCaseStudy>
    </>
  );
}
