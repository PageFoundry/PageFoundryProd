import Link from "next/link";
import PricingTiers, { type PricingTier } from "./PricingTiers";
import ServiceCTA from "./ServiceCTA";

export interface ServiceLandingData {
  eyebrow: string;
  heroHeading: string;
  heroSubline: string;
  problem: { label: string; heading: string; points: string[] };
  steps: { label: string; heading: string; items: { title: string; text: string }[] };
  included: { label: string; heading: string; items: string[]; note?: string };
  pricing: { label: string; heading: string; tiers: PricingTier[]; footnote?: string };
  faq: { label: string; heading: string; items: { q: string; a: string }[] };
  cta: { heading: string; text: string };
}

export default function ServiceLanding({ data }: { data: ServiceLandingData }) {
  return (
    <div lang="de" className="relative z-10 text-pfText">
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-20 pt-32 md:px-10 md:pt-36">
        <div className="mx-auto max-w-screen-xl">
          <span className="label-mono mb-8 block">{data.eyebrow}</span>
          <h1 className="max-w-4xl font-display text-5xl leading-[0.9] tracking-wide text-pfText md:text-7xl">
            {data.heroHeading}
          </h1>
          <div className="my-8 h-px w-28 bg-gradient-to-r from-pfAccent to-transparent" />
          <p className="max-w-2xl text-base leading-8 text-pfSubtle md:text-lg">{data.heroSubline}</p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link href="/consultation" className="btn-accent">
              Kostenlose Beratung buchen →
            </Link>
            <a href="tel:+4921928743999" className="btn-outline">
              02192 8743999
            </a>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="px-6 py-20 md:px-10">
        <div className="mx-auto max-w-screen-xl">
          <div className="mb-10 max-w-2xl">
            <span className="label-mono mb-5 block">{data.problem.label}</span>
            <h2 className="font-display text-4xl leading-none text-pfText md:text-6xl">
              {data.problem.heading}
            </h2>
          </div>
          <div className="max-w-3xl">
            {data.problem.points.map((point, index) => (
              <div key={point} className="flex gap-5 border-b border-pfBorder py-5 last:border-b-0">
                <span className="mt-1 shrink-0 font-mono text-[0.62rem] tracking-widest text-pfAccent">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="text-sm leading-7 text-pfSubtle md:text-base">{point}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="bg-pfSurface px-6 py-24 md:px-10">
        <div className="mx-auto max-w-screen-xl">
          <div className="mb-12 max-w-2xl">
            <span className="label-mono mb-5 block">{data.steps.label}</span>
            <h2 className="font-display text-5xl leading-none text-pfText md:text-7xl">
              {data.steps.heading}
            </h2>
          </div>
          <div className="grid gap-px overflow-hidden rounded-3xl bg-pfBorder sm:grid-cols-2 lg:grid-cols-3">
            {data.steps.items.map((step, index) => (
              <article key={step.title} className="min-h-56 bg-pfSurface p-8">
                <div className="font-display text-7xl leading-none text-pfAccentDim">
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
          <div className="mb-10 max-w-2xl">
            <span className="label-mono mb-5 block">{data.included.label}</span>
            <h2 className="font-display text-4xl leading-none text-pfText md:text-6xl">
              {data.included.heading}
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {data.included.items.map((item) => (
              <div key={item} className="pf-card flex gap-3 p-5">
                <span className="mt-1 shrink-0 font-mono text-pfAccent">+</span>
                <span className="text-sm leading-7 text-pfSubtle">{item}</span>
              </div>
            ))}
          </div>
          {data.included.note && (
            <p className="mt-6 max-w-3xl font-mono text-[0.72rem] leading-6 text-pfMuted">
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
      />

      {/* FAQ */}
      <section className="px-6 py-24 md:px-10">
        <div className="mx-auto max-w-screen-xl">
          <div className="mb-12 max-w-2xl">
            <span className="label-mono mb-5 block">{data.faq.label}</span>
            <h2 className="font-display text-5xl leading-none text-pfText md:text-7xl">
              {data.faq.heading}
            </h2>
          </div>
          <div className="max-w-3xl">
            {data.faq.items.map((item) => (
              <div key={item.q} className="border-b border-pfBorder py-6 last:border-b-0">
                <h3 className="font-display text-2xl leading-tight text-pfText">{item.q}</h3>
                <p className="mt-3 text-sm leading-7 text-pfSubtle">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ServiceCTA heading={data.cta.heading} text={data.cta.text} />
    </div>
  );
}
