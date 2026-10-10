import assert from "node:assert/strict";
import test from "node:test";
import { monthStart, monthlyAmount } from "../src/lib/websitePlans";

test("Monatsgrenzen behalten den Go-live-Tag oder nutzen den Monatsletzten", () => {
  const start = new Date("2026-01-31T00:00:00.000Z");
  assert.equal(monthStart(start, 1).toISOString().slice(0, 10), "2026-02-28");
  assert.equal(monthStart(start, 2).toISOString().slice(0, 10), "2026-03-31");
  assert.equal(monthStart(start, 24).toISOString().slice(0, 10), "2028-01-31");
});

test("Website-Paket wechselt erst im 25. Monat von 99 auf 49 Euro", () => {
  const plan = { initialMonthlyCents: 9900, initialMonths: 24, laterMonthlyCents: 4900 };
  assert.equal(monthlyAmount(plan, 1), 9900);
  assert.equal(monthlyAmount(plan, 24), 9900);
  assert.equal(monthlyAmount(plan, 25), 4900);
});
