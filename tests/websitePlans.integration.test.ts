import assert from "node:assert/strict";
import test from "node:test";
import { prisma } from "../src/lib/prisma";
import { activateWebsitePlan, billNextWebsiteMonth, confirmWebsitePlanContract, createWebsitePlan, recordWebsitePlanAcceptance } from "../src/lib/websitePlans";
import { generateServiceInvoicePDF } from "../src/lib/invoice";
import { generateAvvPdf, generatePaymentInstructionsPdf, generateSlaPdf } from "../src/lib/websitePlanDocuments";
import { PDFDocument } from "pdf-lib";

test("Vertragsschluss bestimmt Anzahlungsfrist; Abnahme und Go-live erzeugen getrennte Rechnungen", async () => {
  const database = new URL(process.env.DATABASE_URL || "postgresql://invalid/invalid").pathname.slice(1);
  assert.equal(database, "pagefoundry_test");
  const client = await prisma.businessClient.create({ data: { name: `Website-Paket Test ${Date.now()}` } });
  let planId: string | undefined;
  try {
    const plan = await createWebsitePlan({ clientId: client.id, title: "Testwebsite", setupPrice: "790,00", initialMonthly: "99,00", initialMonths: "24", laterMonthly: "49,00" });
    planId = plan.id;
    assert.equal(plan.laterPriceConfirmed, false);
    const deposit = await prisma.invoice.findFirstOrThrow({ where: { websitePlanId: plan.id, websitePlanStage: "DEPOSIT" } });
    assert.equal(deposit.totalCents, 39500);
    assert.equal(deposit.dueDate, null);
    const today = new Date().toISOString().slice(0, 10);
    await assert.rejects(activateWebsitePlan(plan.id, today), /website_plan_contract_date_missing/);
    await confirmWebsitePlanContract(plan.id, today);
    const datedDeposit = await prisma.invoice.findUniqueOrThrow({ where: { id: deposit.id } });
    const expectedDue = new Date(`${today}T00:00:00.000Z`);
    expectedDue.setUTCDate(expectedDue.getUTCDate() + 7);
    assert.equal(datedDeposit.dueDate?.toISOString().slice(0, 10), expectedDue.toISOString().slice(0, 10));
    await assert.rejects(activateWebsitePlan(plan.id, today), /website_plan_deposit_unpaid/);
    await prisma.invoice.update({ where: { id: deposit.id }, data: { status: "PAID", paidAt: new Date() } });
    await recordWebsitePlanAcceptance(plan.id, today);
    const beforeLive = await prisma.invoice.findMany({ where: { websitePlanId: plan.id } });
    assert.equal(beforeLive.length, 2);
    assert.equal(beforeLive.find((invoice) => invoice.websitePlanStage === "FINAL")?.totalCents, 39500);
    assert.equal(beforeLive.find((invoice) => invoice.websitePlanStage === "FINAL")?.dueDate?.toISOString().slice(0, 10), today);
    const live = await activateWebsitePlan(plan.id, today);
    assert.equal(live.billedMonths, 1);
    const invoices = await prisma.invoice.findMany({ where: { websitePlanId: plan.id } });
    assert.equal(invoices.length, 3);
    assert.equal(invoices.find((invoice) => invoice.websitePlanStage === "MONTHLY")?.totalCents, 9900);
    const monthly = await prisma.invoice.findFirstOrThrow({ where: { websitePlanId: plan.id, websitePlanStage: "MONTHLY" }, include: { client: true, items: true, websitePlan: true } });
    const monthlyPdf = await PDFDocument.load(await generateServiceInvoicePDF(monthly));
    assert.equal(monthlyPdf.getPageCount(), 2);
    const documentPlan = await prisma.websitePlan.findUniqueOrThrow({ where: { id: plan.id }, include: { client: true } });
    assert.equal((await PDFDocument.load(await generateSlaPdf(documentPlan))).getPageCount(), 1);
    assert.equal((await PDFDocument.load(await generateAvvPdf(documentPlan))).getPageCount(), 2);
    assert.equal((await PDFDocument.load(await generatePaymentInstructionsPdf(documentPlan))).getPageCount(), 1);
    await assert.rejects(billNextWebsiteMonth(plan.id), /website_plan_month_not_started/);
    await prisma.websitePlan.update({ where: { id: plan.id }, data: { laterPriceConfirmed: false, billedMonths: 24, goLiveDate: new Date("2024-01-01T00:00:00.000Z") } });
    await assert.rejects(billNextWebsiteMonth(plan.id), /website_plan_later_price_unconfirmed/);
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
