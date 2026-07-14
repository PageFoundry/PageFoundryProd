import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

export const PASSWORD_RESET_TTL_MS = 30 * 60 * 1000;

function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export async function createPasswordResetToken(
  userId: string,
  now: Date = new Date(),
): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(now.getTime() + PASSWORD_RESET_TTL_MS);

  await prisma.$transaction([
    prisma.passwordResetToken.deleteMany({ where: { userId } }),
    prisma.passwordResetToken.create({
      data: { userId, tokenHash: hashToken(token), expiresAt },
    }),
  ]);

  return { token, expiresAt };
}

export async function consumePasswordResetToken(
  token: string,
  passwordHash: string,
  now: Date = new Date(),
): Promise<boolean> {
  if (!token || token.length > 200) return false;
  const tokenHash = hashToken(token);

  return prisma.$transaction(async (tx) => {
    const record = await tx.passwordResetToken.findUnique({
      where: { tokenHash },
      select: { id: true, userId: true, expiresAt: true, usedAt: true },
    });
    if (!record || record.usedAt || record.expiresAt <= now) return false;

    // Der atomare Claim verhindert, dass zwei parallele Requests denselben Token
    // erfolgreich verwenden. Der zweite UPDATE sieht usedAt bereits gesetzt.
    const claimed = await tx.passwordResetToken.updateMany({
      where: { id: record.id, usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
    });
    if (claimed.count !== 1) return false;

    await tx.user.update({
      where: { id: record.userId },
      data: {
        passwordHash,
        sessionVersion: { increment: 1 },
      },
    });
    await tx.passwordResetToken.deleteMany({
      where: { userId: record.userId, id: { not: record.id } },
    });
    return true;
  });
}
