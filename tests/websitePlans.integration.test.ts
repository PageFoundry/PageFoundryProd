import assert from "node:assert/strict";
import test from "node:test";
import { prisma } from "../src/lib/prisma";
import { activateWebsitePlan, billNextWebsiteMonth, createWebsitePlan } from "../src/lib/websitePlans";
import { generateServiceInvoicePDF } from "../src/lib/invoice";
import { generateAvvPdf, generatePaymentInstructionsPdf, generateSlaPdf } from "../src/lib/websitePlanDocuments";
import { PDFDocument } from "pdf-lib";

test("Anzahlung sperrt Go-live; nach Zahlung entstehen Schluss- und erste Monatsrechnung", async () => {
  const database = new URL(process.env.DATABASE_URL || "postgresql://invalid/invalid").pathname.slice(1);
  assert.equal(database, "pagefoundry_test");
  const client = await prisma.businessClient.create({ data: { name: `Website-Paket Test ${Date.now()}` } });
  let planId: string | undefined;
  try {
    const plan = await createWebsitePlan({ clientId: client.id, title: "Testwebsite", setupPrice: "790,00", initialMonthly: "99,00", initialMonths: "24", laterMonthly: "49,00" });
    planId = plan.id;
    const deposit = await prisma.invoice.findFirstOrThrow({ where: { websitePlanId: plan.id, websitePlanStage: "DEPOSIT" } });
    assert.equal(deposit.totalCents, 39500);
    await assert.rejects(activateWebsitePlan(plan.id, new Date().toISOString().slice(0, 10)), /website_plan_deposit_unpaid/);
    await prisma.invoice.update({ where: { id: deposit.id }, data: { status: "PAID", paidAt: new Date() } });
    const live = await activateWebsitePlan(plan.id, new Date().toISOString().slice(0, 10));
    assert.equal(live.billedMonths, 1);
    const invoices = await prisma.invoice.findMany({ where: { websitePlanId: plan.id } });
    assert.equal(invoices.length, 3);
    assert.equal(invoices.find((invoice) => invoice.websitePlanStage === "FINAL")?.totalCents, 39500);
    assert.equal(invoices.find((invoice) => invoice.websitePlanStage === "MONTHLY")?.totalCents, 9900);
    const monthly = await prisma.invoice.findFirstOrThrow({ where: { websitePlanId: plan.id, websitePlanStage: "MONTHLY" }, include: { client: true, items: true, websitePlan: true } });
    const monthlyPdf = await PDFDocument.load(await generateServiceInvoicePDF(monthly));
    assert.equal(monthlyPdf.getPageCount(), 2);
    const documentPlan = await prisma.websitePlan.findUniqueOrThrow({ where: { id: plan.id }, include: { client: true } });
    assert.equal((await PDFDocument.load(await generateSlaPdf(documentPlan))).getPageCount(), 1);
    assert.equal((await PDFDocument.load(await generateAvvPdf(documentPlan))).getPageCount(), 2);
    assert.equal((await PDFDocument.load(await generatePaymentInstructionsPdf(documentPlan))).getPageCount(), 1);
    await assert.rejects(billNextWebsiteMonth(plan.id), /website_plan_month_not_started/);
  } finally {
    if (planId) {
      const plan = await prisma.websitePlan.findUnique({ where: { id: planId } });
      await prisma.invoice.deleteMany({ where: { websitePlanId: planId } });
      if (plan?.clientServiceId) await prisma.clientService.delete({ where: { id: plan.clientServiceId } });
      await prisma.websitePlan.delete({ where: { id: planId } });
    }
    await prisma.businessClient.delete({ where: { id: client.id } });
  }
});
