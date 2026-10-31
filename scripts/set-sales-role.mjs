#!/usr/bin/env node
// Macht einen bereits registrierten User zum Vertriebler (Rolle SALES).
//
//   node scripts/set-sales-role.mjs <email> <referralCode> [commissionPercent]
//   node scripts/set-sales-role.mjs connor.schulz@pagefoundry.de connor 20
//
// Laedt bewusst die Projekt-.env (Prod-DB). Fuer Tests DATABASE_URL vorher setzen.
// Regeln: User muss existieren, darf kein ADMIN sein (keine stille Herabstufung),
// Referral-Code ist unveraenderlich, sobald gesetzt.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
if (!process.env.DATABASE_URL) {
  for (const line of readFileSync(join(root, ".env"), "utf8").split("\n")) {
    const m = line.match(/^\s*DATABASE_URL\s*=\s*"?([^"\n]*)"?\s*$/);
    if (m) process.env.DATABASE_URL = m[1];
  }
}

const [emailArg, code, pctArg = "20"] = process.argv.slice(2);
const CODE_RE = /^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])$/; // = src/lib/sales/referral.ts
const fail = (msg) => { console.error(`FEHLER: ${msg}`); process.exit(1); };

if (!emailArg || !code) fail("Aufruf: node scripts/set-sales-role.mjs <email> <referralCode> [commissionPercent]");
if (!CODE_RE.test(code)) fail(`Referral-Code '${code}' ungueltig (a-z, 0-9, '-', 3-32 Zeichen)`);
const pct = Number(pctArg);
if (!Number.isInteger(pct) || pct < 0 || pct > 100) fail("commissionPercent muss eine ganze Zahl 0-100 sein");

const prisma = new PrismaClient();
try {
  const email = emailArg.trim().toLowerCase();
  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true, email: true, role: true, referralCode: true },
  });
  if (!user) fail(`Kein User mit E-Mail ${email}. Erst registrieren lassen.`);
  if (user.role === "ADMIN") fail(`${user.email} ist ADMIN – wird nicht herabgestuft.`);
  if (user.referralCode && user.referralCode !== code) {
    fail(`${user.email} hat bereits den Code '${user.referralCode}' (unveraenderlich).`);
  }
  const taken = await prisma.user.findFirst({ where: { referralCode: code, NOT: { id: user.id } }, select: { id: true } });
  if (taken) fail(`Referral-Code '${code}' ist bereits vergeben.`);

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { role: "SALES", referralCode: code, commissionPercent: pct },
    select: { email: true, role: true, referralCode: true, commissionPercent: true },
  });
  console.log(`OK: ${updated.email} -> ${updated.role}, Code '${updated.referralCode}', ${updated.commissionPercent} %`);
  console.log(`Empfehlungslink: https://pagefoundry.de/consultation?ref=${updated.referralCode}`);
} finally {
  await prisma.$disconnect();
}
