# PageFoundry – technischer 10/10-Abschluss

Stand: 14. Juli 2026

Branch: `worktree-pagefoundry-10of10`

Arbeitsbereich: isolierter Git-Worktree auf dem VPS

## Umgesetzt

- Kontrast, Tastaturfokus und `prefers-reduced-motion` verbessert.
- Hero-Animation verkürzt und für Screenreader stabilisiert.
- Login-, OAuth- und Checkout-Redirects gegen externe Ziele gehärtet; interne Query-Parameter bleiben erhalten.
- Kundenportal und Beratung vollständig auf Deutsch und Englisch lokalisiert, inklusive Metadaten, mobiler Navigation und Footer.
- Paket-CTAs führen mit Paketkontext in die kostenlose Beratung statt in einen unklaren Kaufprozess.
- Beratungsformular um optionale Telefonnummer, Notiz und Paketkontext ergänzt.
- Terminslots strikt nach `Europe/Berlin`, Geschäftszeiten und Sommer-/Winterzeit berechnet.
- Vollständiger Passwort-Reset mit zufälligen, gehashten, ablaufenden Einmal-Tokens umgesetzt.
- Passwortänderungen widerrufen bestehende Sessions über `sessionVersion`.
- Reset-Anfragen antworten unabhängig von SMTP-Ergebnis und Kontobestand generisch; das IP-Limit nutzt den vertrauenswürdigen letzten nginx-Proxy-Hop.
- Bestehende Sessions ohne `sessionVersion` bleiben beim Rollout kompatibel und werden nach dem ersten Widerruf ungültig.
- Eigene 404-Seite mit echtem HTTP-404-Status ergänzt.
- Favicon und Open-Graph-/Twitter-Bild ergänzt bzw. korrigiert.
- Sprach-Cookie als sicheres Host-Cookie für Produktion, Vorschau und lokale Tests korrigiert.
- Standalone-Build für den isolierten Worktree und Test-Freshness korrigiert.
- Veralteten EU-OS-Plattform-Verweis aus dem Impressum entfernt.

## Verifikation

- `npx tsc --noEmit`: erfolgreich
- `npm test`: 45 Tests, 45 bestanden, 0 fehlgeschlagen
- Produktions-Build: erfolgreich
- Browser-Smoke (Playwright CLI): Desktop 1440×1000 und Mobile 390×844 erfolgreich
- Geprüfte Flows: Sprache, Mobile-Menü, Paket → Beratung, Login → Passwort vergessen, Termin-Slots, 404
- Während der Tests waren externe E-Mails deaktiviert; es gab keinen Produktions-Deploy und keinen externen Versand.

## Für eine echte inhaltliche 10/10 noch nötig

Diese Punkte brauchen reale Geschäftsentscheidungen oder belastbares Material und wurden bewusst nicht erfunden:

- 2–4 echte Referenzen mit Ergebnis, Ausgangslage, Leistung und Freigabe des Kunden
- echte Testimonials und gegebenenfalls Kundenlogos mit Nutzungsfreigabe
- persönlicher Vertrauensbaustein: Gründerfoto, Kurzprofil und nachvollziehbare Erfahrung
- verbindliche Leistungsgrenzen je Paket: Seitenumfang, Korrekturschleifen, Lieferzeit, Netto/Brutto, Domain-Verlängerung und laufende Kosten
- anwaltliche Prüfung von Impressum, Datenschutz und AGB sowie Bestätigung des Umsatzsteuer-/§19-Status
- Entscheidung zu Analytics/Conversion-Messung und – falls nicht technisch notwendige Dienste eingesetzt werden – Consent-Lösung

## Deployment-Gate

Nicht ausgeführt. Vor einem autorisierten Produktions-Deploy:

1. Backup/Restore-Punkt für Datenbank und aktuellen Artefaktstand bestätigen.
2. Umgebungsvariablen für öffentliche Basis-URL und Mailversand prüfen, ohne Secrets zu protokollieren.
3. `npx prisma migrate deploy` ausführen (additive Migration für Reset-Token und Session-Version).
4. Produktions-Artefakt bauen und nach dem bestehenden VPS-Verfahren ausrollen.
5. Prozess neu starten und Healthchecks für Startseite, Login, Beratung und API durchführen.
6. Passwort-Reset mit einer kontrollierten Testadresse einmal Ende-zu-Ende prüfen.

Rollback: vorheriges Artefakt/Commit wieder ausrollen und Prozess neu starten. Die additive Datenbankmigration kann zunächst bestehen bleiben; ein Entfernen von Spalte oder Tabelle sollte nur über eine gesondert geprüfte Migration erfolgen.
