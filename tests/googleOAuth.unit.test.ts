import { after, describe, test } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";
import { resolveGoogleUser } from "../src/lib/oauth";

const run = Date.now();
const mail = (name: string) => `test+google-${name}-${run}@example.com`;
const sub = (name: string) => `test-sub-${name}-${run}`;

after(async () => {
  await prisma.user.deleteMany({ where: { email: { startsWith: "test+google-", endsWith: `-${run}@example.com` } } });
  await prisma.$disconnect();
});

describe("Google-Login: Konto-Zuordnung", () => {
  test("legt beim ersten Login ein verknuepftes Konto an und findet es danach ueber die Google-ID", async () => {
    const first = await resolveGoogleUser({ sub: sub("new"), email: mail("new"), name: "Neu" });
    assert.equal(first.ok, true);
    const second = await resolveGoogleUser({ sub: sub("new"), email: mail("new") });
    assert.ok(first.ok && second.ok);
    assert.equal(second.user.id, first.user.id);

    const row = await prisma.user.findUniqueOrThrow({ where: { id: first.user.id } });
    assert.equal(row.provider, "GOOGLE");
    assert.equal(row.providerId, sub("new"));
    assert.equal(row.passwordHash, "");
  });

  test("uebernimmt kein vorab angelegtes Passwort-Konto mit derselben E-Mail", async () => {
    const attacker = await prisma.user.create({
      data: { email: mail("preclaimed"), passwordHash: await bcrypt.hash("Angreifer1!", 4) },
    });

    const result = await resolveGoogleUser({ sub: sub("victim"), email: mail("preclaimed") });
    assert.deepEqual(result, { ok: false, error: "account_exists" });

    const row = await prisma.user.findUniqueOrThrow({ where: { id: attacker.id } });
    assert.equal(row.provider, null);
    assert.equal(row.providerId, null);
  });

  test("lehnt ein Konto ab, das mit einer anderen Google-ID verknuepft ist", async () => {
    await resolveGoogleUser({ sub: sub("owner"), email: mail("taken") });
    const result = await resolveGoogleUser({ sub: sub("intruder"), email: mail("taken") });
    assert.deepEqual(result, { ok: false, error: "account_exists" });
  });

  test("findet ein verknuepftes Konto auch nach geaenderter E-Mail ueber die Google-ID", async () => {
    const created = await resolveGoogleUser({ sub: sub("moved"), email: mail("moved-old") });
    assert.ok(created.ok);
    await prisma.user.update({ where: { id: created.user.id }, data: { email: mail("moved-new") } });

    const again = await resolveGoogleUser({ sub: sub("moved"), email: mail("moved-old") });
    assert.ok(again.ok);
    assert.equal(again.user.id, created.user.id);
  });

  test("paralleler Erst-Login mit derselben Google-ID ergibt genau ein Konto", async () => {
    const results = await Promise.all([
      resolveGoogleUser({ sub: sub("race"), email: mail("race") }),
      resolveGoogleUser({ sub: sub("race"), email: mail("race") }),
    ]);
    const ids = results.map((r) => (r.ok ? r.user.id : null));
    assert.ok(ids.every(Boolean), JSON.stringify(results));
    assert.equal(new Set(ids).size, 1);
    assert.equal(await prisma.user.count({ where: { email: mail("race") } }), 1);
  });
});
