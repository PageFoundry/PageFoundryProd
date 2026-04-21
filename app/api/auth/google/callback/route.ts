import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signJWT, sessionCookieOpts } from "@/lib/auth";

export const dynamic = "force-dynamic";

function externalOrigin(req: NextRequest) {
  const h = req.headers;
  const xfProto = h.get("x-forwarded-proto");
  const xfHost  = h.get("x-forwarded-host");
  const host    = h.get("host");
  if (xfProto && (xfHost || host)) return `${xfProto}://${xfHost ?? host}`;
  return process.env.APP_BASE_URL || new URL(req.url).origin;
}
const b = (v?: string|null) => (v && v.trim().length ? v.trim() : undefined);

export async function GET(req: NextRequest) {
  const origin = externalOrigin(req);
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const err  = url.searchParams.get("error");

  const fail = () => NextResponse.redirect(`${origin}/login?err=oauth_failed`);

  if (err) {
    console.error("GOOGLE_OAUTH_ERROR_PARAM", err, url.searchParams.get("error_description"));
    return fail();
  }
  if (!code) {
    console.error("GOOGLE_OAUTH_NO_CODE");
    return fail();
  }

  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
  const redirectUri = process.env.GOOGLE_REDIRECT_URL || `${origin}/api/auth/google/callback`;

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code, client_id: clientId, client_secret: clientSecret,
        redirect_uri: redirectUri, grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      console.error("GOOGLE_TOKEN_EXCHANGE_FAILED", tokenRes.status, await tokenRes.text().catch(()=>"" ));
      return fail();
    }

    const token = await tokenRes.json() as { access_token: string };

    const uiRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });
    if (!uiRes.ok) {
      console.error("GOOGLE_USERINFO_FAILED", uiRes.status, await uiRes.text().catch(()=>"" ));
      return fail();
    }

    const g = await uiRes.json() as { sub: string; email?: string; name?: string; picture?: string };
    const email = b(g.email);
    if (!email) return fail();

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({ data: { email, passwordHash: "", role: "USER" as any } });
    }
    await prisma.user.update({
      where: { id: user.id },
      data: {
        // @ts-ignore
        provider: "GOOGLE",
        // @ts-ignore
        providerId: g.sub,
        // @ts-ignore
        name: b(g.name) ?? undefined,
        // @ts-ignore
        avatarUrl: b(g.picture) ?? undefined,
      },
    });

    const jwt = signJWT({ sub: user.id, role: user.role });

    const res = NextResponse.redirect(`${origin}/dashboard`);
    const cookieOpts = sessionCookieOpts(30);
    res.cookies.set("pf_session", jwt, cookieOpts);
    res.cookies.set("pf_auth",    jwt, cookieOpts);
    return res;

  } catch (e) {
    console.error("GOOGLE_CALLBACK_UNHANDLED", e);
    return fail();
  }
}
