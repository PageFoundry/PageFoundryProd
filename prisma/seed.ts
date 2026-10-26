import { PrismaClient } from "@prisma/client";
import { websiteStages } from "../src/lib/websitePricing";
import { legacyProductKeys } from "../src/lib/products";
const prisma = new PrismaClient();
async function main() {
  await prisma.product.updateMany({ where: { id: { in: [...legacyProductKeys] } }, data: { restricted: true } });
  for (const stage of websiteStages) {
    const data = { name: stage.name, description: stage.de + ". " + stage.scope, priceCents: stage.purchase * 100, recurring: false, restricted: true };
    await prisma.product.upsert({ where: { id: stage.id }, create: { id: stage.id, ...data }, update: data });
  }
  for (const id of ["free_consultation", "request_offer"]) {
    await prisma.product.upsert({ where: { id }, update: {}, create: { id, name: id === "free_consultation" ? "Free Consultation" : "Request Offer", description: "Persönliche Beratung und schriftliches Angebot.", priceCents: 0, restricted: id !== "free_consultation" } });
  }
}
main().finally(() => prisma.$disconnect());
