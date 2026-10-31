import assert from "node:assert/strict";
import { test } from "node:test";
import { buildLeadUpdate, commissionFor, createLeadSchema, LeadPermissionError, normalizeEmail, normalizeHost } from "../src/lib/sales/leads";
import { isReferralCode } from "../src/lib/sales/referral";

const sales = { sub: "s1", role: "SALES" as const };
const admin = { sub: "a1", role: "ADMIN" as const };
const lead = (status: any, ownerId = "s1") => ({ ownerId, status, commissionPercentAtWin: null });

test("normalizeHost vereinheitlicht Websites fuer den Lead-Schutz", () => {
  assert.equal(normalizeHost("https://www.Firma.de/kontakt?x=1"), "firma.de");
  assert.equal(normalizeHost("firma.de"), "firma.de");
  assert.equal(normalizeHost("WWW.firma.de."), "firma.de");
  assert.equal(normalizeHost("http://shop.firma.de"), "shop.firma.de");
  assert.equal(normalizeHost("localhost"), null);
  assert.equal(normalizeHost("ftp://firma.de"), null);
  assert.equal(normalizeHost(""), null);
  assert.equal(normalizeEmail("  Info@Firma.DE "), "info@firma.de");
});

test("createLeadSchema verlangt Firma und Website oder E-Mail", () => {
  assert.equal(createLeadSchema.safeParse({ companyName: "X" }).success, false);
  assert.equal(createLeadSchema.safeParse({ companyName: "X", website: "kein host" }).success, false);
  assert.equal(createLeadSchema.safeParse({ companyName: "X", email: "kaputt" }).success, false);
  assert.equal(createLeadSchema.safeParse({ companyName: "X", website: "firma.de" }).success, true);
  assert.equal(createLeadSchema.safeParse({ companyName: "X", email: "a@b.de", website: "" }).success, true);
});

test("SALES darf nur eigene offene Leads bis OFFER bewegen", () => {
  assert.deepEqual(buildLeadUpdate(sales, lead("NEW"), { status: "MEETING" }, 20), { status: "MEETING" });
  const deny = (fn: () => unknown, code: string) =>
    assert.throws(fn, (e: unknown) => e instanceof LeadPermissionError && e.message === code);
  deny(() => buildLeadUpdate(sales, lead("NEW"), { status: "WON" }, 20), "STATUS_ADMIN_ONLY");
  deny(() => buildLeadUpdate(sales, lead("NEW"), { status: "LOST" }, 20), "STATUS_ADMIN_ONLY");
  deny(() => buildLeadUpdate(sales, lead("WON"), { status: "NEW" }, 20), "LEAD_CLOSED");
  deny(() => buildLeadUpdate(sales, lead("LOST"), { notes: "x" }, 20), "LEAD_CLOSED");
  deny(() => buildLeadUpdate(sales, lead("NEW", "other"), { notes: "x" }, 20), "NOT_FOUND");
  deny(() => buildLeadUpdate(sales, lead("OFFER"), { oneTimeValueCents: 100 }, 20), "VALUES_ADMIN_ONLY");
  deny(() => buildLeadUpdate({ sub: "u", role: "USER" }, lead("NEW", "u"), { notes: "x" }, 20), "NOT_FOUND");
});

test("ADMIN-Abschluss friert den Provisionssatz ein, Wiedereroeffnen loescht ihn", () => {
  const now = new Date("2026-10-31T12:00:00Z");
  const won = buildLeadUpdate(admin, lead("OFFER"), { status: "WON", oneTimeValueCents: 79000, monthlyValueCents: 4900 }, 20, now);
  assert.deepEqual(won, { status: "WON", wonAt: now, commissionPercentAtWin: 20, oneTimeValueCents: 79000, monthlyValueCents: 4900 });
  const reopened = buildLeadUpdate(admin, { ownerId: "s1", status: "WON", commissionPercentAtWin: 20 }, { status: "OFFER" }, 25);
  assert.deepEqual(reopened, { status: "OFFER", wonAt: null, commissionPercentAtWin: null });
});

test("Provision: Prozent auf Einmalbetrag und jede Monatsrate", () => {
  assert.deepEqual(
    commissionFor({ status: "WON", oneTimeValueCents: 139000, monthlyValueCents: 7900, commissionPercentAtWin: 20 }),
    { oneTimeCents: 27800, monthlyCents: 1580 }
  );
  assert.equal(commissionFor({ status: "OFFER", oneTimeValueCents: 1, monthlyValueCents: 1, commissionPercentAtWin: 20 }), null);
  assert.equal(commissionFor({ status: "WON", oneTimeValueCents: 1, monthlyValueCents: 1, commissionPercentAtWin: null }), null);
});

test("Referral-Code-Format", () => {
  for (const ok of ["connor", "connor-s", "abc", "c2"]) assert.equal(isReferralCode(ok), ok.length >= 3, ok);
  for (const bad of ["", "ab", "-connor", "connor-", "Connor", "con nor", "a".repeat(33), 42]) assert.equal(isReferralCode(bad), false, String(bad));
});
