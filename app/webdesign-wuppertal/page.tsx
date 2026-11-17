import Link from "next/link";
import TheLoftExampleLink from "@/components/landing/TheLoftExampleLink";
import ServiceLanding, { type ServiceLandingData } from "@/components/landing/ServiceLanding";
import JsonLd, { getServiceSchema } from "@/components/JsonLd";
import { createPageMetadata } from "@/lib/seo/metadata";
import { regionalPricing, regionalReferences } from "@/lib/seo/regionalWebdesign";

const TITLE = "Webdesign Wuppertal";
const META_TITLE = "Webdesign Wuppertal: Websites ab 790 € Festpreis";
const DESCRIPTION =
  "Webdesign für Wuppertal aus Hückeswagen: Websites zum Festpreis ab 790 €, Vorschau vor der Abnahme. Projekt vor Ort: The Loft. Termin nach Absprache.";
const PATH = "/webdesign-wuppertal";

export const metadata = createPageMetadata({ path: PATH, title: META_TITLE, description: DESCRIPTION, locale: "de_DE" });

const data: ServiceLandingData = {
  eyebrow: "Webdesign · Wuppertal",
  heroHeading: "Webdesign für Wuppertal: ein Ansprechpartner, feste Preise, ein Projekt vor Ort.",
  heroSubline:
    "In Wuppertal gibt es viele Agenturen. PageFoundry ist keine: Eine Person plant, baut und betreut Ihre Website, zu veröffentlichten Festpreisen. Für The Loft Brunch and Lunch in Wuppertal habe ich den Website-Relaunch umgesetzt. Mein Sitz ist Hückeswagen, ein Büro in Wuppertal gibt es nicht.",
  heroNote: <TheLoftExampleLink />,
  problem: {
    label: "Ausgangslage",
    heading: "Was vor einem Website-Projekt geklärt sein sollte.",
    points: [
      "Wer ist nach dem Start zuständig? Bei mir bleibt es bei einer Person, von der Planung bis zum Betrieb.",
      "Was kostet es am Ende? Meine drei Stufen haben veröffentlichte Festpreise. Mehrarbeit stimme ich vorher ab.",
      "Braucht die Seite ein großes System? Für The Loft habe ich ein WordPress-Theme mit Plugin-Stack durch eine statische Website ersetzt. Ob das auch bei Ihnen passt, hängt von Ihren Inhalten ab.",
    ],
  },
  steps: {
    label: "Zusammenarbeit",
    heading: "Zusammenarbeit ohne Büro vor Ort.",
    items: [
      {
        title: "Erstgespräch",
        text: "Per Telefon, Video oder nach Absprache bei Ihnen in Wuppertal. Ich kläre Ziel, Inhalte und die passende Stufe.",
      },
      {
        title: "Vorschau",
        text: "Sie erhalten einen Seitenplan und einen Vorschau-Link mit Ihren Inhalten. Eine Korrekturrunde ist enthalten.",
      },
      {
        title: "Start und Betrieb",
        text: "Nach Ihrer Abnahme geht die Website online. Auf Wunsch übernehme ich Hosting, Domain, Backups und Überwachung.",
      },
    ],
  },
  included: {
    label: "Umfang",
    heading: "Was Sie bekommen.",
    items: [
      "Website in einer von drei Stufen mit festem Umfang",
      "Mobile Umsetzung mit direktem Anruf-, WhatsApp- und Kontaktweg",
      "Ab Gefunden: lokale SEO-Grundlage und eingerichtetes Google-Unternehmensprofil",
      "Ein fester Ansprechpartner aus Hückeswagen",
    ],
    note: "Texte, Bilder, Seitenumfang und spätere Betreuung werden im Angebot festgelegt. Ich verspreche weder bestimmte Google-Platzierungen noch feste Anfragezahlen. PageFoundry hat seinen Sitz in Hückeswagen und keine Niederlassung in Wuppertal.",
  },
  pricing: regionalPricing,
  faq: {
    label: "Fragen zur Zusammenarbeit",
    heading: "Webdesign in Wuppertal: konkret besprochen.",
    items: [
      {
        q: "Kommen Sie für Termine nach Wuppertal?",
        a: "Ja, nach Absprache. Zwischenstände stimme ich per Telefon, WhatsApp oder Video ab. Mein Firmensitz bleibt Hückeswagen.",
      },
      {
        q: "Welches Projekt haben Sie in Wuppertal umgesetzt?",
        a: (
          <>
            Den Relaunch der Website von The Loft Brunch and Lunch. Vorher lief dort ein WordPress-Theme mit Plugin-Stack, heute eine statische Website mit klarer Führung zu Atmosphäre, Öffnungszeiten und Speisekarte. Live seit Juni 2026. Die{" "}
            <Link href="/projekte/the-loft" className="text-pfAccent underline underline-offset-4">Projektseite</Link> zeigt den dokumentierten Stand.
          </>
        ),
        aText:
          "Den Relaunch der Website von The Loft Brunch and Lunch. Vorher lief dort ein WordPress-Theme mit Plugin-Stack, heute eine statische Website mit klarer Führung zu Atmosphäre, Öffnungszeiten und Speisekarte. Live seit Juni 2026. Die Projektseite zeigt den dokumentierten Stand.",
      },
      {
        q: "Bauen Sie auch für Betriebe außerhalb der Gastronomie?",
        a: "Ja. Die Stufen gelten unabhängig von der Branche, etwa für Handwerk, Dienstleister und Einzelhandel. Das zweite dokumentierte Projekt ist Carbon Care aus der Fahrzeugaufbereitung, mit Landingpage und eigener Rechnungssoftware.",
      },
      {
        q: "Übernehmen Sie eine bestehende WordPress-Website?",
        a: (
          <>
            Ich prüfe zuerst, ob die Basis brauchbar ist. Wenn ja, optimiere ich gezielt. Wenn nicht, baue ich neu in einer der drei Stufen. Mehr dazu auf der Seite{" "}
            <Link href="/website-rettung" className="text-pfAccent underline underline-offset-4">Bestehende Website überarbeiten</Link>.
          </>
        ),
        aText:
          "Ich prüfe zuerst, ob die Basis brauchbar ist. Wenn ja, optimiere ich gezielt. Wenn nicht, baue ich neu in einer der drei Stufen. Mehr dazu auf der Seite Bestehende Website überarbeiten.",
      },
    ],
  },
  references: regionalReferences && { ...regionalReferences, items: [...regionalReferences.items].reverse() },
  related: {
    label: "Weitere Seiten",
    items: [
      { label: "Projekt The Loft", href: "/projekte/the-loft" },
      { label: "Website für Restaurants und Cafés", href: "/website-fuer-gastronomie" },
      { label: "Webdesign im Bergischen Land", href: "/webdesign-bergisches-land" },
      { label: "Bestehende Website überarbeiten", href: "/website-rettung" },
      { label: "SEO aus Hückeswagen", href: "/seo-hueckeswagen" },
    ],
  },
  cta: {
    heading: "Was soll Ihre Website in Wuppertal leisten?",
    text: "In der kostenlosen Erstberatung kläre ich Ausgangslage, Ziele und den nächsten sinnvollen Schritt. Ein persönlicher Termin vor Ort wird individuell vereinbart.",
  },
  auditHint: true,
};

export default function WebdesignWuppertalPage() {
  return (
    <>
      <JsonLd data={{
        ...getServiceSchema({ name: TITLE, description: DESCRIPTION, url: `https://pagefoundry.de${PATH}` }),
        areaServed: { "@type": "City", name: "Wuppertal" },
      }} />
      <ServiceLanding
        data={data}
        seo={{ breadcrumb: [{ name: "Webdesign Bergisches Land", path: "/webdesign-bergisches-land" }, { name: TITLE, path: PATH }] }}
      />
    </>
  );
}
