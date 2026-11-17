import { MetadataRoute } from "next";

// SEO-Paket vom 2026-11-16: neue Seiten sowie Seiten mit geaenderten Texten, Links oder Metadaten.
const UPDATED_2026_11_16 = new Date("2026-11-16T00:00:00.000Z");
const UPDATED_2026_11_17 = "2026-11-17";
const BASE = "https://pagefoundry.de";
const LAST_UPDATED = new Date("2026-09-14T00:00:00.000Z");

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...["wipperfuerth", "wermelskirchen", "remscheid", "radevormwald", "wuppertal"].map((city) => ({
      url: `${BASE}/webdesign-${city}`,
      lastModified: ["remscheid", "wuppertal"].includes(city) ? UPDATED_2026_11_17 : UPDATED_2026_11_16,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...["website-erstellen-lassen", "website-kosten", "website-mieten", "website-fuer-handwerker", "website-fuer-gastronomie"].map((slug) => ({
      url: `${BASE}/${slug}`,
      lastModified: slug === "website-fuer-gastronomie" ? UPDATED_2026_11_17 : UPDATED_2026_11_16,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    {
      url: `${BASE}/projekte`,
      lastModified: UPDATED_2026_11_16,
      changeFrequency: "yearly",
      priority: 0.6,
    },
    {
      url: BASE,
      lastModified: UPDATED_2026_11_17,
      changeFrequency: "monthly",
      priority: 1.0,
    },
    {
      url: `${BASE}/en`,
      lastModified: UPDATED_2026_11_17,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE}/consultation`,
      lastModified: UPDATED_2026_11_16,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE}/ki-telefonassistenz`,
      lastModified: UPDATED_2026_11_16,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE}/individuelle-software`,
      lastModified: UPDATED_2026_11_16,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE}/website-wache`,
      lastModified: UPDATED_2026_11_17,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE}/website-rettung`,
      lastModified: UPDATED_2026_11_16,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE}/webdesign-bergisches-land`,
      lastModified: UPDATED_2026_11_16,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE}/seo-hueckeswagen`,
      lastModified: UPDATED_2026_11_16,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE}/projekte/carbon-care`,
      lastModified: UPDATED_2026_11_17,
      changeFrequency: "yearly",
      priority: 0.6,
    },
    {
      url: `${BASE}/projekte/the-loft`,
      lastModified: UPDATED_2026_11_17,
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
