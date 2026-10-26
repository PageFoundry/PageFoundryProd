export const regionalAreaServed = [
  ...["Hückeswagen", "Wipperfürth", "Wermelskirchen", "Remscheid", "Radevormwald"].map(
    (name) => ({ "@type": "City", name })
  ),
  { "@type": "Place", name: "Bergisches Land" },
  { "@type": "Country", name: "Deutschland" },
];

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
    provider: {
      "@type": "Organization",
      name: "PageFoundry",
      url: "https://pagefoundry.de",
    },
    areaServed: regionalAreaServed,
  };
}
