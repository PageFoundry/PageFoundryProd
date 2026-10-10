# Website-Pakete in HQ

## Ablauf

1. Kunde mit echtem Rechnungsempfänger, vollständiger Anschrift und Rechnungs-E-Mail anlegen. Fehlt etwas, kann ein Entwurf erstellt werden; der Versand bleibt gesperrt.
2. „Website-Paket“ anlegen. Das System erzeugt eine Anzahlungsrechnung als Entwurf über 50 % des Einmalpreises. Bei ServiceWerk: 395,00 € von 790,00 €.
3. Nach Zahlungseingang die Anzahlungsrechnung als bezahlt markieren. Erst dann ist „Go-live abrechnen“ möglich.
4. Am tatsächlichen Go-live-Datum wird der Restbetrag als Schlussrechnung und die erste Monatsrechnung erzeugt. Der monatliche Service wird aktiv.
5. „Nächsten Monat abrechnen“ erstellt nach Beginn des jeweiligen Monats genau einen weiteren Entwurf. In den Monaten 1–24 gilt bei ServiceWerk 99,00 €, ab Monat 25 gelten 49,00 €. Der Service ist danach monatlich kündbar.
6. Bereits vor Go-live ist ein „Dauerauftrag vorbereiten“-PDF mit EPC-SEPA-QR-Code abrufbar. Es ist ausdrücklich keine Rechnung und nennt den Go-live als noch zu bestätigenden Start. Die Monatsrechnung hat den QR-Code ebenfalls auf Seite 2. Der Code füllt eine einzelne Überweisung vor. Der Kunde muss in seiner Banking-App selbst „monatlich wiederholen“ auswählen und den Betrag vor Monat 25 ändern. Es gibt keine automatische SEPA-Lastschrift.
7. SLA und AVV sind je Paket abrufbar. Hosting-Anbieter/-Region, Sicherungsintervall/-Vorhaltezeit und Unterauftragsverarbeiter müssen vor Unterschrift vollständig und wahrheitsgemäß eingetragen werden. Die PDFs tragen deshalb den Vermerk „Entwurf zur Prüfung“.

## Versandvoraussetzungen

Die Server-Umgebung benötigt `PAGEFOUNDRY_TAX_NUMBER` mit der vom Finanzamt erteilten Steuernummer oder einer zulässigen USt-ID/Kleinunternehmer-ID. Persönliche Steuer-IdNr. nicht verwenden. Der Rechnungsversand prüft diese Kennung und die Kundenanschrift. Die Kennung steht nur in der Laufzeitumgebung, nicht im Git-Repository. Solange sie fehlt, kennzeichnet die PDF-Vorschau eine Rechnung sichtbar als Entwurf.

Pagefoundry rechnet nach der vom Auftraggeber bestätigten Kleinunternehmerregelung gemäß § 19 UStG ab; die Paketpreise sind Endpreise ohne Umsatzsteuerausweis. Ändert sich der Steuerstatus, müssen Preise und Rechnungslogik vor weiteren Rechnungen angepasst werden.

## Grenzen und Prüfung

- Die monatliche Rechnungsstellung ist bewusst ein manueller HQ-Schritt. Es gibt keinen unbeaufsichtigten Versand und keinen automatischen Bankeinzug.
- Der im SLA vorgeschlagene Supportzeitraum und die Reaktionsziele müssen vor Unterzeichnung geschäftlich bestätigt werden. Das PDF verspricht keine pauschale Verfügbarkeit oder feste Behebungszeit.
- Die AVV deckt Websitebetrieb, Kontaktformular und technische Zugriffsdaten ab. Shop-, Auktions- und Zahlungsdaten brauchen vor Aktivierung eine Ergänzung.
- Der QR-Code ist ein EPC-Code für eine SEPA-Überweisung; er kann keinen Dauerauftrag selbst anlegen.
- Vor Kundenversand der SLA/AVV müssen Unterauftragsverarbeiter, TOMs und Hosting-Angaben zum tatsächlichen Betrieb passen. Eine juristische Schlussprüfung ist sinnvoll.

## Rechtsgrundlagen (Stand 10.10.2026)

- [§ 14 UStG](https://www.gesetze-im-internet.de/ustg_1980/__14.html): Rechnungsangaben, Anzahlungs- und Endrechnung.
- [§ 34a UStDV](https://www.gesetze-im-internet.de/ustdv_1980/__34a.html): Mindestangaben für Kleinunternehmerrechnungen.
- [BMF-FAQ zur E-Rechnung](https://www.bundesfinanzministerium.de/Content/DE/FAQ/e-rechnung.html): Kleinunternehmer sind von der Ausstellungspflicht ausgenommen, müssen E-Rechnungen empfangen können.
- [Art. 28 DSGVO](https://eur-lex.europa.eu/legal-content/DE/ALL/?uri=CELEX%3A32016R0679): Pflichtinhalte der Auftragsverarbeitung.
- [EPC QR-Leitlinie](https://www.europeanpaymentscouncil.eu/document-library/guidance-documents/quick-response-code-guidelines-enable-data-capture-initiation): Datenübernahme für SEPA-Überweisungen.
