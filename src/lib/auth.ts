import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "DEV_ONLY_CHANGE_ME";

/** Cookie-Optionen – domain nur setzen wenn explizit konfiguriert (prod). */
export function sessionCookieOpts(maxAgeDays = 7) {
  const opts: Record<string, unknown> = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * maxAgeDays,
  };
  const domain = process.env.COOKIE_DOMAIN;
  if (domain) opts.domain = domain;
  return opts as {
    httpOnly: boolean; secure: boolean; sameSite: "lax";
    path: string; maxAge: number; domain?: string;
  };
}

export type Role = "ADMIN" | "USER";
export type JwtPayload = { sub: string; role: Role; sv: number };

export function signJWT(payload: JwtPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

async function getCookiesStore(): Promise<any> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require("next/headers");
  return await mod.cookies();
}

export async function getUserFromCookie(): Promise<JwtPayload | null> {
  try {
    const store = await getCookiesStore();
    const raw =
      store.get("pf_session")?.value ||
      store.get("session")?.value || // Fallback, falls alt
      null;
    if (!raw) return null;
    const payload = jwt.verify(raw, JWT_SECRET) as Partial<JwtPayload>;
    if (!payload.sub) return null;

    // sessionVersion macht Passwort-Reset und explizite Session-Widerrufe wirksam.
    // Ein Reset erhoeht den Wert in der DB; alle vorher ausgestellten JWTs sind
    // danach sofort ungueltig, auch wenn ihre Ablaufzeit noch nicht erreicht ist.
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { role: true, sessionVersion: true },
    });
    const tokenSessionVersion = typeof payload.sv === "number" ? payload.sv : 0;
    if (!user || user.sessionVersion !== tokenSessionVersion) return null;
    return { sub: payload.sub, role: user.role as Role, sv: user.sessionVersion };
  } catch {
    return null;
  }
}

export async function requireAdmin(): Promise<JwtPayload> {
  const user = await getUserFromCookie();
  if (!user || user.role !== "ADMIN") throw new Error("FORBIDDEN");
  return user;
}
