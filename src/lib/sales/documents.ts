// Vertragsvorlagen fuer den Vertrieb. Die PDFs liegen ausserhalb des Repos
// (SALES_DOCS_DIR, Standard /home/ubuntu/pagefoundry-documents/vorlagen) und werden nur
// an SALES/ADMIN ausgeliefert. Quellen (Markdown) + Render-Skript liegen daneben.

export type SalesDocument = { file: string; title: string; offer: string; when: string };

export const SALES_DOCUMENTS: SalesDocument[] = [
  { file: "01_Website-Erstellungsvertrag.pdf", title: "Website-Erstellungsvertrag", offer: "Alle Website-Pakete (Kauf und Betreut)", when: "Immer, wenn eine Website gebaut wird. Regelt Umfang, Abnahme, Zahlung (50 % Anzahlung, Rest nach Abnahme) und Nutzungsrechte." },
  { file: "02_Betreuungsvertrag-Betreut.pdf", title: "Hosting- und Betreuungsvertrag „Betreut“", offer: "Sichtbar / Gefunden / Gebucht – Modell Betreut", when: "Zusätzlich beim Modell Betreut: 24 Monate Mindestlaufzeit, Monatsrate inkl. Hosting, Domain und Änderungskontingent, danach monatlich kündbar." },
  { file: "03_Betriebsvertrag-Kauf.pdf", title: "Betriebsvertrag zum Kauf-Modell", offer: "Kauf + optionaler Betrieb (25 €/Monat)", when: "Wenn ein Kauf-Kunde Hosting und Wartung bei uns möchte. Monatlich mit einem Monat Frist kündbar." },
  { file: "04_SLA.pdf", title: "Service Level Agreement", offer: "Betreut, Kauf + Betrieb, Website-Wache Care", when: "Anlage zu jedem laufenden Vertrag: wie Meldungen bearbeitet werden, Änderungsfristen, was nicht garantiert ist." },
  { file: "05_Leistungsbeschreibung-Pakete.pdf", title: "Leistungsbeschreibung der Pakete (Anlage 1)", offer: "Sichtbar / Gefunden / Gebucht", when: "Anlage zum Erstellungsvertrag. Zeigt dem Kunden genau, was im gewählten Paket enthalten ist und was nicht." },
  { file: "06_Website-Wache.pdf", title: "Servicevertrag Website-Wache", offer: "Website-Wache (49 €) / Care (99 €)", when: "Für Kunden, die ihre Website woanders hosten und Überwachung bzw. Pflege möchten. Monatlich kündbar." },
  { file: "07_KI-Telefonassistenz.pdf", title: "Vertrag KI-Telefonassistenz", offer: "KI-Telefonassistenz (790 € + 249 €/Monat)", when: "Für den KI-Telefonassistenten. Braucht zusätzlich eine AVV, weil Anrufer-Daten verarbeitet werden." },
  { file: "08_AVV-Muster.pdf", title: "Auftragsverarbeitungsvertrag (Muster)", offer: "Alle laufenden Leistungen mit Kundendaten", when: "Arbeitsfassung. Wird von Fabian pro Kunde vervollständigt, bevor echte Daten verarbeitet werden." },
];

export function findSalesDocument(file: string): SalesDocument | null {
  return SALES_DOCUMENTS.find((d) => d.file === file) ?? null;
}

export function salesDocsDir(): string {
  return process.env.SALES_DOCS_DIR || "/home/ubuntu/pagefoundry-documents/vorlagen";
}
