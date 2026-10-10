import PDFDocument from "pdfkit";
import { Prisma } from "@prisma/client";
import QRCode from "qrcode";

export type PlanDocumentInput = Prisma.WebsitePlanGetPayload<{ include: { client: true } }>;

const date = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });
const money = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

function formatMoney(cents: number) { return money.format(cents / 100); }
function recipient(plan: PlanDocumentInput) {
  return [plan.client.billingName || plan.client.companyName || plan.client.name, plan.client.billingAddressLine1, plan.client.billingAddressLine2, `${plan.client.postalCode || "[PLZ]"} ${plan.client.city || "[Ort]"}`].filter(Boolean).join(", ");
}

function createDocument(plan: PlanDocumentInput, title: string, build: (doc: PDFKit.PDFDocument) => void): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 52, autoFirstPage: true, bufferPages: true, info: { Title: title, Author: "Pagefoundry" } });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.rect(0, 0, 595, 82).fill("#080808");
    doc.fillColor("#c9a84d").font("Helvetica-Bold").fontSize(19).text(title.toUpperCase(), 52, 32);
    doc.moveDown(2);
    doc.fillColor("#1b1b1b").font("Helvetica").fontSize(9).text(`Vereinbarung ${plan.id.slice(-10).toUpperCase()} · Stand ${date.format(new Date())} · ENTWURF ZUR PRÜFUNG`);
    doc.moveDown(0.8);
    build(doc);
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc.font("Helvetica").fontSize(8).fillColor("#777777").text(`Pagefoundry · ${title} · Seite ${i + 1} von ${pages.count}`, 52, 777, { width: 490, align: "right" });
    }
    doc.end();
  });
}

function section(doc: PDFKit.PDFDocument, title: string, body: string) {
  doc.moveDown(0.55).fillColor("#121212").font("Helvetica-Bold").fontSize(10.5).text(title);
  doc.moveDown(0.2).font("Helvetica").fontSize(9.2).fillColor("#252525").text(body, { lineGap: 1.5, paragraphGap: 3 });
}

function parties(doc: PDFKit.PDFDocument, plan: PlanDocumentInput) {
  doc.font("Helvetica-Bold").fontSize(10).text("Vertragspartner");
  doc.font("Helvetica").fontSize(9.5).text(`Auftragnehmer: Fabian Franke, Pagefoundry, Kastanienweg 20a, 42499 Hückeswagen, admin@pagefoundry.de`);
  doc.text(`Auftraggeber: ${recipient(plan)}`);
  doc.text(`Projekt: ${plan.title}`);
}

function signature(doc: PDFKit.PDFDocument) {
  doc.moveDown(1).font("Helvetica").fontSize(9).text("Ort, Datum: ___________________________", { continued: false });
  doc.moveDown(1).text("Auftraggeber: _________________________          Pagefoundry: _________________________");
}

