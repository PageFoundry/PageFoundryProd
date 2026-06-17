import type { Metadata } from "next";
import { getServerI18n } from "@/i18n/server";

export const metadata: Metadata = {
  title: "Datenschutzerklärung",
  alternates: { canonical: "https://pagefoundry.de/datenschutz" },
};

export default async function DatenschutzPage() {
  const { lang } = await getServerI18n();

  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-zinc-200">
      <h1 className="text-3xl font-bold mb-8">
        {lang === "de" ? "Datenschutzerklärung" : "Privacy Policy"}
      </h1>

      {lang === "de" ? (
        <>
          <h2 className="text-xl font-semibold mt-10 mb-3">1. Verantwortlicher</h2>
          <p>
            PageFoundry
            <br />
            Inhaber: Fabian Franke
            <br />
            Kastanienweg 20a, 42499 Hückeswagen
            <br />
            E-Mail: admin@pagefoundry.de
          </p>

          <h2 className="text-xl font-semibold mt-10 mb-3">2. Zugriffsdaten</h2>
          <p>
            Beim Besuch der Website werden IP-Adresse, Datum/Uhrzeit, Browsertyp/Version,
            Betriebssystem und Referrer-URL erfasst. Die Daten dienen der technischen
            Sicherheit und werden in der Regel nach 7 Tagen gelöscht.
          </p>

          <h2 className="text-xl font-semibold mt-10 mb-3">3. Registrierung und Login</h2>
          <p>
            Für bestimmte Funktionen ist eine Registrierung erforderlich. Verarbeitet werden:
            E-Mail, verschlüsseltes Passwort, optional Name und Telefonnummer.
          </p>

          <h2 className="text-xl font-semibold mt-10 mb-3">4. Zahlungen über Stripe</h2>
          <p>
            Zahlungen werden über Stripe abgewickelt. Weitere Informationen:
            https://stripe.com/privacy
          </p>

          <h2 className="text-xl font-semibold mt-10 mb-3">5. Cookies</h2>
          <p>
            Wir setzen technisch notwendige Cookies ein, etwa für Authentifizierung
            und Sprachauswahl. Ohne diese ist die Nutzung bestimmter Funktionen nicht möglich.
          </p>

          <h2 className="text-xl font-semibold mt-10 mb-3">6. Beratungsanfragen</h2>
          <p>
            Bei Beratungsanfragen verarbeiten wir Name, E-Mail, Telefon, gewählten Zeit-Slot
            sowie optionale Notizen, um den Termin zu koordinieren.
          </p>

          <h2 className="text-xl font-semibold mt-10 mb-3">7. KI-Telefonassistenz</h2>
          <p>
            Für Kunden unseres Produkts „KI-Telefonassistenz" betreiben wir in deren Auftrag
            einen KI-gestützten Telefondienst. Anrufende werden zu Beginn des Gesprächs darüber
            informiert, dass ein digitaler Assistent antwortet. Dabei können Name, Telefonnummer,
            Anliegen, Terminwunsch sowie Gesprächsinhalte verarbeitet werden, um Termine zu
            koordinieren oder den Kontakt an den jeweiligen Kunden weiterzugeben. Für die
            Sprachverarbeitung setzen wir den Dienstleister Retell AI ein; die Verarbeitung
            erfolgt auf Grundlage eines Auftragsverarbeitungsvertrags (Art. 28 DSGVO).
            Verantwortlicher für diese Verarbeitung ist der jeweilige Betrieb, der die Assistenz
            einsetzt; PageFoundry handelt insoweit als Auftragsverarbeiter. Details und
            Aufbewahrungsfristen regelt der jeweilige Vertrag.
          </p>

          <h2 className="text-xl font-semibold mt-10 mb-3">
            8. Facebook- und Instagram-Nachrichten und Kommentare
          </h2>
          <p>
            Wir betreiben einen zentralen Posteingang („Message Hub"), um Nachrichten und
            Kommentare zu verarbeiten, die uns über unsere eigene Facebook-Seite und unser
            Instagram-Konto erreichen. Verarbeitet werden dabei der Inhalt der Nachricht bzw.
            des Kommentars, der öffentliche Profilname und die plattformseitige Nutzer- bzw.
            Konversations-ID der schreibenden Person, Zeitstempel sowie – bei Kommentaren – ein
            Verweis auf den zugehörigen Beitrag. Zweck ist die Sichtung und Beantwortung von
            Anfragen. Antworten werden ausschließlich manuell durch einen Menschen ausgelöst;
            ein automatisierter Massenversand findet nicht statt. Die Daten werden über die
            offiziellen Schnittstellen von Meta (Graph API) bezogen; ergänzend gelten die
            Datenrichtlinien von Meta (https://www.facebook.com/privacy/policy). Rechtsgrundlage
            ist unser berechtigtes Interesse an der Kommunikation mit Interessenten und Kunden
            (Art. 6 Abs. 1 lit. f DSGVO) bzw. die Anbahnung oder Erfüllung eines Vertrags
            (Art. 6 Abs. 1 lit. b DSGVO). Die Daten werden gelöscht, sobald sie für die
            Bearbeitung nicht mehr erforderlich sind.
          </p>

          <h2 className="text-xl font-semibold mt-10 mb-3">9. Hosting</h2>
          <p>
            Die Website wird auf Servern innerhalb der EU betrieben. Logdaten werden automatisch
            gelöscht, sofern keine längere Speicherung aus Sicherheitsgründen erforderlich ist.
          </p>

          <h2 className="text-xl font-semibold mt-10 mb-3">10. Rechte der betroffenen Personen</h2>
          <p>
            Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der
            Verarbeitung, Datenübertragbarkeit sowie Widerspruch. Anfragen richten Sie bitte an
            admin@pagefoundry.de.
          </p>

          <h2 className="text-xl font-semibold mt-10 mb-3">11. Änderungen</h2>
          <p>
            Wir behalten uns vor, diese Datenschutzerklärung bei Bedarf anzupassen.
          </p>
        </>
      ) : (
        <>
          <h2 className="text-xl font-semibold mt-10 mb-3">1. Controller</h2>
          <p>
            PageFoundry
            <br />
            Owner: Fabian Franke
            <br />
            Kastanienweg 20a, 42499 Hückeswagen
            <br />
            E-mail: admin@pagefoundry.de
          </p>

          <h2 className="text-xl font-semibold mt-10 mb-3">2. Access data</h2>
          <p>
            When visiting the website we collect IP address, date/time, browser type/version,
            operating system and referrer URL. Data is used for technical security and usually
            deleted after 7 days.
          </p>

          <h2 className="text-xl font-semibold mt-10 mb-3">3. Registration and login</h2>
          <p>
            For certain features registration is required. We process: e-mail, encrypted password,
            and optionally name and phone number.
          </p>

          <h2 className="text-xl font-semibold mt-10 mb-3">4. Payments via Stripe</h2>
          <p>
            Payments are processed by Stripe. Further information:
            https://stripe.com/privacy
          </p>

          <h2 className="text-xl font-semibold mt-10 mb-3">5. Cookies</h2>
          <p>
            We use technically necessary cookies, for example for authentication
            and language selection. Without these, some features will not work.
          </p>

          <h2 className="text-xl font-semibold mt-10 mb-3">6. Consultation requests</h2>
          <p>
            For consultation requests we process name, e-mail, phone number, selected time slot
            and optional notes to schedule the appointment.
          </p>

          <h2 className="text-xl font-semibold mt-10 mb-3">7. AI phone assistant</h2>
          <p>
            For customers of our &quot;AI phone assistant&quot; product we operate an AI-based
            telephone service on their behalf. Callers are informed at the start of the call that
            a digital assistant is answering. In doing so, name, phone number, request, appointment
            preferences and call content may be processed in order to schedule appointments or
            forward the contact to the respective customer. For voice processing we use the provider
            Retell AI; processing is carried out on the basis of a data processing agreement
            (Art. 28 GDPR). The controller for this processing is the respective business using the
            assistant; PageFoundry acts as a processor in this respect. Details and retention
            periods are governed by the respective contract.
          </p>

          <h2 className="text-xl font-semibold mt-10 mb-3">
            8. Facebook and Instagram messages and comments
          </h2>
          <p>
            We operate a central inbox (&quot;Message Hub&quot;) to process messages and comments
            that reach us through our own Facebook page and Instagram account. We process the
            content of the message or comment, the public profile name and the platform-side
            user/conversation ID of the sender, timestamps and — for comments — a reference to the
            related post. The purpose is to review and respond to enquiries. Replies are triggered
            exclusively manually by a human; no automated bulk sending takes place. Data is obtained
            via Meta&apos;s official interfaces (Graph API); Meta&apos;s data policies apply in
            addition (https://www.facebook.com/privacy/policy). The legal basis is our legitimate
            interest in communicating with prospects and customers (Art. 6(1)(f) GDPR) or the
            initiation and performance of a contract (Art. 6(1)(b) GDPR). Data is deleted once it is
            no longer required for processing.
          </p>

          <h2 className="text-xl font-semibold mt-10 mb-3">9. Hosting</h2>
          <p>
            The website is hosted on servers located within the EU. Log data is deleted
            automatically unless longer retention is required for security reasons.
          </p>

          <h2 className="text-xl font-semibold mt-10 mb-3">10. Data subject rights</h2>
          <p>
            You have the right to access, rectification, erasure, restriction of processing,
            data portability and objection. Please send requests to admin@pagefoundry.de.
          </p>

          <h2 className="text-xl font-semibold mt-10 mb-3">11. Changes</h2>
          <p>
            We may update this privacy policy from time to time as needed.
          </p>
        </>
      )}
    </main>
  );
}
