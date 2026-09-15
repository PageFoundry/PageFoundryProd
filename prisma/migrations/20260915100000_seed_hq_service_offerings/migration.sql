INSERT INTO "ServiceOffering" (
  "id",
  "name",
  "description",
  "unitPriceCents",
  "taxRateBps",
  "billingMode",
  "isActive",
  "createdAt",
  "updatedAt"
) VALUES
  (
    'service_pf_speed_optimization',
    'Speed Optimization',
    'Technische Optimierung von Ladezeit und Core Web Vitals.',
    0,
    0,
    'ONE_TIME',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'service_pf_seo',
    'SEO',
    'Technische und inhaltliche Optimierung für bessere Sichtbarkeit in Suchmaschinen.',
    0,
    0,
    'ONE_TIME',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'service_pf_geo',
    'Generative Engine Optimization (GEO)',
    'Optimierung von Inhalten und Website-Struktur für Sichtbarkeit in generativen Such- und Antwortsystemen.',
    0,
    0,
    'ONE_TIME',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'service_pf_cms_surcharge',
    'CMS-Aufpreis (einmalig)',
    'Einrichtung eines Content-Management-Systems zur eigenständigen Pflege von Website-Inhalten.',
    10000,
    0,
    'ONE_TIME',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'service_pf_maintenance',
    'Wartung (Monitoring, Backups & 1 News-Beitrag/Monat)',
    'Monatliche Überwachung, Backups und ein News-Beitrag zur aktiven Pflege der Website.',
    3900,
    0,
    'RECURRING',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
ON CONFLICT ("name") DO NOTHING;
