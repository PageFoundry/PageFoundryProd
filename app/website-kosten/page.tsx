import Link from "next/link";
import ServiceLanding, { type ServiceLandingData } from "@/components/landing/ServiceLanding";
import JsonLd, { getServiceSchema } from "@/components/JsonLd";
import { createPageMetadata } from "@/lib/seo/metadata";
import { costTable, stageOffers } from "@/lib/seo/costTables";

const TITLE = "Website-Kosten";
const META_TITLE = "Website-Kosten: feste Preise und laufende Kosten";
const DESCRIPTION =
  "Was kostet eine Website? Meine Preise offen aufgeschlüsselt: 790 €, 1.390 € oder 2.490 € einmalig, Betrieb 25 €/Monat. Mit Rechenbeispielen für 24 Monate.";
const PATH = "/website-kosten";

export const metadata = createPageMetadata({ path: PATH, title: META_TITLE, description: DESCRIPTION, locale: "de_DE" });

const data: ServiceLandingData = {
  eyebrow: "Preise offen gerechnet",
  heroHeading: "Was kostet eine Website? Eine Rechnung statt einer Preisspanne.",
  heroSubline:
    "Auf die Frage nach den Kosten einer Website nennen die meisten Ratgeber Spannen von wenigen hundert bis zu mehreren zehntausend Euro. Für eine Entscheidung hilft das wenig. Hier steht, woraus sich der Preis zusammensetzt, was im laufenden Betrieb anfällt und was meine drei Stufen über 24 Monate tatsächlich kosten.",
  problem: {
    label: "Preistreiber",
    heading: "Drei Dinge bestimmen den Preis.",
    points: [
      "Umfang. Eine einzelne Seite mit sechs Abschnitten ist schneller geplant und gebaut als fünf oder zehn Unterseiten. Jede weitere Seite braucht Inhalt, Gestaltung und Prüfung.",
      "Funktionen. Ein Kontaktformular ist Standard. Terminbuchung, Anfrage-Workflow oder ein kleiner Shop brauchen zusätzliche Einrichtung und Tests, dazu meist eine Lizenz für den Fremddienst.",
      "Betrieb. Domain, Hosting, SSL-Zertifikat, Backups und Überwachung fallen laufend an, egal wer die Website gebaut hat. Offen ist nur, wer sich darum kümmert.",
    ],
  },
  steps: {
    label: "Ablauf",
    heading: "So kommen Sie zu einem verbindlichen Preis.",
    items: [
      {
        title: "Stufe einordnen",
        text: "Anhand von Seitenzahl und Funktionen ordne ich Ihr Vorhaben einer der drei Stufen zu. Passt es in keine Stufe, sage ich das im Erstgespräch.",
      },
      {
        title: "Kauf oder Betreuung wählen",
        text: "Sie zahlen einmal, und die Website gehört Ihnen. Oder Sie starten als Unternehmen mit einer kleineren Einrichtung und einem festen Monatsbeitrag über 24 Monate.",
      },
      {
        title: "Angebot schriftlich",
        text: "Umfang, Preis und Zeitplan stehen im schriftlichen Angebot. Mehrarbeit stimme ich vorher mit Ihnen ab.",
      },
    ],
  },
  included: {
    label: "Enthalten",
    heading: "Was in den Preisen enthalten ist.",
    items: [
      "Planung der Seitenstruktur und Gestaltung",
      "Mobile Umsetzung",
      "Kontakt, WhatsApp, Anruf und Karte",
      "Impressum und Datenschutz eingebunden",
      "Basis-SEO; ab Gefunden lokale SEO-Grundlage und Google-Unternehmensprofil",
      "Eine Korrekturrunde und Abnahme mit Prüfliste",
    ],
    note: "Nicht enthalten sind Lizenzen für Fremddienste wie ein Buchungstool, Zahlungsgebühren eines Shops und Arbeiten außerhalb des vereinbarten Umfangs. Texte, Bilder, Seitenumfang und spätere Betreuung werden im Angebot festgelegt.",
  },
  table: costTable,
  faq: {
    label: "FAQ",
    heading: "Website-Kosten: häufige Fragen.",
    items: [
      {
        q: "Was kostet eine Website für ein kleines Unternehmen?",
        a: "Bei PageFoundry kostet eine Website einmalig 790 € (eine Seite), 1.390 € (bis zu fünf Seiten) oder 2.490 € (bis zu zehn Seiten oder fünf Seiten mit Buchungs-, Anfrage- oder Shopmodul). Für den Betrieb mit Hosting, Domain, SSL, Backups und Überwachung kommen auf Wunsch 25 € im Monat dazu.",
      },
      {
        q: "Welche laufenden Kosten hat eine Website?",
        a: "Laufend fallen Domain, Hosting, SSL-Zertifikat, Backups und Überwachung an. Bei mir ist das im Betrieb für 25 € im Monat gebündelt; in der betreuten Variante steckt es im Monatsbeitrag. Dazu kommen gegebenenfalls Lizenzen für Fremddienste wie ein Buchungstool.",
      },
      {
        q: "Was kostet ein Webdesigner pro Stunde?",
        a: "Website-Projekte rechne ich nicht nach Stunden ab, sondern zum festen Preis je Stufe. Nur Arbeiten außerhalb des vereinbarten Umfangs berechne ich nach Zeit: 19 € je angefangene 15 Minuten, vorher abgestimmt.",
      },
      {
        q: "Warum sind feste Preise möglich?",
        a: "Weil der Umfang jeder Stufe fest beschrieben ist: Seitenzahl, Funktionen, eine Korrekturrunde. Was darüber hinausgeht, bespreche ich vorher mit Ihnen und rechne es nicht nachträglich ab.",
      },
      {
        q: "Ist Mieten günstiger als Kaufen?",
        a: (
          <>
            Über 24 Monate liegen beide Wege bei der kleinsten Stufe fast gleichauf: Sichtbar kostet betreut 1.366 €, gekauft mit Betrieb 1.390 €. Bei Gefunden und Gebucht ist der Kauf mit Betrieb in Summe günstiger; die betreute Variante verteilt die Kosten und enthält jeden Monat ein Änderungskontingent. Mehr dazu auf der Seite{" "}
            <Link href="/website-mieten" className="text-pfAccent underline underline-offset-4">Website mieten</Link>.
          </>
        ),
        aText:
          "Über 24 Monate liegen beide Wege bei der kleinsten Stufe fast gleichauf: Sichtbar kostet betreut 1.366 €, gekauft mit Betrieb 1.390 €. Bei Gefunden und Gebucht ist der Kauf mit Betrieb in Summe günstiger; die betreute Variante verteilt die Kosten und enthält jeden Monat ein Änderungskontingent. Mehr dazu auf der Seite Website mieten.",
      },
      {
        q: "Kommt auf die Preise noch Umsatzsteuer?",
        a: "Nein. Alle Preise sind Endpreise. Als Kleinunternehmer nach § 19 UStG weise ich keine Umsatzsteuer aus.",
      },
    ],
  },
  related: {
    label: "Passende Seiten",
    items: [
      { label: "Website erstellen lassen", href: "/website-erstellen-lassen" },
      { label: "Website mieten", href: "/website-mieten" },
      { label: "Bestehende Website überarbeiten", href: "/website-rettung" },
      { label: "Website-Wache", href: "/website-wache" },
      { label: "Webdesign Bergisches Land", href: "/webdesign-bergisches-land" },
    ],
  },
  cta: {
    heading: "Welche Stufe passt zu Ihrem Betrieb?",
    text: "Schildern Sie mir kurz Ihr Vorhaben. Ich antworte am selben Werktag mit passender Stufe und Preisrahmen.",
  },
  auditHint: true,
};

export default function WebsiteKostenPage() {
  return (
    <>
      <JsonLd data={{ ...getServiceSchema({ name: "Website-Stufen und Kosten", description: DESCRIPTION, url: `https://pagefoundry.de${PATH}` }), offers: stageOffers }} />
      <ServiceLanding data={data} seo={{ breadcrumb: [{ name: TITLE, path: PATH }] }} />
    </>
  );
}
