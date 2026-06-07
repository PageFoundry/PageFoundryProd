import type { Metadata } from "next";
import { getServerI18n } from "@/i18n/server";

export const metadata: Metadata = {
  title: "Impressum",
  alternates: { canonical: "https://pagefoundry.de/impressum" },
};

export default async function ImpressumPage() {
  const { lang } = await getServerI18n();

  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-zinc-200">
      <h1 className="text-3xl font-bold mb-8">
        {lang === "de" ? "Impressum" : "Imprint"}
      </h1>

      {lang === "de" ? (
        <>
          <p>
            <strong>PageFoundry</strong>
            <br />
            Inhaber: Fabian Franke
            <br />
            Kastanienweg 20a
            <br />
            42499 Hückeswagen
          </p>

          <h2 className="text-xl font-semibold mt-10 mb-3">Kontakt</h2>
          <p>
            E-Mail: admin@pagefoundry.de
            <br />
            Telefon: +49 2192 8743999
            <br />
            Mobil: +49 1516 7076918
          </p>
          <br />
          <p>
            Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS)
            bereit: https://ec.europa.eu/consumers/odr
            <br />
            Wir sind nicht verpflichtet und nicht bereit, an einem Streitbeilegungsverfahren
            vor einer Verbraucherschlichtungsstelle teilzunehmen.
          </p>
        </>
      ) : (
        <>
          <p>
            <strong>PageFoundry</strong>
            <br />
            Owner: Fabian Franke
            <br />
            Kastanienweg 20a
            <br />
            42499 Hückeswagen
          </p>

          <h2 className="text-xl font-semibold mt-10 mb-3">Contact</h2>
          <p>
            E-mail: admin@pagefoundry.de
            <br />
            Phone: +49 2192 8743999
            <br />
            Mobile: +49 1516 7076918
          </p>

          <h2 className="text-xl font-semibold mt-10 mb-3">Dispute resolution</h2>
          <p>
            The European Commission provides an Online Dispute Resolution (ODR) platform:
            https://ec.europa.eu/consumers/odr
            <br />
            We are neither obliged nor willing to participate in dispute resolution proceedings
            before a consumer arbitration board.
          </p>
        </>
      )}
    </main>
  );
}
