import Link from "next/link";
import ServiceLanding, { type ServiceLandingData } from "@/components/landing/ServiceLanding";
import JsonLd, { getServiceSchema } from "@/components/JsonLd";
import { createPageMetadata } from "@/lib/seo/metadata";
import { regionalPricing, regionalReferences } from "@/lib/seo/regionalWebdesign";

const TITLE = "Website für Handwerker";
const META_TITLE = "Website für Handwerker zum Festpreis ab 790 €";
const DESCRIPTION =
  "Website für Handwerksbetriebe: Leistungen, Einsatzgebiet und Kontaktweg klar geordnet. Festpreis ab 790 €, online nach rund 10–14 Tagen.";
const PATH = "/website-fuer-handwerker";

export const metadata = createPageMetadata({ path: PATH, title: META_TITLE, description: DESCRIPTION, locale: "de_DE" });

const data: ServiceLandingData = {
  eyebrow: "Websites für das Handwerk",
  heroHeading: "Website für Handwerker: Leistungen, Einsatzgebiet, Anfrage.",
  heroSubline:
    "Wer einen Handwerker sucht, will drei Dinge wissen: Machen Sie diese Arbeit, kommen Sie zu mir, und wie erreiche ich Sie? Eine Handwerker-Website muss das in wenigen Sekunden beantworten, auch auf dem Smartphone. Ich baue solche Seiten zum Festpreis und bleibe danach Ihr Ansprechpartner für Änderungen und Betrieb.",
  problem: {
    label: "Ausgangslage",
    heading: "Was auf vielen Handwerker-Websites fehlt.",
    points: [
      "Die Leistungen stehen in einem Fließtext. Besucher erkennen nicht, ob Sie Sanierung, Reparatur oder Neubau übernehmen, und auch nicht, was Sie ablehnen.",
      "Das Einsatzgebiet bleibt offen. Ein Interessent aus dem Nachbarort weiß nicht, ob Sie zu ihm kommen.",
      "Der Kontakt klappt nur zu Bürozeiten. Auf der Baustelle geht niemand ans Telefon, und das Formular fragt Dinge ab, die für eine erste Einschätzung niemand braucht.",
    ],
  },
  steps: {
    label: "Ablauf",
    heading: "Von Ihren Aufträgen zur Seitenstruktur.",
    items: [
      {
        title: "Aufträge sortieren",
        text: "Ich bespreche mit Ihnen, welche Arbeiten Sie gern öfter machen, welche Sie ablehnen und in welchen Orten Sie unterwegs sind.",
      },
      {
        title: "Seite bauen",
        text: "Aus Ihren Angaben und Ihren Fotos von Baustellen und Ergebnissen entsteht die Website. Sie sehen sie über einen Vorschau-Link, bevor sie online geht.",
      },
      {
        title: "Anfrageweg testen",
        text: "Ich prüfe Anruf, WhatsApp und Formular auf dem Smartphone. Sie nehmen die Website mit einer Prüfliste ab.",
      },
    ],
  },
  included: {
    label: "Umfang",
    heading: "Was eine Handwerker-Website bei mir enthält.",
    items: [
      "Leistungsübersicht mit klaren Grenzen: was Sie machen und was nicht",
      "Einsatzgebiet mit Orten und Karte",
      "Anruf, WhatsApp und Kontakt mit einem Fingertipp",
      "Arbeitsbeispiele mit Ihren eigenen Fotos",
      "Ab Gefunden: lokale SEO-Grundlage und eingerichtetes Google-Unternehmensprofil",
      "Impressum und Datenschutz eingebunden",
    ],
    note: "Texte, Bilder, Seitenumfang und spätere Betreuung werden im Angebot festgelegt. Ein Angebotsrechner, ein Kundenportal oder die Anbindung an Ihre Handwerkersoftware sind eigene Vorhaben und nicht in den Stufen enthalten. Ich verspreche weder bestimmte Google-Platzierungen noch feste Anfragezahlen.",
  },
  pricing: regionalPricing,
  faq: {
    label: "FAQ",
    heading: "Website für Handwerker: häufige Fragen.",
    items: [
      {
        q: "Was kostet eine Website für einen Handwerksbetrieb?",
        a: "790 € für eine Seite mit bis zu sechs Abschnitten, 1.390 € für bis zu fünf Seiten mit lokaler SEO-Grundlage und Google-Unternehmensprofil, 2.490 € für bis zu zehn Seiten oder fünf Seiten mit Anfrage-Workflow, Terminbuchung oder kleinem Shop. Unternehmen können alternativ betreut starten, ab 190 € Einrichtung plus 49 € im Monat.",
      },
      {
        q: "Welche Stufe passt für Handwerker?",
        a: "Für einen Betrieb mit einem klaren Schwerpunkt reicht oft Sichtbar. Wer mehrere Leistungsbereiche auf eigenen Seiten zeigen und lokal bei Google auffindbar sein möchte, ist mit Gefunden besser bedient: Dort sind Unterseiten, die lokale SEO-Grundlage und das Google-Unternehmensprofil enthalten.",
      },
      {
        q: "Ich habe keine Zeit für Texte und Fotos. Geht das trotzdem?",
        a: "Ja. Die Inhalte kläre ich mit Ihnen per WhatsApp, Telefon oder schriftlich. Für den Start reichen oft Handyfotos von Baustellen und fertigen Arbeiten. Was ich von Ihnen brauche, halte ich vorab fest.",
      },
      {
        q: "Wer nimmt Anrufe an, wenn ich auf der Baustelle bin?",
        a: (
          <>
            Auf Wunsch meine{" "}
            <Link href="/ki-telefonassistenz" className="text-pfAccent underline underline-offset-4">KI-Telefonassistenz</Link>. Sie nimmt Anrufe in Ihrem Namen an, erfasst Anliegen und Wunschtermin und benachrichtigt Sie sofort. Sie kostet 790 € Einrichtung plus 249 € im Monat mit 300 Gesprächsminuten und ist unabhängig von der Website buchbar.
          </>
        ),
        aText:
          "Auf Wunsch meine KI-Telefonassistenz. Sie nimmt Anrufe in Ihrem Namen an, erfasst Anliegen und Wunschtermin und benachrichtigt Sie sofort. Sie kostet 790 € Einrichtung plus 249 € im Monat mit 300 Gesprächsminuten und ist unabhängig von der Website buchbar.",
      },
      {
        q: "Haben Sie eine Referenz aus dem Handwerk?",
        a: "Öffentlich dokumentiert sind zwei Projekte: Carbon Care (Fahrzeugaufbereitung) mit Landingpage und eigener Rechnungssoftware und The Loft (Gastronomie in Wuppertal). Eine Referenz aus dem Bauhandwerk gibt es derzeit nicht. Ob Ihr Vorhaben passt, kläre ich im Erstgespräch.",
      },
    ],
  },
  references: regionalReferences,
  related: {
    label: "Passende Seiten",
    items: [
      { label: "KI-Telefonassistenz", href: "/ki-telefonassistenz" },
      { label: "Website erstellen lassen", href: "/website-erstellen-lassen" },
      { label: "Website-Kosten", href: "/website-kosten" },
      { label: "Individuelle Software", href: "/individuelle-software" },
      { label: "Webdesign Bergisches Land", href: "/webdesign-bergisches-land" },
    ],
  },
  cta: {
    heading: "Erzählen Sie mir von Ihrem Betrieb.",
    text: "Für eine erste Einschätzung reichen Gewerk, Einsatzgebiet und Ihre bisherige Website, falls es eine gibt. Ich antworte am selben Werktag mit passender Stufe und Preisrahmen.",
  },
};

export default function WebsiteFuerHandwerkerPage() {
  return (
    <>
      <JsonLd data={getServiceSchema({ name: TITLE, description: DESCRIPTION, url: `https://pagefoundry.de${PATH}` })} />
      <ServiceLanding data={data} seo={{ breadcrumb: [{ name: TITLE, path: PATH }] }} />
    </>
  );
}
