import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";
import { createPasswordResetToken, consumePasswordResetToken } from "../src/lib/passwordReset";

const email = `test+password-reset-${Date.now()}@example.com`;
let userId = "";

before(async () => {
  const user = await prisma.user.create({
    data: { email, passwordHash: await bcrypt.hash("OldPassword1!", 4) },
  });
  userId = user.id;
});

after(async () => {
  await prisma.passwordResetToken.deleteMany({ where: { userId } });
  await prisma.user.deleteMany({ where: { id: userId } });
  await prisma.$disconnect();
});

describe("Passwort-Reset-Tokens", () => {
  test("Token ist einmalig und widerruft bestehende Sessions", async () => {
    const { token } = await createPasswordResetToken(userId);
    const nextHash = await bcrypt.hash("NewPassword1!", 4);

    assert.equal(await consumePasswordResetToken(token, nextHash), true);
    assert.equal(await consumePasswordResetToken(token, nextHash), false);

    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    assert.equal(user.sessionVersion, 1);
    assert.equal(await bcrypt.compare("NewPassword1!", user.passwordHash), true);
  });

  test("abgelaufener Token wird abgelehnt", async () => {
    const createdAt = new Date("2026-01-01T00:00:00Z");
    const { token } = await createPasswordResetToken(userId, createdAt);
    const nextHash = await bcrypt.hash("AnotherPassword1!", 4);

    assert.equal(
      await consumePasswordResetToken(token, nextHash, new Date("2026-01-01T01:00:00Z")),
      false,
    );
  });

  test("bei paralleler Verwendung gewinnt genau ein Request", async () => {
    const { token } = await createPasswordResetToken(userId);
    const nextHash = await bcrypt.hash("ParallelPassword1!", 4);
    const results = await Promise.all([
      consumePasswordResetToken(token, nextHash),
      consumePasswordResetToken(token, nextHash),
    ]);
    assert.deepEqual(results.sort(), [false, true]);
  });
});
