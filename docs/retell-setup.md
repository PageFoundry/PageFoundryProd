# RetellAI V2 – Einpflege für PageFoundry

Stand: 15.09.2026. Diese Anleitung gehört zum Agenten `PageFoundry Inbound Assistant` und zur bestehenden Asterisk-/Dial-to-SIP-Anbindung. Retell selbst wurde durch diese Datei nicht verändert.

## Aktueller Befund

Der aktuell ausgelesene Agent hat bereits `end_call`, `book_appointment` und `save_lead`. Der aktuelle Entwurf ist aber nicht veröffentlicht und hat keine konfigurierte Knowledge Base oder Post-Call-Extraction. `check_availability` fehlt noch. Der Agent hat außerdem keine agent-level Webhook-Konfiguration; ein Account-level Webhook kann trotzdem separat aktiv sein.

Wichtig: Die bestehende Telefonie läuft über Asterisk und Retells Dial-to-SIP-Methode. Retells eingebauter Call-Transfer kann in diesem Setup nicht verwendet werden. Ein späterer Transfer wäre eine eigene Asterisk-/Custom-Function-Integration und ist nicht Teil dieser Einpflege.

## 1. Agent und Prompt

Agent beibehalten:

| Einstellung | Wert |
|---|---|
| Name | `PageFoundry Inbound Assistant` |
| Sprache | `German (de-DE)` |
| Start speaker | Agent |
| Begin message | exakt: `Hallo, hier ist der telefonische Assistent von PageFoundry. Wie kann ich Ihnen helfen?` |
| LLM | bestehendes Retell LLM, neue Version speichern und nach den Tests veröffentlichen |
| Tool call strict mode | aktiviert lassen |

Den Inhalt von `docs/retell-agent-system-prompt.md` in den General Prompt kopieren. Die Begrüßung zusätzlich als statische Begin Message setzen, damit sie exakt gesprochen wird.

`{{current_date}}` und `{{current_time_Europe/Berlin}}` nicht durch feste Werte ersetzen. Retell stellt Zeitvariablen automatisch bereit; alle Datumsberechnungen und Buchungsprüfungen werden zusätzlich serverseitig abgesichert.

## 2. Webhook

Agent-level Webhook oder der bereits verwendete Account-level Webhook, aber nicht widersprüchlich doppelt konfigurieren.

```text
https://pagefoundry.de/api/retell/webhook
```

Aktivieren:

```text
call_started
call_ended
call_analyzed
```

`transcript_updated` nicht aktivieren. Das erzeugt bei diesem Use Case unnötig viele Requests. Für `call_analyzed` muss der Webhook aktiviert sein, weil dort die Post-Call-Extraction ankommt. Die Route akzeptiert Retell-Signaturen über `X-Retell-Signature`; im Produktivsystem muss `RETELL_API_KEY` oder `RETELL_WEBHOOK_SECRET` gesetzt sein.

## 3. Custom Functions

Für alle drei Functions:

| Einstellung | Wert |
|---|---|
| Method | `POST` |
| Parameter type | `JSON` |
| Payload: args only | ausgeschaltet |
| Max retries | `0` |
| Timeout | `120000 ms` oder niedriger, wenn Retell es zulässt |
| Speak during execution | ausgeschaltet; der Prompt steuert die Ansage |
| Speak after execution | eingeschaltet |

Payload: args only bleibt ausgeschaltet, weil der Backend-Parser dann zusätzlich `call.call_id`, `call.from_number` und den Gesprächstranskript-Kontext erhält. Der Endpoint akzeptiert zwar auch flache Payloads, aber ohne Wrapper fehlt die automatische Caller-ID.

### `check_availability`

URL:

```text
https://pagefoundry.de/api/retell/tools/check-availability
```

Beschreibung:

```text
Prüft, ob der gewünschte 30-Minuten-Termin in Europe/Berlin tatsächlich frei und nach den Geschäftszeiten sowie dem Mindestvorlauf zulässig ist. Diese Funktion bucht keinen Termin. Vor jeder Terminbestätigung und vor book_appointment aufrufen.
```

JSON Schema:

```json
{
  "type": "object",
  "properties": {
    "startDateTime": {
      "type": "string",
      "description": "Konkreter Terminbeginn als ISO 8601 mit Europe/Berlin-Offset, zum Beispiel 2026-05-28T14:00:00+02:00. Keine relativen Angaben."
    },
    "endDateTime": {
      "type": "string",
      "description": "Optionales Ende als ISO 8601. Wenn nicht angegeben, werden 30 Minuten verwendet."
    },
    "timezone": {
      "type": "string",
      "description": "IANA-Zeitzone. Immer Europe/Berlin verwenden."
    }
  },
  "required": ["startDateTime"]
}
```

Erfolg liefert unter anderem:

