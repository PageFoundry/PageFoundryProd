// Client-sicher (kein Prisma-Import): wird auch von app/consultation/page.tsx genutzt.

/** Erlaubtes Format fuer Empfehlungscodes, z. B. "connor" oder "connor-s". */
export const REFERRAL_CODE_RE = /^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])$/;

export function isReferralCode(value: unknown): value is string {
  return typeof value === "string" && REFERRAL_CODE_RE.test(value);
}
