import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";

export interface PricingTier {
  name: string;
  price: string;
  priceNote?: string;
  highlight?: boolean;
  description?: string;
  features: string[];
  cta?: { label: string; href: string };
  alternative?: { price: string; note: string; href: string };
}

interface Props {
  label: string;
  heading: string;
  tiers: PricingTier[];
  footnote?: string;
  image?: { src: string; alt: string; caption: string };
  centered?: boolean;
}

function OfferCard({ tier }: { tier: PricingTier }) {
  return (
    <article
      className={clsx(
        "flex min-w-0 flex-col gap-6 border bg-pfCard p-6 text-center transition-colors hover:bg-pfCardHover md:p-8 lg:row-span-3 lg:grid lg:grid-rows-subgrid",
        tier.highlight ? "border-pfAccent/70" : "border-pfBorderMid",
      )}
    >
      <div>
        <h3 className="text-balance font-display text-4xl leading-none text-pfText">{tier.name}</h3>
        {tier.description && <p className="mt-4 text-base leading-7 text-pfSubtle">{tier.description}</p>}
      </div>
      <div className="text-pfAccent">
        <p className="font-display text-6xl leading-none tabular-nums">{tier.price}</p>
        {tier.priceNote && <p className="mt-2 text-sm text-pfSubtle">{tier.priceNote}</p>}
      </div>
      <div className="flex flex-1 flex-col gap-6">
        <ul className="space-y-4 border-t border-pfBorder pt-6 text-sm leading-7 text-pfSubtle">
          {tier.features.map((feature) => <li key={feature}>{feature}</li>)}
        </ul>
        <div className="mt-auto flex flex-col gap-6">
          {tier.alternative && (
            <div className="border-t border-pfBorder pt-6">
              <p className="text-sm text-pfText">Alternativ betreut</p>
              <p className="mt-2 text-base text-pfAccent">{tier.alternative.price}</p>
              <p className="mt-3 text-xs leading-6 text-pfSubtle">{tier.alternative.note}</p>
              <Link href={tier.alternative.href} prefetch={false} className="mt-3 inline-flex min-h-11 items-center justify-center text-sm text-pfAccent underline underline-offset-4 transition-colors hover:text-pfText">
                Betreuung besprechen →
              </Link>
            </div>
          )}
          {tier.cta && (
            <Link
              href={tier.cta.href}
              prefetch={false}
              className={clsx(tier.highlight ? "btn-accent" : "btn-outline", "!min-h-12 !w-full !rounded-lg !px-4 !py-3 !font-sans !text-sm !font-medium !normal-case !tracking-normal !transition-colors")}
            >
              {tier.cta.label} →
            </Link>
          )}
        </div>
      </div>
    </article>
  );
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

        <div className={clsx("grid", cols, centered ? "gap-5" : "gap-px overflow-hidden rounded-3xl bg-pfBorder")}>
          {tiers.map((tier) => centered ? <OfferCard key={tier.name} tier={tier} /> : (
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