```json
{
  "available": true,
  "startDateTime": "2026-05-28T14:00:00+02:00",
  "endDateTime": "2026-05-28T14:30:00+02:00",
  "timezone": "Europe/Berlin"
}
```

Bei `available: false` kommen `reason` und höchstens drei `alternatives`. Bei einer Alternative erst den ausgewählten Zeitpunkt erneut prüfen.

### `book_appointment`

URL:

```text
https://pagefoundry.de/api/retell/tools/book-appointment
```

Beschreibung:

```text
Bucht einen vom Anrufer bestätigten Termin. Nur aufrufen, wenn check_availability für exakt diesen Zeitpunkt available true geliefert hat und der Anrufer Datum und Uhrzeit eindeutig bestätigt hat. Bei Erfolg ist der Termin wirklich in PageFoundry gespeichert. Bei slot_unavailable nicht behaupten, dass gebucht wurde.
```

JSON Schema:

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Name des Anrufers; der Vorname genügt."
    },
    "company": {
      "type": "string",
      "description": "Unternehmen, falls genannt oder relevant."
    },
    "phone": {
      "type": "string",
      "description": "Nur verwenden, wenn eine andere Rückrufnummer gewünscht ist. Die eingehende Caller-ID wird automatisch aus dem call-Kontext übernommen. E.164-Format."
    },
    "reason": {
      "type": "string",
      "description": "Kurze sachliche Beschreibung des Hauptanliegens."
    },
    "projectType": {
      "type": "string",
      "enum": ["website", "redesign", "seo", "hosting", "web_app", "other"],
      "description": "Passende Projektkategorie, falls erkennbar."
    },
    "startDateTime": {
      "type": "string",
      "description": "Bestätigter Terminbeginn als ISO 8601 mit Europe/Berlin-Offset."
    },
    "endDateTime": {
      "type": "string",
      "description": "Optionales Ende als ISO 8601; standardmäßig 30 Minuten nach startDateTime."
    },
    "timezone": {
      "type": "string",
      "description": "IANA-Zeitzone; Europe/Berlin verwenden."
    }
  },
  "required": ["name", "reason", "startDateTime"]
}
```

### `save_lead`

URL:

```text
https://pagefoundry.de/api/retell/tools/save-lead
```

Beschreibung:

```text
Speichert einen relevanten geschäftlichen Kontakt, wenn PageFoundry nach dem Gespräch noch handeln muss und kein Termin erfolgreich gebucht wurde. Nicht für falsche Nummern, Spam, Scherzanrufe, offensichtlich irrelevante Anrufe oder vollständig beantwortete allgemeine Fragen verwenden. Erst nach der knappen Zusammenfassung und Bestätigung des Anrufers aufrufen.
```

JSON Schema:

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Name des Anrufers; wenn nicht genannt, Unbekannt."
    },
    "company": {
      "type": "string",
      "description": "Unternehmen, falls genannt."
    },
    "phone": {
      "type": "string",
      "description": "Nur bei abweichender Rückrufnummer. Die eingehende Caller-ID wird automatisch aus dem call-Kontext übernommen. E.164-Format."
    },
    "reason": {
      "type": "string",
      "description": "Was der Anrufer konkret wollte."
    },
    "projectType": {
      "type": "string",
      "enum": ["website", "redesign", "seo", "hosting", "web_app", "other"]
    },
    "summary": {
      "type": "string",
      "description": "Kurze Zusammenfassung mit höchstens zwei Sätzen."
    },
    "noAppointmentReason": {
      "type": "string",
      "description": "Kurzer sachlicher Grund, warum kein Termin gebucht wurde."
    }
  },
  "required": ["reason"]
}
```

## 4. Knowledge Base

Die vorbereiteten Quellen liegen in `docs/retell-knowledge-base.md`. In Retell entweder diese Datei als Text/Dokument importieren oder die genannten öffentlichen URLs einzeln hinzufügen:

```text
https://pagefoundry.de/ki-telefonassistenz
https://pagefoundry.de/website-wache
https://pagefoundry.de/website-rettung
https://pagefoundry.de/webdesign-bergisches-land
https://pagefoundry.de/seo-hueckeswagen
https://pagefoundry.de/consultation
https://pagefoundry.de/impressum
```

Empfohlene Einstellungen: `top_k = 3`, Filter Score zunächst `0.6`. Preise und Leistungsgrenzen nur aus diesen Quellen nennen. Keine zusätzliche, widersprüchliche Preisliste hochladen.

## 5. Post-Call-Extraction

Im Tab „Post Call Extraction“ die folgenden Kategorien anlegen. Die Namen müssen exakt stimmen, weil das Backend sie in `CallLead` speichert.

