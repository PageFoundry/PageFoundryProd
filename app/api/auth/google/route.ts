import { NextRequest, NextResponse } from "next/server";
import { googleAuthUrl } from "@/lib/oauth";
import { randomBytes } from "crypto";

export const runtime = "nodejs";

function publicOrigin(req: NextRequest) {
  const fwdProto = req.headers.get("x-forwarded-proto");
  const fwdHost  = req.headers.get("x-forwarded-host") || req.headers.get("host");
  if (fwdProto && fwdHost) return `${fwdProto}://${fwdHost}`;
  return process.env.APP_BASE_URL || "https://pagefoundry.de";
}

export async function GET(req: NextRequest) {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_REDIRECT_URL) {
    console.error("GOOGLE_OAUTH_NOT_CONFIGURED: GOOGLE_CLIENT_ID or GOOGLE_REDIRECT_URL missing");
    return NextResponse.redirect(`${publicOrigin(req)}/login?err=oauth_not_configured`);
  }
  const state = randomBytes(16).toString("hex");
  const next = new URL(req.nextUrl).searchParams.get("next") || "/dashboard";
  const res = NextResponse.redirect(googleAuthUrl(state));
  const opts = { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 600 } as const;
  res.cookies.set("pf_oauth_state", state, opts);
  res.cookies.set("pf_oauth_next", next, opts);
  return res;
}
