import type { ServiceLandingData } from "@/components/landing/ServiceLanding";
import { websiteStages, formatEuro, taxNoteDe } from "@/lib/websitePricing";

// Betrieb after a purchase: hosting, domain, SSL, backups, monitoring, report.
export const OPERATION_MONTHLY = 25;
const MONTHS = 24;

const columns = websiteStages.map((stage) => stage.name);
const cells = (fn: (stage: (typeof websiteStages)[number]) => string) => websiteStages.map(fn);

const scopeShort: Record<string, string> = {
  sichtbar: "1 Seite, bis 6 Abschnitte",
  gefunden: "bis 5 Seiten",
  gebucht: "bis 10 Seiten oder 5 Seiten + 1 Standardmodul",
};

const purchaseTotal = (stage: (typeof websiteStages)[number]) => formatEuro(stage.purchase + MONTHS * OPERATION_MONTHLY);
const managedTotal = (stage: (typeof websiteStages)[number]) => formatEuro(stage.setup + MONTHS * stage.monthly);
const laterRate = (stage: (typeof websiteStages)[number]) =>
  stage.id === "sichtbar" ? `${formatEuro(stage.later)}/Monat` : `${formatEuro(stage.later)}/Monat, ${stage.laterChanges}`;

export const costTable: NonNullable<ServiceLandingData["table"]> = {
  heading: "Was die drei Stufen über 24 Monate kosten.",
  caption: "Kosten der Website-Stufen Sichtbar, Gefunden und Gebucht bei Kauf und bei Betreuung",
  columns,
  rows: [
    { label: "Umfang", cells: cells((stage) => scopeShort[stage.id]) },
    { label: "Kauf, einmalig", cells: cells((stage) => formatEuro(stage.purchase)) },
    { label: `Kauf plus Betrieb (${formatEuro(OPERATION_MONTHLY)}/Monat), Summe über 24 Monate`, cells: cells(purchaseTotal) },
    { label: "Betreut: Einrichtung + Monatsbeitrag", cells: cells((stage) => `${formatEuro(stage.setup)} + ${formatEuro(stage.monthly)}/Monat`) },
    { label: "Betreut, Summe über 24 Monate", cells: cells(managedTotal) },
    { label: "Betreut: enthaltene Änderungen pro Monat", cells: cells((stage) => stage.changes) },
    { label: "Betreut ab Monat 25", cells: cells((stage) => `${formatEuro(stage.later)}/Monat`) },
  ],
  note: `Rechenbeispiele aus meinen veröffentlichten Preisen. Betrieb umfasst Hosting, Domain, SSL, Backups, Überwachung und Bericht; Änderungen rechne ich dort nach Aufwand ab, 19 € je angefangene 15 Minuten. Die betreute Variante gibt es nur für Unternehmen, mit 24 Monaten Mindestlaufzeit. ${taxNoteDe} Lizenzen für Fremddienste und Zahlungsgebühren tragen Sie selbst.`,
};

export const rentVsBuyTable: NonNullable<ServiceLandingData["table"]> = {
  heading: "Mieten oder kaufen: die Rechnung über 24 Monate.",
  caption: "Vergleich der betreuten Variante mit dem Kauf plus Betrieb über 24 Monate",
  columns,
  rows: [
    { label: "Betreut: Einrichtung", cells: cells((stage) => formatEuro(stage.setup)) },
    { label: "Betreut: Monatsbeitrag, Monat 1–24", cells: cells((stage) => formatEuro(stage.monthly)) },
    { label: "Betreut, Summe über 24 Monate", cells: cells(managedTotal) },
    { label: "Enthaltene Änderungen pro Monat", cells: cells((stage) => stage.changes) },
    { label: "Betreut ab Monat 25", cells: cells(laterRate) },
    { label: "Zum Vergleich: Kauf, einmalig", cells: cells((stage) => formatEuro(stage.purchase)) },
    { label: `Zum Vergleich: Kauf plus Betrieb (${formatEuro(OPERATION_MONTHLY)}/Monat), Summe über 24 Monate`, cells: cells(purchaseTotal) },
  ],
  note: `Bei Sichtbar liegen beide Wege über 24 Monate fast gleichauf. Bei Gefunden und Gebucht ist der Kauf mit Betrieb in Summe günstiger; die betreute Variante verteilt die Kosten und enthält jeden Monat ein Änderungskontingent. Wenn Sie das Budget für den Kauf haben und selten etwas ändern, ist Kaufen meist die bessere Wahl. Wenn Sie klein starten und Änderungen laufend abgeben möchten, passt die Betreuung. ${taxNoteDe}`,
};

export const stageOffers = websiteStages.map((stage) => ({
  "@type": "Offer",
  name: `${stage.name}: ${stage.de}`,
  price: stage.purchase,
  priceCurrency: "EUR",
}));
