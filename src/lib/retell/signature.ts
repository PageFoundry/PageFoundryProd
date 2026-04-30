import crypto from "crypto";

const SIGNATURE_MAX_AGE_MS = 5 * 60 * 1000;

export function getRetellSigningSecret() {
  return process.env.RETELL_WEBHOOK_SECRET || process.env.RETELL_API_KEY || "";
}

export function verifyRetellSignature(rawBody: string, signature: string | null, secret = getRetellSigningSecret()) {
  if (!secret) {
    return true;
  }

  if (!signature) {
    return false;
  }

  const match = signature.match(/^v=(\d+),d=([a-fA-F0-9]+)$/);
  if (!match) {
    return false;
  }

  const timestamp = Number(match[1]);
  if (!Number.isFinite(timestamp) || Math.abs(Date.now() - timestamp) > SIGNATURE_MAX_AGE_MS) {
    return false;
  }

  const expected = crypto.createHmac("sha256", secret).update(`${rawBody}${match[1]}`).digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  const receivedBuffer = Buffer.from(match[2], "hex");

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}
