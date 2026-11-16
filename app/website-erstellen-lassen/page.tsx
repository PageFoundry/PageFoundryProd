import Link from "next/link";
import ServiceLanding, { type ServiceLandingData } from "@/components/landing/ServiceLanding";
import JsonLd, { getServiceSchema } from "@/components/JsonLd";
import { createPageMetadata } from "@/lib/seo/metadata";
import { regionalPricing, regionalReferences } from "@/lib/seo/regionalWebdesign";
import { stageOffers } from "@/lib/seo/costTables";

const TITLE = "Website erstellen lassen";
const META_TITLE = "Website erstellen lassen zum Festpreis ab 790 €";
const DESCRIPTION =
  "Website erstellen lassen für Betriebe und Selbstständige: drei Festpreis-Stufen ab 790 €, Vorschau vor der Abnahme, online nach rund 10–14 Tagen.";
const PATH = "/website-erstellen-lassen";

export const metadata = createPageMetadata({ path: PATH, title: META_TITLE, description: DESCRIPTION, locale: "de_DE" });

const data: ServiceLandingData = {
  eyebrow: "Websites zum Festpreis",
  heroHeading: "Website erstellen lassen: fester Preis, ein Ansprechpartner.",
  heroSubline:
    "Sie möchten eine Website erstellen lassen und vorher wissen, was sie kostet und was Sie dafür bekommen? Ich baue Websites für Betriebe, Selbstständige und kleine Unternehmen in drei festen Stufen: eine Seite für 790 €, eine Firmenwebsite mit bis zu fünf Seiten für 1.390 € oder eine Website mit Buchungs-, Anfrage- oder Shopfunktion für 2.490 €. Planung, Umsetzung und Betrieb liegen bei einer Person: Fabian Franke aus Hückeswagen.",
  problem: {
    label: "Ausgangslage",
    heading: "Woran Website-Projekte in kleinen Betrieben hängen bleiben.",
    points: [
      "Das Angebot nennt einen Stundensatz, aber keinen Endpreis. Was die Website kostet, steht erst auf der Rechnung.",
      "Der Baukasten wirkt günstig, kostet aber Abende und Wochenenden. Struktur, Texte und Technik bleiben trotzdem bei Ihnen.",
      "Nach dem Start ist niemand zuständig. Für eine geänderte Öffnungszeit oder ein neues Foto fehlt der Ansprechpartner.",
    ],
  },
  steps: {
    label: "Ablauf",
    heading: "So entsteht Ihre Website.",
    items: [
      {
        title: "Anfrage und Stufe",
        text: "Sie schildern Betrieb und Ziel per Formular, WhatsApp oder Telefon. Ich antworte am selben Werktag mit passender Stufe, Preisrahmen und Arbeitsprobe.",
      },
      {
        title: "Seitenplan und Vorschau",
        text: "Ich kläre Inhalte, Bilder und Kontaktwege mit Ihnen. Sie erhalten einen Seitenplan und einen Vorschau-Link mit Ihren Inhalten, bevor etwas online geht.",
      },
      {
        title: "Korrektur, Abnahme, Start",
        text: "Eine Korrekturrunde ist enthalten. Danach nehmen Sie die Website mit einer Prüfliste ab. Online geht sie nach rund 10–14 Tagen, abhängig von Inhalten und Freigaben.",
      },
    ],
  },
  included: {
    label: "Umfang",
    heading: "Was in jeder Stufe steckt und was nicht.",
    items: [
      "Mobile Umsetzung, die auf dem Smartphone ohne Zoomen bedienbar ist",
      "Kontakt, WhatsApp, Anruf und Karte",
      "Impressum und Datenschutz eingebunden",
      "Basis-SEO: Seitentitel, Beschreibungen und eine saubere Seitenstruktur",
      "Ab Gefunden: lokale SEO-Grundlage und eingerichtetes Google-Unternehmensprofil",
      "Ein Ansprechpartner von der Planung bis zum Betrieb",
    ],
    note: "Ehrliche Grenzen: Jede Stufe hat einen festen Umfang. Ein Redaktionssystem zum Selbstpflegen und zusätzliche Korrekturrunden sind nicht pauschal enthalten. Texte, Bilder, Seitenumfang und spätere Betreuung werden im Angebot festgelegt. Lizenzen für Fremddienste und Zahlungsgebühren tragen Sie selbst. Ich verspreche weder bestimmte Google-Platzierungen noch feste Anfragezahlen.",
  },
  pricing: regionalPricing,
  faq: {
    label: "FAQ",
    heading: "Website erstellen lassen: häufige Fragen.",
    items: [
      {
        q: "Was kostet es, eine Website erstellen zu lassen?",
        a: (
          <>
            Bei mir 790 € für eine Seite mit bis zu sechs Abschnitten (Sichtbar), 1.390 € für bis zu fünf Seiten mit lokaler SEO-Grundlage und eingerichtetem Google-Unternehmensprofil (Gefunden) und 2.490 € für bis zu zehn Inhaltsseiten oder fünf Seiten plus ein Standardmodul (Gebucht). Alle Preise sind Endpreise. Wie sich die Kosten zusammensetzen, zeigt die Seite{" "}
            <Link href="/website-kosten" className="text-pfAccent underline underline-offset-4">Website-Kosten</Link>.
          </>
        ),
        aText:
          "Bei mir 790 € für eine Seite mit bis zu sechs Abschnitten (Sichtbar), 1.390 € für bis zu fünf Seiten mit lokaler SEO-Grundlage und eingerichtetem Google-Unternehmensprofil (Gefunden) und 2.490 € für bis zu zehn Inhaltsseiten oder fünf Seiten plus ein Standardmodul (Gebucht). Alle Preise sind Endpreise. Wie sich die Kosten zusammensetzen, zeigt die Seite Website-Kosten.",
      },
      {
        q: "Wie lange dauert es, bis die Website online ist?",
        a: "In der Regel rund 10–14 Tage. Entscheidend ist, wie schnell Inhalte, Bilder und Freigaben vorliegen. Den Zeitplan nenne ich vor dem Start.",
      },
      {
        q: "Baukasten oder Website erstellen lassen?",
        a: "Ein Baukasten passt, wenn Sie Zeit haben, sich einzuarbeiten, und Struktur, Texte und Technik selbst verantworten möchten. Erstellen lassen lohnt sich, wenn Sie Ihre Zeit im Betrieb brauchen und einen festen Ansprechpartner wollen. Wenn ein Baukasten für Ihren Fall genügt, sage ich Ihnen das im Erstgespräch.",
      },
      {
        q: "Gehört die Website danach mir?",
        a: "Ja. Nach dem Kauf gehört die Website Ihnen, und die Domain läuft von Anfang an auf Ihren Namen. In der betreuten Variante gehört sie Ihnen nach 24 Monaten oder nach einer Ablöse. Ein Übergabepaket ist inklusive.",
      },
      {
        q: "Muss ich alles auf einmal bezahlen?",
        a: (
          <>
            Nein. Unternehmen können statt des Kaufs die betreute Variante wählen: eine kleinere Einrichtung und ein fester Monatsbeitrag über 24 Monate, zum Beispiel 190 € plus 49 € im Monat für Sichtbar. Die ganze Rechnung steht auf der Seite{" "}
            <Link href="/website-mieten" className="text-pfAccent underline underline-offset-4">Website mieten</Link>.
          </>
        ),
        aText:
          "Nein. Unternehmen können statt des Kaufs die betreute Variante wählen: eine kleinere Einrichtung und ein fester Monatsbeitrag über 24 Monate, zum Beispiel 190 € plus 49 € im Monat für Sichtbar. Die ganze Rechnung steht auf der Seite Website mieten.",
      },
      {
        q: "Arbeiten Sie nur im Bergischen Land?",
        a: "Nein. Mein Sitz ist Hückeswagen, persönliche Termine vereinbare ich in der Region. Die Zusammenarbeit läuft per Telefon, WhatsApp und Video auch deutschlandweit.",
      },
    ],
  },
  references: regionalReferences,
  related: {
    label: "Passende Seiten",
    items: [
      { label: "Website-Kosten", href: "/website-kosten" },
      { label: "Website mieten", href: "/website-mieten" },
      { label: "Bestehende Website überarbeiten", href: "/website-rettung" },
      { label: "Website für Handwerker", href: "/website-fuer-handwerker" },
      { label: "Website für Restaurants und Cafés", href: "/website-fuer-gastronomie" },
      { label: "Webdesign Bergisches Land", href: "/webdesign-bergisches-land" },
    ],
  },
  cta: {
    heading: "Was soll Ihre Website für Sie erledigen?",
    text: "In der kostenlosen Erstberatung kläre ich mit Ihnen Ziel, Umfang und die passende Stufe. Danach erhalten Sie ein schriftliches Angebot mit festem Preis.",
  },
  auditHint: true,
};

export default function WebsiteErstellenLassenPage() {
  return (
    <>
      <JsonLd data={{ ...getServiceSchema({ name: TITLE, description: DESCRIPTION, url: `https://pagefoundry.de${PATH}` }), offers: stageOffers }} />
      <ServiceLanding data={data} seo={{ breadcrumb: [{ name: TITLE, path: PATH }] }} />
    </>
  );
}
