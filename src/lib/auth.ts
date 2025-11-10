import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "DEV_ONLY_CHANGE_ME";

export type Role = "ADMIN" | "USER";
export type JwtPayload = { sub: string; role: Role };

export function signJWT(payload: JwtPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

// Next.js cookies() dynamisch laden (Server Runtime)
function getCookiesStore(): any {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require("next/headers");
  return mod.cookies();
}

export function getUserFromCookie(): JwtPayload | null {
  try {
    const store = getCookiesStore();
    const raw = store.get("pf_auth")?.value;
    if (!raw) return null;
    return jwt.verify(raw, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export async function requireAdmin(): Promise<JwtPayload> {
  const user = getUserFromCookie();
  if (!user || user.role !== "ADMIN") {
    throw new Error("FORBIDDEN");
  }
  return user;
}
