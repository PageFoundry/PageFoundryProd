import Link from "next/link";
import { getServerI18n } from "@/i18n/server";

export default async function NotFound() {
  const { lang } = await getServerI18n();
  const de = lang === "de";

  return (
    <section className="section-pad flex min-h-[70vh] items-center justify-center">
      <div className="pf-card w-full max-w-2xl p-8 text-center sm:p-12">
        <span className="label-mono mb-5 block">404</span>
        <h1
          className="text-pfText leading-none"
          style={{
            fontFamily: "var(--font-display), Impact, sans-serif",
            fontSize: "clamp(3rem, 10vw, 6rem)",
          }}
        >
          {de ? "Seite nicht gefunden." : "Page not found."}
        </h1>
        <p className="mx-auto mt-5 max-w-lg text-sm leading-7 text-pfSubtle">
          {de
            ? "Der Link ist veraltet oder die Seite wurde verschoben. Von hier kommst du sicher weiter."
            : "The link is outdated or the page has moved. Continue from one of the options below."}
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/" className="btn-accent justify-center">
            {de ? "Zur Startseite" : "Back to homepage"}
          </Link>
          <Link href="/consultation" className="btn-outline justify-center">
            {de ? "Beratung buchen" : "Book a consultation"}
          </Link>
        </div>
      </div>
    </section>
  );
}