export function generateSlaPdf(plan: PlanDocumentInput) {
  return createDocument(plan, "Service Level Agreement", (doc) => {
    parties(doc, plan);
    section(doc, "1. Beginn, Laufzeit und Vergütung", `Der monatliche Service beginnt mit dem dokumentierten Go-live (${plan.goLiveDate ? date.format(plan.goLiveDate) : "noch festzulegen"}). Für die ersten ${plan.initialMonths} Monate beträgt die Vergütung ${formatMoney(plan.initialMonthlyCents)} je Monat. Sie enthält neben den laufenden Leistungen einen Anteil der Entwicklungskosten. Ab Monat ${plan.initialMonths + 1} beträgt der laufende Service ${formatMoney(plan.laterMonthlyCents)} je Monat; danach ist er monatlich kündbar. Der Auftraggeber passt seinen Dauerauftrag zum Beginn der zweiten Preisphase selbst an. Die einmalige Website-Erstellung kostet ${formatMoney(plan.setupPriceCents)}; ${formatMoney(plan.depositCents)} sind nach Beauftragung, der Rest bei Fertigstellung und Go-live fällig. Der Auftraggeber stimmt dem Rechnungsversand als PDF an seine Rechnungs-E-Mail zu.`);
    section(doc, "2. Enthaltene Leistungen", "Hosting der vereinbarten Website, regelmäßige Sicherungen, sicherheitsrelevante Aktualisierungen der vom Auftragnehmer betreuten Komponenten sowie technische Betreuung. Einfache Textänderungen und der Austausch vom Auftraggeber bereitgestellter Bilder an vorhandenen Stellen sind eingeschlossen. Neue Seiten, neue Funktionen, Designänderungen, Bildbearbeitung, Shop-/Auktionsbetrieb und Inhalte Dritter werden gesondert vereinbart. Änderungen werden nur nach Freigabe oder Weisung des Auftraggebers veröffentlicht.");
    section(doc, "3. Erreichbarkeit und Reaktion", `Meldungen an ${plan.supportEmail} werden an Werktagen Montag bis Freitag von 09:00 bis 17:00 Uhr deutscher Zeit bearbeitet, ausgenommen gesetzliche Feiertage in Nordrhein-Westfalen. Reaktionsziel ab Eingang innerhalb dieser Zeiten: kritischer Totalausfall 4 Arbeitsstunden, wesentliche Funktionsstörung 1 Arbeitstag, einfache Text-/Bildänderung oder sonstige Anfrage 3 Arbeitstage. Reaktion bedeutet Eingangsbestätigung und Beginn der Prüfung; ein Zeitpunkt der vollständigen Behebung wird nicht zugesagt. Sicherheitsvorfälle werden nach Dringlichkeit priorisiert.`);
    section(doc, "4. Wartung, Sicherungen und Wiederherstellung", `Hosting-Anbieter: ${plan.hostingProvider || "[vor Unterzeichnung eintragen]"}; Hosting-Region: ${plan.hostingRegion || "[vor Unterzeichnung eintragen]"}. Sicherungsintervall: ${plan.backupInterval || "[vor Unterzeichnung eintragen]"}; Vorhaltezeit: ${plan.backupRetention || "[vor Unterzeichnung eintragen]"}. Wiederherstellungen erfolgen nach Prüfung des letzten brauchbaren Sicherungsstands. Der Auftragnehmer testet die Wiederherstellbarkeit in angemessenen Abständen und dokumentiert relevante Störungen. Eine bestimmte Verfügbarkeit oder Wiederherstellungszeit wird nur vereinbart, wenn sie hier ausdrücklich ergänzt wird.`);
    section(doc, "5. Mitwirkung und Änderungen", "Der Auftraggeber stellt Inhalte, Zugänge und Entscheidungen rechtzeitig bereit und ist für die Rechtmäßigkeit seiner Inhalte verantwortlich. Zugangsdaten werden über einen geeigneten sicheren Kanal übermittelt. Geplante Wartungen mit spürbarer Unterbrechung werden nach Möglichkeit vorab angekündigt. Erweiterungen und Mehraufwand werden vor Beginn mit Aufwand und Preis abgestimmt.");
    section(doc, "6. Datenschutz und Ende", "Für personenbezogene Daten, die Pagefoundry im Auftrag verarbeitet, gilt die gesonderte AVV. Nach Vertragsende werden Zugänge und Daten nach Weisung übergeben oder gelöscht, soweit gesetzliche Aufbewahrungspflichten nicht entgegenstehen. Die technischen Einzelheiten werden vor dem Go-live im Betriebsprotokoll festgehalten.");
    signature(doc);
  });
}

