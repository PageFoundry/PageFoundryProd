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
