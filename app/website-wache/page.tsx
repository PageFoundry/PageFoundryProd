import Link from "next/link";
import ServiceLanding, { type ServiceLandingData } from "@/components/landing/ServiceLanding";
import JsonLd, { getServiceSchema } from "@/components/JsonLd";
import { createPageMetadata } from "@/lib/seo/metadata";

const TITLE = "Website-Wache – Website-Überwachung & Wartung";
const DESCRIPTION =
  "Website-Monitoring mit Monatsbericht für 49 € im Monat. Website-Wache Care für 99 € im Monat umfasst zusätzlich bis zu 60 Minuten für kleine technische Korrekturen.";
const URL = "https://pagefoundry.de/website-wache";

const TAX_NOTE =
  "Alle Preise sind Endpreise, monatlich kündbar. PageFoundry ist Kleinunternehmer nach § 19 UStG — es wird keine Umsatzsteuer ausgewiesen.";

export const metadata = createPageMetadata({
  path: "/website-wache",
  title: TITLE,
  description: DESCRIPTION,
  locale: "de_DE",
});

const data: ServiceLandingData = {
  eyebrow: "Website-Wache",
  heroHeading: "Website-Wartung und Monitoring für Ihren Betrieb",
  heroSubline:
    "Für 49 € im Monat überwache ich Erreichbarkeit, SSL und Ladezeit Ihrer Website. Bei Auffälligkeiten melde ich mich. Sie erhalten jeden Monat einen Bericht. Im Care-Paket für 99 € monatlich sind zusätzlich bis zu 60 Minuten für kleine technische Korrekturen enthalten.",
  problem: {
    label: "Das Problem",
    heading: "Die meisten Website-Probleme fallen zuerst dem Kunden auf.",
    points: [
      "Ein abgelaufenes SSL-Zertifikat macht die Seite mit einer dicken Warnung unbenutzbar — oft tagelang unbemerkt.",
      "Ausfälle beim Hoster bekommen Sie meist erst mit, wenn jemand anruft.",
      "Langsame Ladezeiten kosten Besucher und Google-Ranking, ganz ohne sichtbaren Fehler.",
    ],
  },
  steps: {
    label: "So funktioniert's",
    heading: "Überwachung, die mitdenkt.",
    items: [
      {
        title: "Einrichten",
        text: "Ich nehme Ihre Website in die Überwachung auf — Erreichbarkeit, SSL und Antwortzeit, von außen, ganz ohne Eingriff in Ihre Seite.",
      },
      {
        title: "Überwachen & melden",
        text: "Rund um die Uhr prüfe ich Ihre Seite. Fällt etwas auf — Ausfall, ablaufendes Zertifikat, hohe Latenz — schlage ich früh Alarm.",
      },
      {
        title: "Berichten & pflegen",
        text: "Sie bekommen einen monatlichen Kurzbericht und je nach Paket Zeit für kleine Korrekturen und Updates.",
      },
    ],
  },
  included: {
    label: "Leistungsumfang",
    heading: "Was ich im Blick behalte.",
    items: [
      "Erreichbarkeit (Uptime) rund um die Uhr",
      "SSL-Zertifikat und rechtzeitige Ablauf-Warnung",
      "Antwort- und Ladezeit",
      "Monatlicher Kurzbericht in Klartext",
      "Kleine inhaltliche und technische Korrekturen (je nach Paket)",
      "Fester Ansprechpartner statt Hotline",
    ],
    note: "Ehrlich gesagt: Die Überwachung läuft von außen über HTTP, TLS und Antwortzeit. Das deckt die häufigsten Ausfälle früh ab — ist aber kein automatisches Reparieren jeder denkbaren Störung. Was ich behebe, halte ich im Bericht fest.",
  },
  table: {
    heading: "Ein Monatsbericht als Beispiel",
    caption: "Musterbericht der Website-Wache mit frei gewählten Beispieldaten für Oktober 2026",
    columns: ["Oktober 2026 · Beispieldaten"],
    rows: [
      { label: "Erreichbarkeit", cells: ["99,98 %. Am 12. Oktober war die Website von 08:42 bis 08:51 Uhr nicht erreichbar."] },
      { label: "Meldung", cells: ["Der Betreiber bekam eine Ausfallmeldung und nach neun Minuten die Nachricht, dass die Website wieder erreichbar war."] },
      { label: "SSL-Zertifikat", cells: ["Am Monatsende noch 54 Tage gültig. Im Berichtsmonat stand keine Verlängerung an."] },
      { label: "Antwortzeit", cells: ["Im Median antwortete der Server nach 320 Millisekunden."] },
    ],
  },
  pricing: {
    label: "Preise",
    heading: "Zwei Leistungen für extern gehostete Websites.",
    tiers: [
      {
        name: "Website-Wache",
        price: "49 €",
        priceNote: "pro Monat",
        features: [
          "Uptime-, SSL- & Ladezeit-Überwachung",
          "Frühwarnung bei Problemen",
          "Monatlicher Kurzbericht",
        ],
      },
      {
        name: "Website-Wache Care",
        price: "99 €",
        priceNote: "pro Monat",
        highlight: true,
        features: [
          "Alles aus Website-Wache",
          "Bis zu 60 Min. Kleinfixes pro Monat",
          "Updates nach Absprache",
          "Bevorzugte Bearbeitung",
        ],
      },
    ],
    footnote: `${TAX_NOTE} Wenn ich Ihre Website hosten soll: Betrieb für 25 €/Monat mit Hosting, Domain, SSL, Backups, Überwachung und Bericht. Änderungen nach Aufwand (19 € je angefangene 15 Minuten); jederzeit mit einem Monat Frist kündbar.`,
  },
  faq: {
    label: "FAQ",
    heading: "Häufige Fragen.",
    items: [
      {
        q: "Muss ich meinen Hoster wechseln?",
        a: "Nein. Die Website-Wache läuft unabhängig von Ihrem Hoster und überwacht Ihre Seite von außen.",
      },
      {
        q: "Was ist der Unterschied zwischen Website-Überwachung und Website-Wartung?",
        a: "Die Überwachung prüft, ob Ihre Website erreichbar ist, das SSL-Zertifikat gültig bleibt und die Antwortzeiten auffällig werden. Wartung umfasst konkrete Arbeiten an der Website. Die Website-Wache enthält die Überwachung und einen monatlichen Kurzbericht. Website-Wache Care ergänzt bis zu 60 Minuten Kleinfixes pro Monat und Updates nach Absprache. So können Sie den Umfang passend zu Ihrer Website wählen.",
      },
      {
        q: "Wird ein erkannter Fehler automatisch repariert?",
        a: (
          <>
            Die Website-Wache erkennt Auffälligkeiten und meldet Probleme früh. Sie repariert nicht automatisch jede Störung. Kleine Korrekturen sind je nach Paket enthalten; größere Arbeiten stimme ich vorab mit Ihnen ab. Wenn Ihre Website grundsätzlich überarbeitet werden muss, finden Sie unter <Link href="/website-rettung" className="text-pfAccent underline underline-offset-4">Website-Rettung</Link> das passende Angebot.
          </>
        ),
      },
      {
        q: "Was kostet es, wenn mal mehr zu tun ist?",
        a: "Kleinere Arbeiten sind je nach Paket inklusive. Größere Aufgaben stimme ich vorher transparent ab — keine Überraschungen auf der Rechnung.",
      },
      {
        q: "Bekomme ich mit, was passiert?",
        a: "Ja. Jeden Monat gibt es einen verständlichen Kurzbericht: Verfügbarkeit, Auffälligkeiten und was ich erledigt habe.",
      },
      {
        q: "Kann ich monatlich kündigen?",
        a: "Ja, die Pakete sind monatlich kündbar.",
      },
    ],
  },
  cta: {
    heading: "Soll ich Ihre Seite in die Wache nehmen?",
    text: "Ich schaue mir Ihre Website kurz an und sage Ihnen ehrlich, welches Paket sinnvoll ist — kostenlos und unverbindlich.",
  },
  related: {
    label: "Passende Seiten",
    items: [
      { label: "SEO Hückeswagen", href: "/seo-hueckeswagen" },
      { label: "Webdesign Bergisches Land", href: "/webdesign-bergisches-land" },
      { label: "Website-Rettung", href: "/website-rettung" },
      { label: "Website mieten", href: "/website-mieten" },
    ],
  },
};

export default function WebsiteWachePage() {
  return (
    <>
      <JsonLd data={getServiceSchema({ name: TITLE, description: DESCRIPTION, url: URL })} />
      <ServiceLanding data={data} seo={{ breadcrumb: [{ name: "Website-Wache", path: "/website-wache" }] }} />
    </>
  );
}
