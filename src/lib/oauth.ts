import { prisma } from "@/lib/prisma";

const GOOGLE_AUTH = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO = "https://www.googleapis.com/oauth2/v3/userinfo";

export function googleAuthUrl(state: string) {
  const p = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    redirect_uri: process.env.GOOGLE_REDIRECT_URL || "",
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    include_granted_scopes: "true",
    prompt: "consent",
    state,
  });
  return `${GOOGLE_AUTH}?${p.toString()}`;
}

export async function exchangeCodeForTokens(code: string) {
  const body = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
    redirect_uri: process.env.GOOGLE_REDIRECT_URL || "",
    grant_type: "authorization_code",
  });
  const r = await fetch(GOOGLE_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!r.ok) throw new Error("token_exchange_failed");
  return r.json() as Promise<{ access_token: string }>;
}

export async function fetchGoogleUser(accessToken: string) {
  const r = await fetch(GOOGLE_USERINFO, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!r.ok) throw new Error("userinfo_failed");
  return r.json() as Promise<{ sub: string; email: string }>;
}

export type GoogleIdentity = { sub: string; email: string; name?: string; picture?: string };

export type GoogleUserResult =
  | { ok: true; user: { id: string; role: string; sessionVersion: number } }
  | { ok: false; error: "account_exists" };

// Ein Google-Login findet sein Konto nur ueber die Google-ID. Existiert die E-Mail
// bereits ohne passende ID (Passwort-Konto oder anderes Google-Konto), wird nicht
// verknuepft: Registrierung und E-Mail-Aenderung sind unbestaetigt, ein Angreifer
// koennte sonst ein Konto mit fremder Adresse vorbereiten und spaeter mitlesen.
export async function resolveGoogleUser(g: GoogleIdentity): Promise<GoogleUserResult> {
  const select = { id: true, role: true, sessionVersion: true } as const;
  const profile = { name: g.name ?? undefined, avatarUrl: g.picture ?? undefined };

  const linked = await prisma.user.findFirst({ where: { provider: "GOOGLE", providerId: g.sub }, select });
  if (linked) {
    await prisma.user.update({ where: { id: linked.id }, data: profile });
    return { ok: true, user: linked };
  }

  const existing = await prisma.user.findUnique({
    where: { email: g.email },
    select: { ...select, provider: true, providerId: true },
  });
  if (existing) {
    // Ein paralleler Request kann das Konto zwischen beiden Abfragen angelegt haben.
    if (existing.provider === "GOOGLE" && existing.providerId === g.sub) {
      return { ok: true, user: { id: existing.id, role: existing.role, sessionVersion: existing.sessionVersion } };
    }
    return { ok: false, error: "account_exists" };
  }

  try {
    const user = await prisma.user.create({
      data: { email: g.email, passwordHash: "", role: "USER", provider: "GOOGLE", providerId: g.sub, ...profile },
      select,
    });
    return { ok: true, user };
  } catch (err: any) {
    // Paralleler Erst-Login mit derselben Google-ID: der andere Request hat das Konto
    // gerade angelegt. Nur dieses Konto gilt, eine fremde E-Mail-Kollision bleibt abgelehnt.
    if (err?.code !== "P2002") throw err;
    const raced = await prisma.user.findFirst({ where: { provider: "GOOGLE", providerId: g.sub }, select });
    return raced ? { ok: true, user: raced } : { ok: false, error: "account_exists" };
  }
}
