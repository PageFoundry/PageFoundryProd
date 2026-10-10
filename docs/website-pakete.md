# Website-Pakete in HQ

## Ablauf

1. Kunde mit echtem Rechnungsempfänger, vollständiger Anschrift und Rechnungs-E-Mail anlegen. Fehlt etwas, kann ein Entwurf erstellt werden; der Versand bleibt gesperrt.
2. „Website-Paket“ anlegen. Das System erzeugt eine Anzahlungsrechnung als **nicht versendbaren Entwurf** über 50 % des Einmalpreises. Ohne tatsächliches Vertragsschlussdatum bleibt die Fälligkeit offen. Bei Servicewerk sind es 395,00 € von 790,00 €.
3. Nach tatsächlichem Abschluss das Datum erfassen. Die Fälligkeit der Anzahlung ist exakt sieben Kalendertage danach. Nach Zahlungseingang die Rechnung als bezahlt markieren.
4. Die dokumentierte Abnahme erzeugt die separate Schlussrechnung über die restlichen 395,00 €. Der tatsächliche Go-live aktiviert den monatlichen Service und erzeugt Monatsrechnung 1 über 99,00 €. Eine ausdrücklich vorläufig freigegebene Produktivschaltung kann der Abnahme vorausgehen; die Schlussrechnung bleibt dann bis zur Abnahme aus.
5. „Nächsten Monat abrechnen“ erstellt nach Beginn des jeweiligen Vertragsmonats genau einen weiteren Entwurf. Bei Servicewerk gelten 99,00 € für die ersten 24 Monate und die am 10.10.2026 von Fabian bestätigten 49,00 € ab Monat 25. Der Folgepreis ist im Servicewerk-Paket freigegeben.
6. Der alte HQ-Generator für SLA, AVV und Dauerauftragsblatt ist für Servicewerk gesperrt. Seine PDFs enthalten überholte Annahmen. Das aktuelle Kundenpaket liegt unter `/home/ubuntu/pagefoundry-documents/servicewerk/versandpaket-2026-10-10/`; die separate AVV bleibt unter `/home/ubuntu/pagefoundry-documents/servicewerk/vertragsentwuerfe-2026-10-10/` als Arbeitsfassung, bis IONOS-, Mail-, Shop- und Backuptechnik eingerichtet und dokumentiert sind. Eine Monatsrechnung mit EPC-SEPA-QR-Code entsteht erst nach Go-live; der Code füllt nur eine einzelne Überweisung vor und legt selbst keinen Dauerauftrag an.

## Versandvoraussetzungen

Die Server-Umgebung benötigt `PAGEFOUNDRY_TAX_NUMBER` mit der vom Finanzamt erteilten Steuernummer oder einer zulässigen USt-ID/Kleinunternehmer-ID. Persönliche Steuer-IdNr. nicht verwenden. Der Rechnungsversand prüft diese Kennung und die Kundenanschrift. Die Kennung steht nur in der Laufzeitumgebung, nicht im Git-Repository. Solange sie fehlt, kennzeichnet die PDF-Vorschau eine Rechnung sichtbar als Entwurf.

Pagefoundry rechnet nach der vom Auftraggeber bestätigten Kleinunternehmerregelung gemäß § 19 UStG ab; die Paketpreise sind Endpreise ohne Umsatzsteuerausweis. Ändert sich der Steuerstatus, müssen Preise und Rechnungslogik vor weiteren Rechnungen angepasst werden.

## Grenzen und Prüfung

- Die monatliche Rechnungsstellung ist bewusst ein manueller HQ-Schritt. Es gibt keinen unbeaufsichtigten Versand und keinen automatischen Bankeinzug.
- Das alte HQ-SLA und die alte HQ-AVV dürfen für Servicewerk nicht verwendet werden. Das SLA im Kundenpaket enthält 72 Kalenderstunden als Umsetzungsfrist für kleine Text-/Bildänderungen und die am 10.10.2026 von Fabian bestätigte Fair-Use-Grenze von fünf Änderungen/60 Minuten pro Vertragsmonat. Reaktionszeiten und Verfügbarkeit sind nicht garantiert.
- Der AVV-Entwurf berücksichtigt mögliche Shopdaten; Rollen, tatsächlich eingesetzte Dienste, Unterauftragsverarbeiter und TOMs müssen vor Unterschrift vervollständigt werden. Die Shop-Leistungsbeschreibung ist eine gesondert zu unterschreibende Anlage zum Werkvertrag. Die Demo enthält keinen funktionierenden Checkout.
- Der QR-Code ist ein EPC-Code für eine SEPA-Überweisung; er kann keinen Dauerauftrag selbst anlegen.
- Die AVV wird erst nach Einrichtung der Technik und vor Verarbeitung echter Daten unterschrieben. Eine juristische Schlussprüfung der Vertragsfassungen ist sinnvoll.

## Rechtsgrundlagen (Stand 10.10.2026)

- [§ 14 UStG](https://www.gesetze-im-internet.de/ustg_1980/__14.html): Rechnungsangaben, Anzahlungs- und Endrechnung.
- [§ 34a UStDV](https://www.gesetze-im-internet.de/ustdv_1980/__34a.html): Mindestangaben für Kleinunternehmerrechnungen.
- [BMF-FAQ zur E-Rechnung](https://www.bundesfinanzministerium.de/Content/DE/FAQ/e-rechnung.html): Kleinunternehmer sind von der Ausstellungspflicht ausgenommen, müssen E-Rechnungen empfangen können.
- [Art. 28 DSGVO](https://eur-lex.europa.eu/legal-content/DE/ALL/?uri=CELEX%3A32016R0679): Pflichtinhalte der Auftragsverarbeitung.
- [EPC QR-Leitlinie](https://www.europeanpaymentscouncil.eu/document-library/guidance-documents/quick-response-code-guidelines-enable-data-capture-initiation): Datenübernahme für SEPA-Überweisungen.
