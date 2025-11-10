// /src/lib/jwt.ts

import jwt, { SignOptions, Secret } from "jsonwebtoken";

const SECRET: Secret = process.env.JWT_SECRET || "dev_secret_fallback";

// Hilfsfunktion damit TS "7d" als gültig für expiresIn akzeptiert
function makeSignOptions(expiresIn: string): SignOptions {
  return { expiresIn: expiresIn as unknown as SignOptions["expiresIn"] };
}

export function signJwt(
  payload: object,
  expiresIn: string = "7d"
): string {
  const opts = makeSignOptions(expiresIn);
  return jwt.sign(payload, SECRET, opts);
}

export function verifyJwt<T>(token: string): T | null {
  try {
    return jwt.verify(token, SECRET) as T;
  } catch {
    return null;
  }
}
