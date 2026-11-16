const BASE_URL = "https://pagefoundry.de";

export const BUSINESS_ID = `${BASE_URL}/#business`;
export const WEBSITE_ID = `${BASE_URL}/#website`;
export const FOUNDER_ID = `${BASE_URL}/#fabian-franke`;

export const businessAddress = {
  "@type": "PostalAddress",
  streetAddress: "Kastanienweg 20a",
  postalCode: "42499",
  addressLocality: "Hückeswagen",
  addressCountry: "DE",
};

export const regionalAreaServed = [
  ...["Hückeswagen", "Wipperfürth", "Wermelskirchen", "Remscheid", "Radevormwald", "Wuppertal"].map(
    (name) => ({ "@type": "City", name })
  ),
  { "@type": "Place", name: "Bergisches Land" },
  { "@type": "Country", name: "Deutschland" },
];

// Same @id as the LocalBusiness on the home page, so search engines merge every
// service provider into one business entity instead of many anonymous ones.
export const businessRef = {
  "@type": "LocalBusiness",
  "@id": BUSINESS_ID,
  name: "PageFoundry",
  url: BASE_URL,
  telephone: "+49 2192 8743999",
  address: businessAddress,
};

type JsonLdProps = { data: Record<string, unknown> };

export default function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

export function getServiceSchema({
  name,
  description,
  url,
}: {
  name: string;
  description: string;
  url: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    description,
    url,
    provider: businessRef,
    areaServed: regionalAreaServed,
  };
}

export type BreadcrumbTrail = { name: string; path: string }[];

/** Trail without the home page; "Start" is always prepended. */
export function getBreadcrumbSchema(trail: BreadcrumbTrail) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "Start", path: "/" }, ...trail].map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.path === "/" ? `${BASE_URL}/` : `${BASE_URL}${item.path}`,
    })),
  };
}

export function getFaqSchema(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

export const WHATSAPP_URL = "https://wa.me/4915167076918";

export function whatsappHref(topic?: string) {
  if (!topic) return WHATSAPP_URL;
  return `${WHATSAPP_URL}?text=${encodeURIComponent(`Hallo Fabian, ich interessiere mich für: ${topic}.`)}`;
}
