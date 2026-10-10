import assert from "node:assert/strict";
import { chromium } from "playwright";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { writeFile } from "node:fs/promises";

const database = new URL(process.env.DATABASE_URL || "postgresql://invalid/invalid").pathname.slice(1);
assert.equal(database, "pagefoundry_test");
const base = process.env.WEBSITE_PLAN_TEST_URL || "http://127.0.0.1:3100";
const prisma = new PrismaClient();
let browser;
let user;
let client;
let planId;
try {
  user = await prisma.user.create({ data: { email: `website-plan-${Date.now()}@example.invalid`, passwordHash: "test", role: "ADMIN" } });
  client = await prisma.businessClient.create({ data: { name: "Testkunde", companyName: "DF ServiceWerk Browser-Test", billingName: "DF ServiceWerk Browser-Test", billingAddressLine1: "Teststraße 1", postalCode: "09306", city: "Rochlitz" } });
  browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/google-chrome", args: ["--no-sandbox"] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const token = jwt.sign({ sub: user.id, role: "ADMIN", sv: 0 }, process.env.JWT_SECRET, { expiresIn: "1h" });
  await context.addCookies([{ name: "pf_session", value: token, url: base, httpOnly: true, sameSite: "Lax" }]);
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${base}/admin/hq`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Paket anlegen" }).click();
  const drawer = page.locator(".drawer-panel");
  await drawer.getByLabel("Kunde").selectOption(client.id);
  await drawer.getByLabel("Projekt / Website").fill("ServiceWerk Testwebsite");
  await drawer.getByRole("button", { name: "Paket und Anzahlung anlegen" }).click();
  await page.getByText("ServiceWerk Testwebsite", { exact: true }).waitFor();
  const plan = await prisma.websitePlan.findFirstOrThrow({ where: { clientId: client.id } });
  planId = plan.id;
  const deposit = await prisma.invoice.findFirstOrThrow({ where: { websitePlanId: planId, websitePlanStage: "DEPOSIT" } });
  assert.equal(deposit.totalCents, 39500);
  for (const kind of ["sla", "avv", "payment"]) {
    const response = await context.request.get(`${base}/api/admin/hq/website-plans/${planId}/documents/${kind}`);
    assert.equal(response.status(), 200, `${kind}: ${await response.text()}`);
    assert.match(response.headers()["content-type"], /application\/pdf/);
    await writeFile(`/tmp/pagefoundry-${kind}-sample.pdf`, await response.body());
  }
  await prisma.invoice.update({ where: { id: deposit.id }, data: { status: "PAID", paidAt: new Date() } });
  await page.reload({ waitUntil: "networkidle" });
  await page.getByLabel("Go-live-Datum").fill(new Date().toISOString().slice(0, 10));
  await page.getByRole("button", { name: "Go-live abrechnen" }).click();
  await page.getByText("Schlusszahlung:").waitFor();
  const monthly = await prisma.invoice.findFirstOrThrow({ where: { websitePlanId: planId, websitePlanStage: "MONTHLY" } });
  const monthlyResponse = await context.request.get(`${base}/api/admin/hq/invoices/${monthly.id}/pdf`);
  assert.equal(monthlyResponse.status(), 200);
  await writeFile("/tmp/pagefoundry-monthly-sample.pdf", await monthlyResponse.body());
  await page.screenshot({ path: "/tmp/pagefoundry-website-plan-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: "networkidle" });
  await page.screenshot({ path: "/tmp/pagefoundry-website-plan-mobile.png", fullPage: true });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert.ok(overflow <= 1, `horizontal overflow: ${overflow}px`);
  assert.deepEqual(errors, []);
  console.log("Browser smoke passed: HQ package, PDFs, Go-live and mobile layout");
} finally {
  await browser?.close();
  if (planId) {
    const plan = await prisma.websitePlan.findUnique({ where: { id: planId } });
    await prisma.invoice.deleteMany({ where: { websitePlanId: planId } });
    if (plan?.clientServiceId) await prisma.clientService.delete({ where: { id: plan.clientServiceId } });
    await prisma.websitePlan.delete({ where: { id: planId } });
  }
  if (client) await prisma.businessClient.delete({ where: { id: client.id } });
  if (user) await prisma.user.delete({ where: { id: user.id } });
  await prisma.$disconnect();
}
