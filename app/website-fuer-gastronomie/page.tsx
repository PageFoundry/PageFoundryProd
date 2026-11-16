import Link from "next/link";
import ServiceLanding, { type ServiceLandingData } from "@/components/landing/ServiceLanding";
import JsonLd, { getServiceSchema } from "@/components/JsonLd";
import { createPageMetadata } from "@/lib/seo/metadata";
import { regionalPricing, regionalReferences } from "@/lib/seo/regionalWebdesign";

const TITLE = "Website für Restaurants und Cafés";
const META_TITLE = "Website für Restaurants und Cafés ab 790 €";
const DESCRIPTION =
  "Website für Gastronomie: Speisekarte, Öffnungszeiten und Anfahrt auf dem Smartphone sofort erreichbar. Festpreis ab 790 €. Referenz: The Loft in Wuppertal.";
const PATH = "/website-fuer-gastronomie";

export const metadata = createPageMetadata({ path: PATH, title: META_TITLE, description: DESCRIPTION, locale: "de_DE" });

const data: ServiceLandingData = {
  eyebrow: "Websites für Gastronomie",
  heroHeading: "Website für Restaurants und Cafés: Speisekarte, Öffnungszeiten, Weg zu Ihnen.",
  heroSubline:
    "Gäste entscheiden unterwegs. Sie suchen Speisekarte, Öffnungszeiten und Anfahrt, meist auf dem Smartphone und oft kurz vor dem Besuch. Ich baue Gastronomie-Websites, die diese drei Fragen ohne Umweg beantworten und die Atmosphäre Ihres Hauses zeigen. Für The Loft Brunch and Lunch in Wuppertal habe ich so einen Relaunch umgesetzt.",
  problem: {
    label: "Ausgangslage",
    heading: "Woran Gastronomie-Websites häufig scheitern.",
    points: [
      "Die Speisekarte ist ein PDF, das auf dem Smartphone gezoomt werden muss, oder sie ist nicht mehr aktuell.",
      "Die Öffnungszeiten auf der Website weichen von denen bei Google ab. Gäste stehen vor verschlossener Tür.",
      "Ein WordPress-Theme mit vielen Plugins lädt langsam und braucht laufend Updates, für die im Tagesgeschäft niemand Zeit hat.",
    ],
  },
  steps: {
    label: "Ablauf",
    heading: "Vom Gastraum auf den Bildschirm.",
    items: [
      {
        title: "Prioritäten klären",
        text: "Ich kläre mit Ihnen, was Gäste zuerst sehen sollen: Atmosphäre, Karte, Öffnungszeiten oder Reservierung.",
      },
      {
        title: "Seite aufbauen",
        text: "Aus Ihren Fotos, der Karte und den Besuchsinformationen entsteht die Website. Sie sehen eine Vorschau mit Ihren Inhalten.",
      },
      {
        title: "Prüfen und starten",
        text: "Vor dem Start prüfe ich Darstellung, Links und Kontaktwege auf dem Smartphone. Ab der Stufe Gefunden richte ich auch Ihr Google-Unternehmensprofil ein.",
      },
    ],
  },
  included: {
    label: "Umfang",
    heading: "Was eine Gastronomie-Website bei mir enthält.",
    items: [
      "Speisekarte, die auf dem Smartphone ohne Zoomen lesbar ist",
      "Öffnungszeiten, Adresse, Karte und Anruf mit einem Fingertipp",
      "Fotos und Atmosphäre Ihres Hauses im Mittelpunkt",
      "Impressum und Datenschutz eingebunden",
    ],
    note: "Texte, Bilder, Seitenumfang und spätere Betreuung werden im Angebot festgelegt. Ein eigenes Bestell- oder Liefersystem ist nicht Teil der Stufen. Lizenzen für Reservierungs- oder Buchungsdienste tragen Sie selbst. Ich verspreche weder bestimmte Google-Platzierungen noch zusätzliche Reservierungen.",
  },
  pricing: regionalPricing,
  faq: {
    label: "FAQ",
    heading: "Gastronomie-Website: häufige Fragen.",
    items: [
      {
        q: "Was kostet eine Website für ein Restaurant oder Café?",
        a: "790 € für eine Seite mit bis zu sechs Abschnitten, 1.390 € für bis zu fünf Seiten mit lokaler SEO-Grundlage und eingerichtetem Google-Unternehmensprofil, 2.490 € für bis zu zehn Seiten oder fünf Seiten mit einem Standardmodul. Unternehmen können alternativ betreut starten, ab 190 € Einrichtung plus 49 € im Monat.",
      },
      {
        q: "Wie ändere ich die Speisekarte?",
        a: "Sie schicken mir die neue Karte per WhatsApp oder E-Mail. In der betreuten Variante sind je nach Stufe 2 bis 6 Änderungen pro Monat enthalten; kleine Änderungen setze ich binnen 72 Stunden um, sobald die Angaben vollständig vorliegen, ohne Reaktionszeitgarantie. Beim Kauf rechne ich Änderungen nach Aufwand ab, 19 € je angefangene 15 Minuten. Wer die Karte täglich wechselt, braucht eine andere Lösung. Das sage ich Ihnen im Erstgespräch.",
      },
      {
        q: "Brauche ich ein Reservierungssystem?",
        a: "Nicht zwingend. Für viele Häuser reichen Anruf und WhatsApp mit einem Fingertipp. Ob ein Reservierungsdienst für Ihr Haus passt, kläre ich im Erstgespräch.",
      },
      {
        q: "Welche Gastronomie-Referenz gibt es?",
        a: (
          <>
            The Loft Brunch and Lunch in Wuppertal: Relaunch einer WordPress-Website als statische Seite, live seit Juni 2026. Fünf Kernwünsche aus einer Kundenfeedback-Runde sind umgesetzt. Die{" "}
            <Link href="/projekte/the-loft" className="text-pfAccent underline underline-offset-4">Projektseite</Link> zeigt den dokumentierten Stand, keine erfundenen Reservierungszahlen.
          </>
        ),
        aText:
          "The Loft Brunch and Lunch in Wuppertal: Relaunch einer WordPress-Website als statische Seite, live seit Juni 2026. Fünf Kernwünsche aus einer Kundenfeedback-Runde sind umgesetzt. Die Projektseite zeigt den dokumentierten Stand, keine erfundenen Reservierungszahlen.",
      },
      {
        q: "Wer geht ans Telefon, wenn im Service niemand Zeit hat?",
        a: (
          <>
            Auf Wunsch meine{" "}
            <Link href="/ki-telefonassistenz" className="text-pfAccent underline underline-offset-4">KI-Telefonassistenz</Link>. Sie nimmt Anrufe in Ihrem Namen an, erfasst Anliegen und Wunschtermin und benachrichtigt Sie sofort. 790 € Einrichtung plus 249 € im Monat mit 300 Gesprächsminuten, unabhängig von der Website buchbar.
          </>
        ),
        aText:
          "Auf Wunsch meine KI-Telefonassistenz. Sie nimmt Anrufe in Ihrem Namen an, erfasst Anliegen und Wunschtermin und benachrichtigt Sie sofort. 790 € Einrichtung plus 249 € im Monat mit 300 Gesprächsminuten, unabhängig von der Website buchbar.",
      },
    ],
  },
  references: regionalReferences && { ...regionalReferences, items: [...regionalReferences.items].reverse() },
  related: {
    label: "Passende Seiten",
    items: [
      { label: "Projekt The Loft", href: "/projekte/the-loft" },
      { label: "Bestehende Website überarbeiten", href: "/website-rettung" },
      { label: "KI-Telefonassistenz", href: "/ki-telefonassistenz" },
      { label: "Website-Kosten", href: "/website-kosten" },
      { label: "Webdesign Wuppertal", href: "/webdesign-wuppertal" },
    ],
  },
  cta: {
    heading: "Was sollen Gäste vor dem Besuch wissen?",
    text: "In der kostenlosen Erstberatung schaue ich mir Ihre aktuelle Website an und sage Ihnen ehrlich, was sich lohnt und was nicht.",
  },
};

export default function WebsiteFuerGastronomiePage() {
  return (
    <>
      <JsonLd data={getServiceSchema({ name: TITLE, description: DESCRIPTION, url: `https://pagefoundry.de${PATH}` })} />
      <ServiceLanding data={data} seo={{ breadcrumb: [{ name: TITLE, path: PATH }] }} />
    </>
  );
}
