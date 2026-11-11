import Link from "next/link";
import clsx from "clsx";
import type { ReactNode } from "react";
import PricingTiers, { type PricingTier } from "./PricingTiers";
import ServiceCTA from "./ServiceCTA";

export interface ServiceLandingData {
  eyebrow: string;
  heroHeading: string;
  heroSubline: string;
  problem: { label: string; heading: string; points: string[] };
  steps: { label: string; heading: string; items: { title: string; text: string }[] };
  included: { label: string; heading: string; items: string[]; note?: string };
  pricing: {
    label: string;
    heading: string;
    tiers: PricingTier[];
    footnote?: string;
    image?: { src: string; alt: string; caption: string };
  };
  faq: { label: string; heading: string; items: { q: string; a: ReactNode }[] };
  cta: { heading: string; text: string };
  /** Overrides the default "/consultation" target, e.g. to preselect a package. */
  consultationHref?: string;
  references?: {
    heading: string;
    items: {
      name: string;
      text: string;
      href: string;
      label: string;
      internalLink?: { href: string; label: string };
    }[];
  };
  related?: { label: string; items: { label: string; href: string }[] };
}

export default function ServiceLanding({ data, centered = false }: { data: ServiceLandingData; centered?: boolean }) {
  const actionClass = centered && "!min-h-12 !rounded-lg !px-6 !py-3 !font-sans !text-sm !font-medium !normal-case !tracking-normal !transition-colors";

  return (
    <div data-public-page lang="de" className={clsx("relative z-10 text-pfText", centered && "text-center")}>
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-20 pt-32 md:px-10 md:pt-36">
        <div className="mx-auto max-w-screen-xl">
          {centered && <p className="mb-6 text-sm text-pfAccent">{data.eyebrow}</p>}
          <h1 className={clsx("font-display text-pfText", centered ? "mx-auto max-w-6xl text-balance text-[2.5rem] leading-[1.05] sm:text-6xl md:text-7xl" : "max-w-4xl text-5xl leading-[0.9] tracking-wide md:text-7xl")}>
            {data.heroHeading}
          </h1>
          {!centered && <div className="my-8 h-px w-28 bg-gradient-to-r from-pfAccent to-transparent" />}
          <p className={clsx("max-w-2xl text-base leading-8 text-pfSubtle md:text-lg", centered && "mx-auto mt-8")}>{data.heroSubline}</p>
          <div className={clsx("mt-10 flex flex-col gap-4 sm:flex-row", centered && "flex-wrap justify-center")}>
            <Link href={data.consultationHref ?? "/consultation"} className={clsx("btn-accent", actionClass)}>
              Kostenlose Beratung buchen →
            </Link>
            <a href="https://wa.me/4915167076918" className={clsx("btn-outline", actionClass)}>WhatsApp</a>
            {!centered && <a href="tel:+4921928743999" className="btn-outline">
              Telefon: 02192 8743999
            </a>}
          </div>
          {centered && <a href="tel:+4921928743999" className="mt-6 inline-flex min-h-11 items-center text-sm text-pfSubtle underline underline-offset-4 transition-colors hover:text-pfText">Telefon: 02192 8743999</a>}
          <p className="mt-4 text-xs leading-6 text-pfMuted">Telefon: Mein KI-Assistent nimmt an, ich rufe zurück.</p>
        </div>
      </section>

      {/* Problem */}
      <section className="px-6 py-20 md:px-10">
        <div className="mx-auto max-w-screen-xl">
          <div className={clsx("mb-10", centered ? "mx-auto max-w-4xl text-balance" : "max-w-2xl")}>
            <h2 className="font-display text-4xl leading-none text-pfText md:text-6xl">
              {data.problem.heading}
            </h2>
          </div>
          <div className={clsx("max-w-3xl", centered && "mx-auto")}>
            {data.problem.points.map((point, index) => (
              <div key={point} className={clsx("flex gap-5 border-b border-pfBorder py-5 last:border-b-0", centered && "justify-center")}>
                {!centered && <span className="mt-1 shrink-0 font-mono text-[0.62rem] tracking-widest text-pfAccent">
                  {String(index + 1).padStart(2, "0")}
                </span>}
                <p className="text-sm leading-7 text-pfSubtle md:text-base">{point}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="bg-pfSurface px-6 py-24 md:px-10">
        <div className="mx-auto max-w-screen-xl">
          <div className={clsx("mb-12", centered ? "mx-auto max-w-4xl text-balance" : "max-w-2xl")}>
            <h2 className="font-display text-5xl leading-none text-pfText md:text-7xl">
              {data.steps.heading}
            </h2>
          </div>
          <div className={clsx("grid gap-px overflow-hidden rounded-3xl bg-pfBorder", centered ? "md:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-3")}>
            {data.steps.items.map((step, index) => (
              <article key={step.title} className={clsx("min-h-56 bg-pfSurface p-8", centered && "md:row-span-3 md:grid md:grid-rows-subgrid")}>
                <div className="font-display text-7xl leading-none text-pfAccent/70">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <h3 className="mt-8 font-display text-3xl leading-none text-pfText">{step.title}</h3>
                <p className="mt-4 text-sm leading-7 text-pfSubtle">{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Included */}
      <section className="px-6 py-20 md:px-10">
        <div className="mx-auto max-w-screen-xl">
          <div className={clsx("mb-10", centered ? "mx-auto max-w-4xl text-balance" : "max-w-2xl")}>
            <h2 className="font-display text-4xl leading-none text-pfText md:text-6xl">
              {data.included.heading}
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {data.included.items.map((item) => (
              <div key={item} className={clsx("pf-card flex gap-3 p-5", centered && "items-center justify-center transition-colors")}>
                {!centered && <span className="mt-1 shrink-0 font-mono text-pfAccent">+</span>}
                <span className="text-sm leading-7 text-pfSubtle">{item}</span>
              </div>
            ))}
          </div>
          {data.included.note && (
            <p className={clsx("mt-6 text-pfMuted", centered ? "mx-auto max-w-4xl text-sm leading-7" : "max-w-3xl font-mono text-[0.72rem] leading-6")}>
              {data.included.note}
            </p>
          )}
        </div>
      </section>

      <PricingTiers
        label={data.pricing.label}
        heading={data.pricing.heading}
        tiers={data.pricing.tiers}
        footnote={data.pricing.footnote}
        image={data.pricing.image}
        centered={centered}
      />

      {/* FAQ */}
      <section className="px-6 py-24 md:px-10">
        <div className="mx-auto max-w-screen-xl">
          <div className={clsx("mb-12", centered ? "mx-auto max-w-4xl text-balance" : "max-w-2xl")}>
            <h2 className="font-display text-5xl leading-none text-pfText md:text-7xl">
              {data.faq.heading}
            </h2>
          </div>
          <div className={clsx("max-w-3xl", centered && "mx-auto")}>
            {data.faq.items.map((item) => (
              <div key={item.q} className="border-b border-pfBorder py-6 last:border-b-0">
                <h3 className="font-display text-2xl leading-tight text-pfText">{item.q}</h3>
                <p className="mt-3 text-sm leading-7 text-pfSubtle">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {data.references && (
        <section className="px-6 py-20 md:px-10">
          <div className="mx-auto max-w-screen-xl">
            <h2 className="mb-10 font-display text-4xl leading-none text-pfText md:text-6xl">{data.references.heading}</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {data.references.items.map((item) => (
                <article key={item.href} className="pf-card p-7 md:p-9">
                  <h3 className="font-display text-3xl text-pfText">{item.name}</h3>
                  <p className="mt-4 text-sm leading-7 text-pfSubtle">{item.text}</p>
                  <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2">
                    <a href={item.href} className="inline-flex text-sm text-pfAccent underline underline-offset-4">{item.label} ↗</a>
                    {item.internalLink && (
                      <Link href={item.internalLink.href} className="inline-flex text-sm text-pfAccent underline underline-offset-4">
                        {item.internalLink.label}
                      </Link>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {data.related && data.related.items.length > 0 && (
        <section className="border-t border-pfBorder bg-pfSurface/40 px-6 py-14 md:px-10">
          <div className="mx-auto max-w-screen-xl">
            <div className={clsx("flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center", centered && "justify-center")}>
              {data.related.items.map((link) => (
                <Link key={link.href} href={link.href} className={clsx("btn-outline", actionClass)}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <ServiceCTA heading={data.cta.heading} text={data.cta.text} consultationHref={data.consultationHref} compact={centered} />
    </div>
  );
}
