# PageFoundry App

## RetellAI Call Agent

Die Retell-Integration stellt drei serverseitige Endpunkte bereit:

- `POST /api/retell/webhook`
- `POST /api/retell/tools/book-appointment`
- `POST /api/retell/tools/save-lead`

### Env

```env
DISCORD_WEBHOOK_URL=
RETELL_API_KEY=
RETELL_WEBHOOK_SECRET=
APP_BASE_URL=https://pagefoundry.de
DEFAULT_TIMEZONE=Europe/Berlin
```

`RETELL_WEBHOOK_SECRET` wird für die HMAC-Prüfung von `x-retell-signature` genutzt. Wenn es leer ist, fällt die App auf `RETELL_API_KEY` zurück, passend zur Retell-Doku. Lokal ohne Secret wird die Signaturprüfung übersprungen.

### Retell Setup

Die bestehende SIM-Nummer muss providerseitig zu Retell geroutet werden, zum Beispiel über Retell Telephony, SIP oder einen unterstützten Telephony-Provider. Die App stellt die Backend-Endpunkte für Webhooks und Tools bereit, nimmt aber selbst keine GSM-/SIP-Verbindung entgegen.

Webhook URL:

```text
https://pagefoundry.de/api/retell/webhook
```

Tool URLs:

```text
https://pagefoundry.de/api/retell/tools/book-appointment
https://pagefoundry.de/api/retell/tools/save-lead
```

Für Custom Functions kann Retell entweder ein flaches JSON senden oder den Wrapper `{ "name": "...", "call": {...}, "args": {...} }`. Beide Formate werden akzeptiert.

Der fertige Agent-Prompt liegt unter `docs/retell-agent-system-prompt.md`.

### Kalender

Das interne Calendar Tool nutzt `InternalCalendarProvider` und speichert Termine in `calendar_events`. Leads werden in `call_leads` gespeichert. Die Provider-Abstraktion liegt unter `src/lib/retell/calendar.ts`, damit später Cal.com, Google Calendar oder ein internes Kalender-Backend ausgetauscht werden können.

Terminregeln:

- Standarddauer: 30 Minuten
- Default-Zeitzone: `Europe/Berlin`
- keine Termine in der Vergangenheit
- keine überschneidenden Termine
- Montag bis Freitag, 09:00 bis 17:00 Uhr

### Lokaler Testablauf

```bash
npm install
npx prisma migrate dev
npx prisma generate
npm run build
npx tsx --test tests/retell.unit.test.ts
```

Die bestehenden Auth-Integrationstests laufen gegen einen gestarteten Server:

```bash
npm run dev
TEST_BASE_URL=http://localhost:3000 node --test tests/auth.test.mjs
```

### Deployment

Nach erfolgreichem Build die Standalone-Artefakte nach `/var/www/pagefoundry` synchronisieren und `pm2 restart pagefoundry` ausführen. Der bestehende VPS-Deploy-Ablauf ist im Vault unter `workflows/deployment.md` dokumentiert.
