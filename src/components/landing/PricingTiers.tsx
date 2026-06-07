export interface PricingTier {
  name: string;
  price: string;
  priceNote?: string;
  highlight?: boolean;
  features: string[];
}

interface Props {
  label: string;
  heading: string;
  tiers: PricingTier[];
  footnote?: string;
}

export default function PricingTiers({ label, heading, tiers, footnote }: Props) {
  const cols = tiers.length >= 3 ? "lg:grid-cols-3" : "lg:grid-cols-2";

  return (
    <section id="preise" className="bg-pfSurface px-6 py-24 md:px-10">
      <div className="mx-auto max-w-screen-xl">
        <div className="mb-12 max-w-2xl">
          <span className="label-mono mb-5 block">{label}</span>
          <h2 className="font-display text-5xl leading-none text-pfText md:text-7xl">{heading}</h2>
        </div>

        <div className={`grid gap-px overflow-hidden rounded-3xl bg-pfBorder sm:grid-cols-2 ${cols}`}>
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`flex flex-col gap-4 bg-pfSurface p-8 ${
                tier.highlight ? "ring-1 ring-inset ring-pfBorderAccent" : ""
              }`}
            >
              <span className="font-display text-3xl leading-none text-pfText">{tier.name}</span>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-2xl font-bold text-pfAccent">{tier.price}</span>
                {tier.priceNote && (
                  <span className="font-mono text-[0.7rem] uppercase tracking-widest text-pfMuted">
                    {tier.priceNote}
                  </span>
                )}
              </div>
              <ul className="mt-2 flex flex-col gap-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex gap-3 text-sm leading-7 text-pfSubtle">
                    <span className="mt-1 shrink-0 font-mono text-pfAccent">/</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {footnote && (
          <p className="mt-6 max-w-3xl font-mono text-[0.72rem] leading-6 text-pfMuted">{footnote}</p>
        )}
      </div>
    </section>
  );
}
