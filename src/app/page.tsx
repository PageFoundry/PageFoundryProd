import PackageCard from "@/components/PackageCard";
import { productOrderKeys } from "@/lib/products";
import { getServerI18n } from "@/i18n/server";

export default async function LandingPage() {
  const { t } = await getServerI18n();

  return (
    <section className="relative z-10 px-6 py-16 text-white">
      <div className="mx-auto flex max-w-screen-xl flex-col gap-16">

        <div className="fade-in flex flex-col items-start gap-8 text-left md:max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-pfOrange/40 bg-pfOrange/10 px-3 py-1 text-[10px] font-semibold text-pfOrange">
            {t("hero.badge")}
          </div>
          <h1 className="text-3xl font-semibold leading-[1.1] text-white md:text-5xl">
            {t("hero.h1")}
          </h1>
          <p className="text-base text-zinc-400 md:text-lg leading-relaxed">
            {t("hero.sub")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 text-sm font-semibold">
            <a href="/consultation" className="rounded-full bg-pfOrange px-5 py-3 text-black hover:brightness-110">
              {t("hero.ctaFree")}
            </a>
            <a href="#packages" className="rounded-full border border-white/20 bg-white/5 px-5 py-3 text-white hover:bg-white/10">
              {t("hero.ctaSee")}
            </a>
          </div>
        </div>

        <div id="packages" className="fade-in grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {productOrderKeys.map((id) => (
            <PackageCard key={id} id={id} />
          ))}
        </div>

      </div>
    </section>
  );
}
