import Image from "next/image";
import Link from "next/link";
import ServiceCTA from "@/components/landing/ServiceCTA";
import JsonLd, { getBreadcrumbSchema, whatsappHref } from "@/components/JsonLd";
import { createPageMetadata } from "@/lib/seo/metadata";

const TITLE = "Projekte";
const META_TITLE = "Projekte: umgesetzte Websites und Software";
const DESCRIPTION =
  "Zwei dokumentierte Kundenprojekte: Carbon Care (Landingpage und Rechnungssoftware) und The Loft (Website-Relaunch in Wuppertal). Mit Ausgangslage und Umsetzung.";
const PATH = "/projekte";

export const metadata = createPageMetadata({ path: PATH, title: META_TITLE, description: DESCRIPTION, locale: "de_DE" });

const projects = [
  {
    name: "Carbon Care · Fahrzeugaufbereitung",
    kind: "Landingpage und individuelle Rechnungssoftware · live seit 02/2026",
    text: "Vor dem Projekt gab es weder eine Website noch einen eigenen, wiederholbaren Rechnungsablauf. Heute laufen eine Landingpage und eine Rechnungssoftware mit Rechnungen, Status und Zahlungsstand im täglichen Betrieb.",
    image: "/work/carbon-care.jpg",
    imageAlt: "Individuelle Rechnungssoftware für Carbon Care: Rechnungsübersicht mit Status und Zahlungsstand (Demoansicht mit Beispieldaten)",
    href: "/projekte/carbon-care",
    external: "https://carbon-care.de",
  },
  {
    name: "The Loft · Gastronomie in Wuppertal",
    kind: "Website-Relaunch · live seit 06/2026",
    text: "Statt eines WordPress-Themes mit Plugin-Stack führt eine statische Website zu Atmosphäre, Öffnungszeiten und Speisekarte. Fünf Kernwünsche aus einer Kundenfeedback-Runde sind umgesetzt.",
    image: "/work/the-loft.jpg",
    imageAlt: "Startseite von The Loft Brunch and Lunch in Wuppertal",
    href: "/projekte/the-loft",
    external: "https://theloftbrunch.de",
  },
];

export default function ProjektePage() {
  return (
    <div data-public-page lang="de" className="relative z-10 text-pfText">
      <JsonLd data={getBreadcrumbSchema([{ name: TITLE, path: PATH }])} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          itemListElement: projects.map((project, index) => ({
            "@type": "ListItem",
            position: index + 1,
            url: `https://pagefoundry.de${project.href}`,
            name: project.name,
          })),
        }}
      />

      <section className="relative overflow-hidden px-6 pb-16 pt-32 md:px-10 md:pt-36">
        <div className="mx-auto max-w-screen-xl">
          <h1 className="max-w-4xl font-display text-5xl leading-[0.9] tracking-wide text-pfText md:text-7xl">
            Projekte: zwei dokumentierte Kundenprojekte.
          </h1>
          <div className="my-8 h-px w-28 bg-gradient-to-r from-pfAccent to-transparent" />
          <p className="max-w-2xl text-base leading-8 text-pfSubtle md:text-lg">
            Hier stehen die Projekte, die öffentlich dokumentiert sind. Jede Projektseite zeigt Ausgangslage, Aufgabe und Umsetzung, ohne erfundene Zahlen.
          </p>
        </div>
      </section>

      <section className="px-6 pb-20 md:px-10">
        <div className="mx-auto grid max-w-screen-xl gap-6 md:grid-cols-2">
          {projects.map((project) => (
            <article key={project.href} className="pf-card overflow-hidden">
              <div className="relative aspect-[16/10] border-b border-pfBorder">
                <Image src={project.image} alt={project.imageAlt} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover object-top" />
              </div>
              <div className="p-7 md:p-9">
                <p className="font-mono text-xs leading-5 text-pfMuted">{project.kind}</p>
                <h2 className="mt-4 font-display text-3xl leading-none text-pfText md:text-4xl">{project.name}</h2>
                <p className="mt-4 text-sm leading-7 text-pfSubtle">{project.text}</p>
                <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2">
                  <Link href={project.href} className="inline-flex text-sm text-pfAccent underline underline-offset-4">Projektseite ansehen</Link>
                  <a href={project.external} className="inline-flex text-sm text-pfAccent underline underline-offset-4">Kundenwebsite öffnen ↗</a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <ServiceCTA
        heading="Ein ähnliches Projekt für Ihren Betrieb?"
        text="In der kostenlosen Erstberatung schauen wir, ob eine Website, eine individuelle Software oder beides für Sie der richtige nächste Schritt ist."
        whatsappHref={whatsappHref("Projekte")}
      />
    </div>
  );
}