| Name | Typ | Werte / Beispiel | Zweck |
|---|---|---|---|
| `call_type` | Selector | `new_interest`, `existing_customer`, `general_information`, `callback_request`, `other_business`, `wrong_number`, `spam`, `prank`, `irrelevant` | Einordnung des Anrufs |
| `lead_quality` | Selector | `high`, `medium`, `low`, `not_applicable` | Vertriebsqualität |
| `service_interest` | Selector | `website`, `redesign`, `seo`, `hosting`, `web_app`, `phone_assistant`, `other`, `none` | Hauptinteresse |
| `urgency` | Selector | `urgent`, `normal`, `low`, `not_applicable` | Zeitliche Dringlichkeit |
| `budget_mentioned` | Boolean | `true` / `false` | Wurde ein Budget genannt? |
| `appointment_booked` | Boolean | `true` / `false` | Wurde im Call erfolgreich gebucht? |
| `follow_up_required` | Boolean | `true` / `false` | Muss Fabian nach dem Call handeln? |
| `caller_sentiment` | Selector | `positive`, `neutral`, `negative` | Stimmung des Anrufers |

Für die vorhandene Standardkategorie `call_summary` die Zusammenfassung auf höchstens zwei kurze Sätze begrenzen. Die Custom-Kategorien sollen nur aus dem tatsächlichen Gespräch ableiten; bei fehlender Information keine Werte erfinden. `call_analyzed` liefert diese Daten, `call_ended` nicht.

## 6. Sprache und Transkription

```text
Boosted keywords:
PageFoundry
Fabian Franke
SEO
Hückeswagen
RetellAI
Website-Wache
Website-Rettung
Carbon Care
The Loft
```

Für `PageFoundry` und `Fabian Franke` im Pronunciation-Editor eine kurze Testaufnahme machen und die Variante wählen, die im Telefon-Test natürlich klingt. Keine phonetische Schreibweise blind übernehmen; die Aussprache muss im konkreten TTS-Modell geprüft werden.

Empfehlung für den ersten Test: Dynamic responsiveness aktivieren, Backchanneling deaktivieren oder auf die niedrigste Stufe stellen, Interruption Sensitivity zunächst bei `0.9` belassen.

## 7. Datenschutz und Fallback

Die aktuelle Retell-Konfiguration speichert alles und hat keine automatische Retention. Vor dem Publish bewusst festlegen:

| Einstellung | Pilot-Vorschlag | Vorbehalt |
|---|---|---|
| Data storage | `everything_except_pii` | Nur verwenden, wenn die resultierende PII-Redaktion mit den gewünschten CRM-Daten vereinbar ist. |
| Retention | 90 Tage | Retell löscht danach dauerhaft. |
| Signed URLs | aktivieren | Für Aufzeichnungen und Logs nur zeitlich begrenzte Links verwenden. |
| Guardrails | aktivieren | Output: regulierte Beratung, illegale/schädliche Inhalte, sexuelle Inhalte, Gewalt; Input entsprechend für Missbrauch. |
| Fallback voice | konfigurieren | Zweite deutsche Stimme testen, bevor der Agent live publiziert wird. |

Die lokale PageFoundry-Datenbank speichert aktuell Transkript und Lead-Daten unabhängig von Retells Retention. Die 90 Tage löschen diese lokalen Daten nicht; eine lokale Löschroutine ist separat zu entscheiden.

## 8. Veröffentlichen und Smoke-Test

1. Prompt, Begin Message und Functions im Draft einpflegen.
2. Knowledge Base hinzufügen.
3. Post-Call-Extraction anlegen.
4. Webhook und Caller-ID-Verhalten mit Simulation testen.
5. Die Testfälle aus `docs/retell-simulation-tests.md` durchführen.
6. Einen echten Testanruf mit Terminprüfung und einen echten Testanruf ohne Termin durchführen.
7. In PageFoundry prüfen: `CallLead`, `CalendarEvent`, Discord und `/admin`.
8. Erst danach den Agent-Draft veröffentlichen.

Für Custom Functions bei Simulationstests Function Mocks verwenden. Für den echten Smoke-Test keine Testdaten mit falschen Kundendaten erzeugen, sondern einen klar erkennbaren Testanruf verwenden und danach gezielt bereinigen.

Offizielle Retell-Referenzen: [Custom Functions](https://docs.retellai.com/build/conversation-flow/custom-function), [Webhooks](https://docs.retellai.com/features/webhook-overview), [Dynamic Variables](https://docs.retellai.com/build/dynamic-variables), [Post Call Extraction](https://docs.retellai.com/features/post-call-analysis), [Simulation Testing](https://docs.retellai.com/test/llm-simulation-testing), [Data Retention](https://docs.retellai.com/accounts/data-retention), [Custom Telephony](https://docs.retellai.com/deploy/custom-telephony).
