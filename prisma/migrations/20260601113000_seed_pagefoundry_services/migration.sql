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
    'service_pf_website',
    'Website Umsetzung',
    'Konzeption, Design und Umsetzung einer professionellen Website.',
    249000,
    1900,
    'ONE_TIME',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'service_pf_redesign',
    'Redesign Sprint',
    'Modernisierung einer bestehenden Website inklusive technischer Basis.',
    149000,
    1900,
    'ONE_TIME',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'service_pf_seo_wartung',
    'SEO und Wartung',
    'Monatliche technische Pflege, Monitoring und SEO-Basisbetreuung.',
    39000,
    1900,
    'RECURRING',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'service_pf_hosting_care',
    'Hosting und Care',
    'Managed Hosting, Updates, Backups und technische Ueberwachung.',
    19000,
    1900,
    'RECURRING',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'service_pf_retell_agent',
    'RetellAI Telefon-Agent Setup',
    'Einrichtung eines KI-Telefon-Agenten mit Termin- und Lead-Pipeline.',
    99000,
    1900,
    'ONE_TIME',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'service_pf_automation',
    'Automatisierung',
    'Workflow-, API- und Backend-Automatisierung fuer operative Prozesse.',
    79000,
    1900,
    'ONE_TIME',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
ON CONFLICT ("name") DO NOTHING;
