import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const products = [
    {
      id: "landing_page",
      name: "Landing Page",
      description:
        "A high-performing, modern, and aesthetic landing page optimized for maximum conversion.",
      priceCents: 49900,
      recurring: false,
      recurringInfo: null,
      restricted: true,
    },
    {
      id: "landing_page_hosting",
      name: "Landing Page Hosting",
      description:
        "We host your existing landing page. Choose with or without domain management.",
      priceCents: 1900,
      recurring: true,
      recurringInfo: "from €19/month",
      restricted: true,
    },
    {
      id: "all_inclusive",
      name: "All-Inclusive Package",
      description:
        "Landing Page, Hosting, Domain, Basic SEO & Google Indexing – all included.",
      priceCents: 79900,
      recurring: false,
      recurringInfo: null,
      restricted: true,
    },
    {
      id: "seo_basic",
      name: "SEO Basic",
      description:
        "Technical and content-based optimization for better visibility in search engines.",
      priceCents: 19900,
      recurring: false,
      recurringInfo: null,
      restricted: true,
    },
    {
      id: "seo_advanced",
      name: "SEO Advanced",
      description:
        "Advanced SEO analysis, keyword strategy & long-term performance optimization.",
      priceCents: 49900,
      recurring: false,
      recurringInfo: null,
      restricted: true,
    },
    {
      id: "speed_opt",
      name: "Speed Optimization",
      description:
        "Boost your website speed for optimal user experience and top Google rankings.",
      priceCents: 14900,
      recurring: false,
      recurringInfo: null,
      restricted: true,
    },
    {
      id: "maintenance",
      name: "Maintenance Subscription",
      description:
        "Monthly maintenance, backups, security updates & continuous performance checks.",
      priceCents: 3900,
      recurring: true,
      recurringInfo: "from €39/month",
      restricted: true,
    },
    {
      id: "request_offer",
      name: "Request Offer",
      description:
        "Custom scope or bundle. Ideal for unique requirements.",
      priceCents: 0,
      recurring: false,
      recurringInfo: "On request",
      restricted: true,
    },
    {
      id: "free_consultation",
      name: "Free Consultation",
      description:
        "Talk to us. Get clarity on strategy, timelines, and budget.",
      priceCents: 0,
      recurring: false,
      recurringInfo: "Schedule a call",
      restricted: false,
    },
  ];

  // Produkte einfüllen / aktualisieren
  for (const p of products) {
    await prisma.product.upsert({
      where: { id: p.id },
      update: {
        name: p.name,
        description: p.description,
        priceCents: p.priceCents,
        recurring: p.recurring,
        recurringInfo: p.recurringInfo,
        restricted: p.restricted,
      },
      create: p,
    });
  }

  // Admin-User
  const hash = await bcrypt.hash("admin123", 10);

  await prisma.user.upsert({
    where: { email: "admin@pagefoundry.local" },
    update: {},
    create: {
      email: "admin@pagefoundry.local",
      phone: "+491234567890",
      passwordHash: hash,
      role: "ADMIN",
    },
  });

  console.log("Seed done");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
