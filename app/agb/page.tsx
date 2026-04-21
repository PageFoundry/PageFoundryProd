import type { Metadata } from "next";
import { getServerI18n } from "@/i18n/server";

export const metadata: Metadata = {
  title: "AGB · PageFoundry",
};

export default async function AgbPage() {
  const { lang } = await getServerI18n();

  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-zinc-200">
      <h1 className="text-3xl font-bold mb-8">
        {lang === "de" ? "Allgemeine Geschäftsbedingungen" : "Terms & Conditions"}
      </h1>

      {lang === "de" ? (
        <>
          <h2 className="text-xl font-semibold mt-10 mb-3">1. Geltungsbereich</h2>
          <p>
            Diese AGB gelten für alle Dienstleistungen von PageFoundry gegenüber Kunden.
          </p>

          <h2 className="text-xl font-semibold mt-10 mb-3">2. Vertragsgegenstand</h2>
          <p>
            Der Anbieter erbringt Leistungen in den Bereichen Webentwicklung, Hosting, SEO,
            technische Optimierung und Beratung.
          </p>

          <h2 className="text-xl font-semibold mt-10 mb-3">3. Angebot und Vertragsschluss</h2>
          <p>
            Mit Abschluss einer Bestellung über die Website kommt ein verbindlicher Vertrag zustande.
          </p>

          <h2 className="text-xl font-semibold mt-10 mb-3">4. Preise und Zahlung</h2>
          <p>
            Alle Preise verstehen sich in EUR. Die Zahlung erfolgt über Stripe mit den dort
            angebotenen Zahlungsmethoden.
          </p>

          <h2 className="text-xl font-semibold mt-10 mb-3">5. Leistungszeitraum</h2>
          <p>
            Bearbeitungszeiten und Zeiträume werden individuell mit dem Kunden abgestimmt.
          </p>

          <h2 className="text-xl font-semibold mt-10 mb-3">6. Mitwirkungspflichten</h2>
          <p>
            Der Kunde stellt alle erforderlichen Inhalte, Zugänge und Informationen rechtzeitig bereit.
          </p>

          <h2 className="text-xl font-semibold mt-10 mb-3">7. Nutzungsrechte</h2>
          <p>
            Nach vollständiger Zahlung erhält der Kunde einfache, nicht übertragbare Nutzungsrechte
            an den erstellten Werken. Vor Zahlung ist jede Nutzung untersagt.
          </p>

          <h2 className="text-xl font-semibold mt-10 mb-3">8. Gewährleistung</h2>
          <p>
            Für die Erreichung bestimmter Ranking-Ergebnisse (SEO) kann keine Garantie übernommen werden.
            Für Einschränkungen externer Systeme (z. B. Wix, Shopify, WordPress) wird keine Haftung übernommen.
          </p>

          <h2 className="text-xl font-semibold mt-10 mb-3">9. Haftung</h2>
          <p>
            Der Anbieter haftet nur bei Vorsatz und grober Fahrlässigkeit. Die Haftung ist auf den
            Auftragswert begrenzt.
          </p>

          <h2 className="text-xl font-semibold mt-10 mb-3">10. Widerrufsrecht</h2>
          <p>
            Für individuell erstellte digitale Inhalte besteht kein Widerrufsrecht,
            sobald mit der Ausführung der Dienstleistung begonnen wurde (§ 312g BGB).
          </p>

          <h2 className="text-xl font-semibold mt-10 mb-3">11. Kündigung</h2>
          <p>
            Laufende Abonnements können mit einer Frist von einem Monat zum Ende des Abrechnungszeitraums
            gekündigt werden.
          </p>

          <h2 className="text-xl font-semibold mt-10 mb-3">12. Schlussbestimmungen</h2>
          <p>
            Es gilt deutsches Recht. Gerichtsstand ist der Sitz des Anbieters, sofern gesetzlich zulässig.
          </p>
        </>
      ) : (
        <>
          <h2 className="text-xl font-semibold mt-10 mb-3">1. Scope</h2>
          <p>
            These terms apply to all services provided by PageFoundry to customers.
          </p>

          <h2 className="text-xl font-semibold mt-10 mb-3">2. Subject of the contract</h2>
          <p>
            The provider offers services in web development, hosting, SEO, technical optimization
            and consulting.
          </p>

          <h2 className="text-xl font-semibold mt-10 mb-3">3. Offer and conclusion</h2>
          <p>
            A binding contract is formed when an order is placed via the website.
          </p>

          <h2 className="text-xl font-semibold mt-10 mb-3">4. Prices and payment</h2>
          <p>
            All prices are in EUR. Payment is handled via Stripe using the payment methods offered there.
          </p>

          <h2 className="text-xl font-semibold mt-10 mb-3">5. Timeframe</h2>
          <p>
            Timelines and delivery windows are agreed individually with the customer.
          </p>

          <h2 className="text-xl font-semibold mt-10 mb-3">6. Customer obligations</h2>
          <p>
            The customer provides all necessary content, access data and information in due time.
          </p>

          <h2 className="text-xl font-semibold mt-10 mb-3">7. Usage rights</h2>
          <p>
            After full payment the customer receives a simple, non-transferable right to use the
            delivered work. Any use before payment is not permitted.
          </p>

          <h2 className="text-xl font-semibold mt-10 mb-3">8. Warranty</h2>
          <p>
            No guarantee is given for specific SEO rankings. The provider is not liable for
            limitations of third-party systems (e.g. Wix, Shopify, WordPress).
          </p>

          <h2 className="text-xl font-semibold mt-10 mb-3">9. Liability</h2>
          <p>
            The provider is only liable for intent or gross negligence. Liability is limited to the
            order value.
          </p>

          <h2 className="text-xl font-semibold mt-10 mb-3">10. Right of withdrawal</h2>
          <p>
            For individually created digital content no right of withdrawal exists once performance
            has begun, in accordance with applicable law.
          </p>

          <h2 className="text-xl font-semibold mt-10 mb-3">11. Termination</h2>
          <p>
            Subscriptions can be terminated with one month&apos;s notice to the end of the billing period.
          </p>

          <h2 className="text-xl font-semibold mt-10 mb-3">12. Final provisions</h2>
          <p>
            German law applies. Place of jurisdiction is the provider&apos;s registered office,
            where legally permissible.
          </p>
        </>
      )}
    </main>
  );
}
