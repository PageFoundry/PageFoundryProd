import { after, NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/email";
import { createPasswordResetToken } from "@/lib/passwordReset";
import { clientIpFromForwardedFor } from "@/lib/clientIp";

const requestSchema = z.object({
  email: z.string().trim().email().max(320),
});

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const MAX_BUCKETS = 1000;
const buckets = new Map<string, { count: number; resetAt: number }>();

function clientIp(req: NextRequest): string {
  return clientIpFromForwardedFor(req.headers.get("x-forwarded-for"));
}

function allowAttempt(key: string, now = Date.now()): boolean {
  if (buckets.size > MAX_BUCKETS) {
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(bucketKey);
    }
  }
  const current = buckets.get(key);
  if (!current && buckets.size >= MAX_BUCKETS) return false;
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (current.count >= MAX_ATTEMPTS) return false;
  current.count += 1;
  return true;
}

const genericResponse = () =>
  NextResponse.json({ ok: true, message: "If the account exists, an email has been sent." });

export async function POST(req: NextRequest) {
  const parsed = requestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return genericResponse();

  const email = parsed.data.email.toLowerCase();
  const key = `${clientIp(req)}:${email}`;
  if (!allowAttempt(key)) return genericResponse();

  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true, email: true, passwordHash: true },
  });

  // Versand und Token-Erzeugung laufen nach der Response. So bleiben Antwortcode und
  // SMTP-Latenz unabhaengig davon, ob ein lokales Konto existiert.
  if (user?.passwordHash) {
    after(async () => {
      try {
        const { token } = await createPasswordResetToken(user.id);
        const baseUrl = (process.env.APP_BASE_URL || "https://pagefoundry.de").replace(/\/$/, "");
        const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;
        const text = `Du hast ein neues Passwort für dein PageFoundry-Konto angefordert.\n\n${resetUrl}\n\nDer Link ist 30 Minuten gültig. Falls du die Anfrage nicht gestellt hast, ignoriere diese E-Mail.`;
        await sendMail({
          to: user.email,
          subject: "PageFoundry · Passwort zurücksetzen",
          text,
          html: `<p>Du hast ein neues Passwort für dein PageFoundry-Konto angefordert.</p><p><a href="${resetUrl}">Passwort zurücksetzen</a></p><p>Der Link ist 30 Minuten gültig. Falls du die Anfrage nicht gestellt hast, ignoriere diese E-Mail.</p>`,
        });
      } catch (error) {
        console.error("PASSWORD_RESET_DISPATCH_FAILED", error);
      }
    });
  }

  return genericResponse();
}
