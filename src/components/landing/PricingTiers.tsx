import Image from "next/image";
import clsx from "clsx";

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
  image?: { src: string; alt: string; caption: string };
  centered?: boolean;
}

export default function PricingTiers({ label, heading, tiers, footnote, image, centered = false }: Props) {
  const count = tiers.length + (image ? 1 : 0);
  const cols = count >= 3 ? (centered ? "lg:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-3") : count === 2 ? "sm:grid-cols-2" : "grid-cols-1";

  return (
    <section id="preise" className="bg-pfSurface px-6 py-24 md:px-10">
      <div className="mx-auto max-w-screen-xl">
        <div className={clsx("mb-12", centered ? "mx-auto max-w-4xl text-balance" : "max-w-2xl")}>
          <h2 className="font-display text-5xl leading-none text-pfText md:text-7xl">{heading}</h2>
        </div>

        <div className={`grid gap-px overflow-hidden rounded-3xl bg-pfBorder ${cols}`}>
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={clsx("flex flex-col gap-4 bg-pfSurface p-8", tier.highlight && "ring-1 ring-inset ring-pfBorderAccent", centered && "lg:row-span-3 lg:grid lg:grid-rows-subgrid")}
            >
              <span className={clsx("font-display text-3xl leading-none text-pfText", centered && "text-balance")}>{tier.name}</span>
              <div className={clsx("flex flex-wrap items-baseline gap-2", centered && "justify-center")}>
                <span className={clsx("font-mono text-2xl text-pfAccent", centered ? "tabular-nums" : "font-bold")}>{tier.price}</span>
                {tier.priceNote && (
                  <span className={clsx("text-pfMuted", centered ? "text-sm" : "font-mono text-[0.7rem] uppercase tracking-widest")}>
                    {tier.priceNote}
                  </span>
                )}
              </div>
              <ul className="mt-2 flex flex-col gap-3">
                {tier.features.map((feature) => (
                  <li key={feature} className={clsx("flex gap-3 text-sm leading-7 text-pfSubtle", centered && "justify-center")}>
                    {!centered && <span className="mt-1 shrink-0 font-mono text-pfAccent">/</span>}
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {image && (
            <figure className="flex min-w-0 flex-col bg-pfCard">
              <div className="relative min-h-72 flex-1 overflow-hidden">
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="(min-width: 1280px) 640px, (min-width: 640px) 50vw, 100vw"
                  className="object-cover object-top"
                />
              </div>
              <figcaption className="border-t border-pfBorder px-6 py-4 font-mono text-[0.62rem] leading-6 text-pfMuted">
                {image.caption}
              </figcaption>
            </figure>
          )}
        </div>

        {footnote && (
          <p className={clsx("mt-6 text-pfMuted", centered ? "mx-auto max-w-4xl text-sm leading-7" : "max-w-3xl font-mono text-[0.72rem] leading-6")}>{footnote}</p>
        )}
      </div>
    </section>
  );
}