export function generateAvvPdf(plan: PlanDocumentInput) {
  return createDocument(plan, "Auftragsverarbeitungsvertrag", (doc) => {
    parties(doc, plan);
    section(doc, "1. Gegenstand, Dauer und Rollen", "Der Auftraggeber ist Verantwortlicher, Pagefoundry ist Auftragsverarbeiter gemäß Art. 28 DSGVO. Gegenstand ist Hosting, Sicherung, Sicherheitswartung und technische Betreuung der vereinbarten Website. Die Verarbeitung beginnt mit der technischen Bereitstellung und endet mit Rückgabe oder Löschung der Daten nach Vertragsende. Eine eigenständige Verarbeitung zu eigenen Zwecken ist ausgeschlossen.");
    section(doc, "2. Art, Zweck, Daten und betroffene Personen", "Verarbeitung: Speichern, Übertragen, Einsehen bei Supportfällen, Sichern, Wiederherstellen, Ändern auf dokumentierte Weisung und Löschen. Zwecke: Websitebetrieb, Kontaktanfragen, technische Sicherheit und Support. Daten: IP-Adressen und technische Zugriffsdaten, Namen und Kontaktdaten aus Formularen, vom Auftraggeber bereitgestellte Inhalte und Korrespondenz. Betroffene: Websitebesucher, Interessenten, Kunden und Ansprechpartner des Auftraggebers. Besondere Kategorien nach Art. 9 DSGVO sowie Shop-, Auktions- oder Zahlungsdaten sind nicht Gegenstand dieser AVV; dafür ist vor Verarbeitung eine Ergänzung erforderlich.");
    section(doc, "3. Weisungen und Vertraulichkeit", "Pagefoundry verarbeitet personenbezogene Daten nur auf dokumentierte Weisung des Auftraggebers, auch bei Drittlandübermittlungen, sofern kein zwingendes Recht etwas anderes verlangt. Mündliche Weisungen werden schriftlich bestätigt. Hält Pagefoundry eine Weisung für datenschutzwidrig, weist es den Auftraggeber unverzüglich darauf hin. Alle zugriffsberechtigten Personen werden auf Vertraulichkeit verpflichtet und auf das erforderliche Maß beschränkt.");
    section(doc, "4. Technische und organisatorische Maßnahmen", `Zugriffe: individuelle Konten, starke Authentisierung, rollenbasierte Berechtigungen, Entzug nach Aufgabenende. Übertragung: TLS; administrative Zugänge gesichert. Betrieb: Sicherheitsaktualisierungen, Protokollierung sicherheitsrelevanter Vorgänge, getrennte Berechtigungen, Schutz vor unbefugter Änderung. Sicherungen: ${plan.backupInterval || "[Intervall ergänzen]"} mit Vorhaltezeit ${plan.backupRetention || "[Vorhaltezeit ergänzen]"}; Wiederherstellung wird überprüft. Hosting: ${plan.hostingProvider || "[Anbieter ergänzen]"} in ${plan.hostingRegion || "[Region ergänzen]"}. Maßnahmen werden dem Risiko angepasst und dürfen nur durch gleichwertige oder bessere Maßnahmen ersetzt werden.`);
    section(doc, "5. Unterauftragsverarbeiter und Drittlandtransfer", `Allgemeine Genehmigung nur für folgende vor Vertragsschluss eingetragene Unterauftragsverarbeiter (Name, Leistung, Ort): ${plan.subprocessors || "[vollständige Liste vor Unterzeichnung eintragen]"}. Änderungen werden vorab mit angemessener Einspruchsmöglichkeit mitgeteilt. Pagefoundry verpflichtet Unterauftragsverarbeiter mindestens zu gleichwertigen Pflichten. Übermittlungen außerhalb des EWR erfolgen nur auf dokumentierte Weisung und mit gültiger Rechtsgrundlage und geeigneten Garantien.`);
    section(doc, "6. Unterstützung und Vorfälle", "Pagefoundry unterstützt den Auftraggeber im angemessenen Umfang bei Betroffenenrechten, Sicherheit der Verarbeitung, Meldungen von Datenschutzverletzungen, Datenschutz-Folgenabschätzungen und Anfragen der Aufsichtsbehörde. Datenschutzverletzungen werden nach Bekanntwerden unverzüglich mit den verfügbaren Informationen gemeldet; Ergänzungen folgen, sobald sie vorliegen. Der Auftraggeber bleibt für die Bewertung von Meldepflichten verantwortlich.");
    doc.addPage();
    doc.font("Helvetica-Bold").fontSize(12).fillColor("#121212").text("AVV · Fortsetzung");
    section(doc, "7. Nachweise, Prüfung und Vertragsende", "Pagefoundry stellt erforderliche Informationen zum Nachweis der Pflichten zur Verfügung und ermöglicht nach angemessener Vorankündigung Prüfungen durch den Auftraggeber oder einen zur Vertraulichkeit verpflichteten Prüfer. Nach Ende der Leistung gibt Pagefoundry personenbezogene Daten nach Wahl des Auftraggebers zurück oder löscht sie und löscht Kopien, soweit keine gesetzliche Aufbewahrungspflicht besteht. Der Auftraggeber dokumentiert seine Wahl; technische Sicherungskopien werden im regulären Löschzyklus entfernt und bis dahin geschützt.");
    section(doc, "8. Verantwortlichkeit des Auftraggebers", "Der Auftraggeber legt Zwecke und Rechtsgrundlagen fest, informiert Betroffene und beantwortet ihre Anfragen. Er dokumentiert Weisungen und meldet Änderungen an Datenarten oder Funktionen vor deren Einführung. Diese AVV gilt nur zusammen mit dem zugehörigen Servicevertrag und der vervollständigten Liste der Unterauftragsverarbeiter und Maßnahmen.");
    signature(doc);
  });
}

export async function generatePaymentInstructionsPdf(plan: PlanDocumentInput) {
  const reference = `PF-WEB-${plan.id.slice(-10).toUpperCase()}`;
  const iban = "DE26370502990000421313";
  const payload = ["BCD", "002", "1", "SCT", "", "Fabian Franke", iban, `EUR${(plan.initialMonthlyCents / 100).toFixed(2)}`, "", "", reference, ""].join("\n");
  const qr = await QRCode.toBuffer(payload, { type: "png", errorCorrectionLevel: "M", width: 420, margin: 2 });
  return createDocument(plan, "Dauerauftrag vorbereiten", (doc) => {
    parties(doc, plan);
    section(doc, "Bankverbindung und Betrag", `Empfänger: Fabian Franke · Pagefoundry\nIBAN: DE26 3705 0299 0000 4213 13\nVerwendungszweck: ${reference}\nBetrag für Monate 1–${plan.initialMonths}: ${formatMoney(plan.initialMonthlyCents)} monatlich.`);
    doc.moveDown(0.5).image(qr, { width: 180 });
    section(doc, "Dauerauftrag selbst einrichten", `Den QR-Code mit der Banking-App scannen und die Zahlung ausdrücklich als monatlichen Dauerauftrag speichern. Der Code allein löst nur eine einzelne SEPA-Überweisung aus. Erster Zahlungstermin ist der bestätigte Go-live (${plan.goLiveDate ? date.format(plan.goLiveDate) : "Datum noch zu bestätigen"}); ohne bestätigten Termin noch keinen Auftrag ausführen. Ab Monat ${plan.initialMonths + 1} beträgt der Monatsbetrag ${formatMoney(plan.laterMonthlyCents)}. Den bestehenden Dauerauftrag zu diesem Zeitpunkt rechtzeitig ändern. Die eigentliche Monatsrechnung wird ab Go-live ausgestellt. Dieses Informationsblatt ist keine Rechnung.`);
  });
}
