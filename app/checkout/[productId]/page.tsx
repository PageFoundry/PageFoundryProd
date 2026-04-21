import { getServerI18n } from "@/i18n/server";
import { prisma } from "@/lib/prisma";
import { getUserFromCookie } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import CheckoutBriefForm from "@/components/CheckoutBriefForm";
import type { ProductKey } from "@/lib/products";

export const dynamic = "force-dynamic";

const nameToKey: Record<string, ProductKey> = {
  "Landing Page": "landing_page",
  "Landing Page Hosting": "landing_page_hosting",
  "All-Inclusive Package": "all_inclusive",
  "SEO Basic": "seo_basic",
  "SEO Advanced": "seo_advanced",
  "Speed Optimization": "speed_opt",
  "Maintenance Subscription": "maintenance",
  "Request Offer": "request_offer",
  "Free Consultation": "free_consultation",
};

const keyToName: Record<ProductKey, string> = {
  landing_page: "Landing Page",
  landing_page_hosting: "Landing Page Hosting",
  all_inclusive: "All-Inclusive Package",
  seo_basic: "SEO Basic",
  seo_advanced: "SEO Advanced",
  speed_opt: "Speed Optimization",
  maintenance: "Maintenance Subscription",
  request_offer: "Request Offer",
  free_consultation: "Free Consultation",
};

export default async function CheckoutPage(props: any) {
  const { t } = await getServerI18n();
  const slug = props?.params?.productId as string | undefined;

  const user = await getUserFromCookie();
  if (!user) redirect(`/login?next=/checkout/${props?.params?.productId}`);

  if (!slug) notFound();

  let product = await prisma.product.findUnique({ where: { id: slug } });
  let key: ProductKey | undefined = product ? nameToKey[product.name] : undefined;

  if (!product || !key) {
    const maybeKey = slug as ProductKey;
    const nameFromKey = keyToName[maybeKey];
    if (nameFromKey) {
      const byName = await prisma.product.findFirst({ where: { name: nameFromKey } });
      if (byName) {
        product = byName;
        key = maybeKey;
      }
    }
  }

  if (!product || !key) notFound();

  const localizedTitle = t(`products.${key}.title`);
  const localizedDesc = t(`products.${key}.desc`);

  return (
    <section className="section-pad">
      <div className="max-w-screen-xl mx-auto fade-in">

        {/* Header */}
        <div className="border-b border-pfBorder pb-8 mb-12">
          <span className="label-mono block mb-4">Secure Checkout</span>
          <h1
            className="leading-none text-pfText"
            style={{
              fontFamily: "var(--font-display), Impact, sans-serif",
              fontSize: "clamp(3rem, 7vw, 5rem)",
            }}
          >
            {t("checkout.title")}
          </h1>
        </div>

        <div className="max-w-lg mx-auto">
          <div className="pf-card p-6">
            {/* Product info */}
            <div className="mb-6 pb-6 border-b border-pfBorder">
              <span className="label-mono block mb-2">Product</span>
              <div
                className="text-pfText text-lg font-medium leading-tight"
                style={{ fontFamily: "var(--font-display), Impact, sans-serif" }}
              >
                {localizedTitle}
              </div>
              <div className="text-sm text-pfSubtle leading-relaxed mt-2">
                {localizedDesc}
              </div>
            </div>

            <CheckoutBriefForm productId={product.id} productKey={key} />

            <p className="mt-6 text-[0.6rem] text-pfMuted font-mono tracking-widest uppercase">
              {t("checkout.secure")}
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
