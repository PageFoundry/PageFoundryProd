import Image from "next/image";
import Link from "next/link";
import ServiceCTA from "./ServiceCTA";

export interface ProjectCaseStudyData {
  eyebrow: string;
  heading: string;
  subline: string;
  domain: string;
  url: string;
  visitLabel: string;
  image: string;
  imageAlt: string;
  imageAspectRatio?: string;
  situation: { label: string; heading: string; text: string };
  task: { label: string; heading: string; text: string };
  implementation: { label: string; heading: string; points: string[] };
  result: { label: string; heading: string; text: string; evidenceSource: string };
  scopeNote?: string;
  cta: { heading: string; text: string };
  related?: { label: string; items: { label: string; href: string }[] };
}

export default function ProjectCaseStudy({ data }: { data: ProjectCaseStudyData }) {
  return (
    <div lang="de" className="relative z-10 text-pfText">
      <section className="relative overflow-hidden px-6 pb-16 pt-32 md:px-10 md:pt-36">
        <div className="mx-auto max-w-screen-xl">
          <span className="label-mono mb-8 block">{data.eyebrow}</span>
          <h1 className="max-w-4xl font-display text-5xl leading-[0.9] tracking-wide text-pfText md:text-7xl">
            {data.heading}
          </h1>
          <div className="my-8 h-px w-28 bg-gradient-to-r from-pfAccent to-transparent" />
          <p className="max-w-2xl text-base leading-8 text-pfSubtle md:text-lg">{data.subline}</p>
        </div>
      </section>

      <section className="px-6 pb-16 md:px-10">
        <div className="mx-auto max-w-screen-xl">
          <div className="overflow-hidden border border-pfBorder bg-pfCard shadow-card">
            <div className="flex h-11 items-center gap-2 border-b border-pfBorder bg-black px-4" aria-hidden="true">
              <span className="h-2 w-2 rounded-full bg-[#ff5f57]" />
              <span className="h-2 w-2 rounded-full bg-[#febc2e]" />
              <span className="h-2 w-2 rounded-full bg-[#28c840]" />
              <span className="ml-3 truncate font-mono text-[0.58rem] uppercase tracking-[0.18em] text-pfMuted">
                {data.domain}
              </span>
            </div>
            <div
              className={data.imageAspectRatio
                ? "relative overflow-hidden bg-pfSurface"
                : "relative aspect-[3/2] overflow-hidden bg-pfSurface lg:aspect-auto lg:min-h-[36rem]"}
              style={data.imageAspectRatio ? { aspectRatio: data.imageAspectRatio } : undefined}
            >
              <Image
                src={data.image}
                alt={data.imageAlt}
                fill
                sizes="(min-width: 1024px) 80vw, 100vw"
                className={data.imageAspectRatio ? "object-contain" : "object-cover object-top"}
              />
            </div>
          </div>
          <a href={data.url} target="_blank" rel="noreferrer" className="btn-outline mt-6 inline-flex">
            {data.visitLabel} ↗
          </a>
        </div>
      </section>

      <section className="border-t border-pfBorder bg-pfSurface/40 px-6 py-16 md:px-10 md:py-20">
        <div className="mx-auto grid max-w-screen-xl gap-10 lg:grid-cols-2">
          <div>
            <span className="label-mono mb-4 block">{data.situation.label}</span>
            <h2 className="font-display text-3xl leading-none text-pfText md:text-4xl">{data.situation.heading}</h2>
            <p className="mt-4 text-sm leading-7 text-pfSubtle md:text-base">{data.situation.text}</p>
          </div>
          <div>
            <span className="label-mono mb-4 block">{data.task.label}</span>
            <h2 className="font-display text-3xl leading-none text-pfText md:text-4xl">{data.task.heading}</h2>
            <p className="mt-4 text-sm leading-7 text-pfSubtle md:text-base">{data.task.text}</p>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 md:px-10 md:py-20">
        <div className="mx-auto max-w-screen-xl">
          <span className="label-mono mb-4 block">{data.implementation.label}</span>
          <h2 className="mb-8 font-display text-4xl leading-none text-pfText md:text-6xl">
            {data.implementation.heading}
          </h2>
          <div className="max-w-3xl">
            {data.implementation.points.map((point, index) => (
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

      <section className="border-t border-pfBorder bg-pfSurface px-6 py-16 md:px-10 md:py-20">
        <div className="mx-auto max-w-screen-xl">
          <div className="overflow-hidden border border-pfBorder bg-pfSurface max-w-3xl">
            <div className="flex items-center justify-between gap-4 border-b border-pfBorder px-4 py-3 md:px-5">
              <p className="font-mono text-[0.58rem] uppercase tracking-[0.18em] text-pfAccent">{data.result.label}</p>
              <p className="text-right font-mono text-[0.5rem] uppercase tracking-[0.14em] text-pfMuted">
                {data.result.evidenceSource}
              </p>
            </div>
            <div className="p-5 md:p-6">
              <h2 className="font-display text-2xl leading-tight text-pfText md:text-3xl">{data.result.heading}</h2>
              <p className="mt-4 text-sm leading-7 text-pfSubtle md:text-base">{data.result.text}</p>
            </div>
          </div>
          {data.scopeNote && (
            <p className="mt-6 max-w-3xl font-mono text-[0.72rem] leading-6 text-pfMuted">{data.scopeNote}</p>
          )}
        </div>
      </section>

      {data.related && data.related.items.length > 0 && (
        <section className="border-t border-pfBorder bg-pfSurface/40 px-6 py-14 md:px-10">
          <div className="mx-auto max-w-screen-xl">
            <span className="label-mono mb-5 block">{data.related.label}</span>
            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
              {data.related.items.map((link) => (
                <Link key={link.href} href={link.href} className="btn-outline">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <ServiceCTA heading={data.cta.heading} text={data.cta.text} />
    </div>
  );
}
