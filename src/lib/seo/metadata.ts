import type { Metadata } from "next";

export const BASE_URL = "https://pagefoundry.de";

const DEFAULT_OG_IMAGE = { url: "/PAGEfoundry.png", alt: "PageFoundry" };

type PageMetadataInput = {
  /** Path starting with "/", e.g. "/agb". */
  path: string;
  title: string;
  description: string;
  /** Locale of the content actually rendered for this request. */
  locale: "de_DE" | "en_US";
  robots?: Metadata["robots"];
};

/**
 * Builds a full, self-contained Metadata object for a static/leaf route.
 * Root layout metadata (openGraph, alternates, twitter) is NOT deep-merged
 * by Next.js, so any of these keys defined here fully replaces the root's —
 * this factory re-declares all of them to avoid silently dropping siteName,
 * images, or Twitter card data.
 *
 * No `alternates.languages` (hreflang) here: the site serves one URL per
 * path with the language picked at request time (cookie/Accept-Language),
 * not separate localized URLs — declaring hreflang would be inaccurate.
 */
export function createPageMetadata({
  path,
  title,
  description,
  locale,
  robots,
}: PageMetadataInput): Metadata {
  const url = `${BASE_URL}${path}`;
  const alternateLocale = locale === "de_DE" ? "en_US" : "de_DE";
  const ogTitle = `${title} · PageFoundry`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: "PageFoundry",
      title: ogTitle,
      description,
      url,
      locale,
      alternateLocale: [alternateLocale],
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
      site: "@pagefoundry",
      images: [DEFAULT_OG_IMAGE.url],
    },
    ...(robots ? { robots } : {}),
  };
}
