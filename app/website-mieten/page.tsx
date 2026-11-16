import ServiceLanding, { type ServiceLandingData } from "@/components/landing/ServiceLanding";
import JsonLd, { getServiceSchema } from "@/components/JsonLd";
import { createPageMetadata } from "@/lib/seo/metadata";
import { rentVsBuyTable } from "@/lib/seo/costTables";

const TITLE = "Website mieten";
const META_TITLE = "Website mieten: 190 € + 49 €/Monat, später Ihr Eigentum";
const DESCRIPTION =
  "Website mieten statt kaufen: Domain ab Tag 1 auf Ihren Namen, nach 24 Monaten gehört die Website Ihnen. Für Unternehmen ab 190 € Einrichtung + 49 €/Monat.";
const PATH = "/website-mieten";

export const metadata = createPageMetadata({ path: PATH, title: META_TITLE, description: DESCRIPTION, locale: "de_DE" });

const data: ServiceLandingData = {
  eyebrow: "Betreute Website · nur für Unternehmen",
  heroHeading: "Website mieten. Nach 24 Monaten gehört sie Ihnen.",
  heroSubline:
    "Wer eine Website mieten möchte, will klein starten und die Technik abgeben. Dafür gibt es bei mir die betreute Variante: eine kleine Einrichtung, ein fester Monatsbeitrag über 24 Monate, Hosting und Änderungen inklusive. Anders als bei einer reinen Miete läuft die Domain ab dem ersten Tag auf Ihren Namen, und nach 24 Monaten gehört die Website Ihnen.",
  problem: {
    label: "Prüfpunkte",
    heading: "Drei Fragen, die Sie vor jedem Mietvertrag stellen sollten.",
    points: [
      "Wem gehört die Domain? Läuft sie auf den Anbieter, hängt Ihre Adresse bei einem Wechsel an ihm. Bei mir ist sie ab Tag 1 auf Ihren Namen registriert.",
      "Was passiert nach der Laufzeit? Bei einer reinen Miete zahlen Sie weiter oder stehen ohne Website da. Bei mir gehört sie Ihnen nach 24 Monaten, mit Übergabepaket.",
      "Wie kommen Sie vorher heraus? Eine Ablöse ist bei mir jederzeit möglich. Ab Monat 25 kündigen Sie mit einem Monat Frist.",
    ],
  },
  steps: {
    label: "Ablauf",
    heading: "So läuft die betreute Variante.",
    items: [
      {
        title: "Einrichtung",
        text: "Ich plane und baue Ihre Website wie beim Kauf: Seitenplan, Vorschau-Link, eine Korrekturrunde, Abnahme mit Prüfliste. Dafür fällt die einmalige Einrichtung an.",
      },
      {
        title: "24 Monate Betreuung",
        text: "Im Monatsbeitrag sind Hosting, Domain, SSL, Backups, Überwachung, ein Monatsbericht und ein Änderungskontingent enthalten. Kleine Text- und Bildänderungen setze ich binnen 72 Stunden um, sobald die Angaben vollständig und freigegeben vorliegen.",
      },
      {
        title: "Danach Ihre Website",
        text: "Nach 24 Monaten gehört die Website Ihnen. Sie lassen sie zum reduzierten Monatsbeitrag bei mir weiterlaufen oder nehmen sie mit dem Übergabepaket mit.",
      },
    ],
  },
  included: {
    label: "Enthalten",
    heading: "Im Monatsbeitrag enthalten.",
    items: [
      "Hosting, Domain und SSL-Zertifikat",
      "Backups und Überwachung",
      "Monatsbericht",
      "Änderungskontingent je Stufe: 20, 45 oder 60 Minuten pro Monat",
      "Domain ab Tag 1 auf Ihren Namen",
      "Übergabepaket nach 24 Monaten oder Ablöse",
    ],
    note: "Ehrliche Grenzen: Die betreute Variante gibt es nur für Unternehmen und mit 24 Monaten Mindestlaufzeit. Eine Reaktionszeit garantiere ich nicht. Arbeiten über das Kontingent hinaus berechne ich mit 19 € je angefangene 15 Minuten, vorher abgestimmt. Lizenzen für Fremddienste und Zahlungsgebühren tragen Sie selbst. Die Details zur Ablöse stehen im schriftlichen Angebot.",
  },
  table: rentVsBuyTable,
  faq: {
    label: "FAQ",
    heading: "Website mieten: häufige Fragen.",
    items: [
      {
        q: "Was kostet es, eine Website zu mieten?",
        a: "Die betreute Variante kostet 190 € Einrichtung plus 49 € im Monat (Sichtbar), 390 € plus 79 € im Monat (Gefunden) oder 790 € plus 119 € im Monat (Gebucht), jeweils über 24 Monate. Danach sinkt der Monatsbeitrag auf 25, 39 oder 59 €.",
      },
      {
        q: "Gehört mir die gemietete Website?",
        a: "Die Domain gehört von Anfang an Ihnen. Die Website geht nach 24 Monaten oder nach einer Ablöse in Ihr Eigentum über, inklusive Übergabepaket.",
      },
      {
        q: "Kann ich vorzeitig aussteigen?",
        a: "Die Mindestlaufzeit beträgt 24 Monate. Eine Ablöse ist jederzeit möglich; danach gehört die Website Ihnen. Ab Monat 25 kündigen Sie mit einem Monat Frist.",
      },
      {
        q: "Was ist, wenn ich mehr Änderungen brauche?",
        a: "Im Kontingent sind je nach Stufe 2, 4 oder 6 Änderungen pro Monat mit zusammen 20, 45 oder 60 Minuten enthalten. Was darüber hinausgeht, stimme ich vorher mit Ihnen ab und berechne 19 € je angefangene 15 Minuten.",
      },
      {
        q: "Gibt es die Miete auch für Privatpersonen?",
        a: "Nein, die betreute Variante biete ich nur Unternehmen an. Für alle anderen gibt es den Kauf, auf Wunsch mit Betrieb für 25 € im Monat.",
      },
    ],
  },
  related: {
    label: "Passende Seiten",
    items: [
      { label: "Website-Kosten", href: "/website-kosten" },
      { label: "Website erstellen lassen", href: "/website-erstellen-lassen" },
      { label: "Website-Wache", href: "/website-wache" },
      { label: "Bestehende Website überarbeiten", href: "/website-rettung" },
    ],
  },
  cta: {
    heading: "Klein starten, später besitzen?",
    text: "In der kostenlosen Erstberatung rechne ich beide Wege für Ihr Vorhaben durch, Kauf und Betreuung. Sie entscheiden danach.",
  },
};

export default function WebsiteMietenPage() {
  return (
    <>
      <JsonLd data={getServiceSchema({ name: "Website mieten (betreute Website)", description: DESCRIPTION, url: `https://pagefoundry.de${PATH}` })} />
      <ServiceLanding data={data} seo={{ breadcrumb: [{ name: TITLE, path: PATH }] }} />
    </>
  );
}
