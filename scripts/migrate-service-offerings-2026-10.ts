import { PrismaClient } from "@prisma/client";
import { websiteStages, websiteTermsDe } from "../src/lib/websitePricing";
import { legacyProductKeys } from "../src/lib/products";

export async function migratePricing(prisma: PrismaClient) {
  const rows: { name: string; price: number; recurring: boolean; description: string }[] = websiteStages.flatMap((stage) => [
    { name: `${stage.name} — Kauf`, price: stage.purchase, recurring: false, description: `${stage.de}. ${stage.scope}. Übergabepaket inklusive.` },
    { name: `${stage.name} — Einrichtung betreut`, price: stage.setup, recurring: false, description: websiteTermsDe },
    { name: `${stage.name} — Monat 1–24`, price: stage.monthly, recurring: true, description: `${stage.changes} pro Monat. ${websiteTermsDe}` },
    { name: `${stage.name} — ab Monat 25`, price: stage.later, recurring: true, description: `${stage.laterChanges}; mit einem Monat Frist kündbar.` },
  ]);
  rows.push(
    { name: "Betrieb", price: 25, recurring: true, description: "Hosting, Domain, SSL, Backups, Überwachung und Bericht. Änderungen nach Aufwand. Mit einem Monat Frist kündbar." },
    { name: "Website-Wache", price: 49, recurring: true, description: "Externe Uptime-, SSL- und Ladezeitüberwachung, Frühwarnung, Monatsbericht." },
    { name: "Website-Wache Care", price: 99, recurring: true, description: "Website-Wache plus 60 Minuten Kleinfixes pro Monat." },
    { name: "Google-Profil-Paket", price: 149, recurring: false, description: "Unternehmensprofil einrichten oder bereinigen: Kategorien, Leistungen, Fotos, Bewertungslink." },
    { name: "AI-Readiness-Umsetzung", price: 490, recurring: false, description: "llms.txt, ggf. JSON-LD, bis drei belegte technische Befunde, kompakte Informations-/FAQ-Sektion, Live-Prüfung und Abschlussnachweis, eine Korrekturschleife für Umsetzungsfehler. Keine Migration, Zugangsbesorgung, neuen Seiten, umfangreichen Texte oder Bildarbeit; Grenze rund vier Stunden." },
    { name: "KI-Telefonassistenz — Einrichtung", price: 790, recurring: false, description: "Einrichtung nach vereinbartem Umfang." },
    { name: "KI-Telefonassistenz — Monat", price: 249, recurring: true, description: "300 Minuten inklusive, danach 0,45 €/Min." },
    { name: "Individuelle Software", price: 2500, recurring: false, description: "Festpreisprojekte ab 2.500 €, konkreter Umfang im Angebot." },
    { name: "Änderungen — angefangene 15 Minuten", price: 19, recurring: false, description: "Zusätzlicher Aufwand, vorher abgestimmt." },
  );
  await prisma.$transaction(async (tx) => {
    await tx.serviceOffering.updateMany({ where: { name: { notIn: rows.map((r) => r.name) }, isActive: true }, data: { isActive: false } });
    for (const row of rows) {
      const data = { description: row.description, unitPriceCents: row.price * 100, taxRateBps: 0, billingMode: row.recurring ? "RECURRING" as const : "ONE_TIME" as const, isActive: true };
      await tx.serviceOffering.upsert({ where: { name: row.name }, create: { name: row.name, ...data }, update: data });
    }
    await tx.product.updateMany({ where: { OR: [{ id: { in: [...legacyProductKeys] } }, { name: { in: ["Landing Page", "Landing Page Hosting", "All-Inclusive Package", "SEO Basic", "SEO Advanced", "Speed Optimization", "Maintenance Subscription"] } }] }, data: { restricted: true } });
    for (const stage of websiteStages) {
      const data = { name: stage.name, description: `${stage.de}. ${stage.scope}. Beratung und schriftliches Angebot.`, priceCents: stage.purchase * 100, recurring: false, restricted: true };
      await tx.product.upsert({ where: { id: stage.id }, create: { id: stage.id, ...data }, update: data });
    }
  });
  return { activeOfferings: rows.length, websiteProducts: websiteStages.length };
}

if (process.argv[1]?.endsWith("migrate-service-offerings-2026-10.ts")) {
  const prisma = new PrismaClient();
  if (!process.argv.includes("--apply")) throw new Error("Erst pg_dump erstellen, Kopie prüfen, dann --apply verwenden.");
  migratePricing(prisma).then((result) => console.log(JSON.stringify(result))).finally(() => prisma.$disconnect());
}
