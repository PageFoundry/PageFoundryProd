import { MetadataRoute } from "next";

const UPDATED_2026_10_26 = new Date("2026-10-26T00:00:00.000Z");
const BASE = "https://pagefoundry.de";
const LAST_UPDATED = new Date("2026-09-14T00:00:00.000Z");
// Nur fuer Seiten, die im SEO-Update vom 2026-09-16 tatsaechlich geaendert bzw. neu angelegt wurden.
const UPDATED_2026_09_16 = new Date("2026-09-16T00:00:00.000Z");

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...["wipperfuerth", "wermelskirchen", "remscheid", "radevormwald"].map((city) => ({
      url: `${BASE}/webdesign-${city}`,
      lastModified: UPDATED_2026_10_26,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    {
      url: BASE,
      lastModified: UPDATED_2026_10_26,
      changeFrequency: "monthly",
      priority: 1.0,
    },
    {
      url: `${BASE}/en`,
      lastModified: UPDATED_2026_09_16,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE}/consultation`,
      lastModified: LAST_UPDATED,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE}/ki-telefonassistenz`,
      lastModified: LAST_UPDATED,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE}/individuelle-software`,
      lastModified: UPDATED_2026_10_26,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE}/website-wache`,
      lastModified: UPDATED_2026_09_16,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE}/website-rettung`,
      lastModified: UPDATED_2026_09_16,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE}/webdesign-bergisches-land`,
      lastModified: UPDATED_2026_10_26,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE}/seo-hueckeswagen`,
      lastModified: LAST_UPDATED,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE}/projekte/carbon-care`,
      lastModified: UPDATED_2026_10_26,
      changeFrequency: "yearly",
      priority: 0.6,
    },
    {
      url: `${BASE}/projekte/the-loft`,
      lastModified: UPDATED_2026_09_16,
      changeFrequency: "yearly",
      priority: 0.6,
    },
    {
      url: `${BASE}/agb`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${BASE}/datenschutz`,
      lastModified: LAST_UPDATED,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${BASE}/impressum`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];
}
