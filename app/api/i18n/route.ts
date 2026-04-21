import { NextResponse } from "next/server";
import { LANG_COOKIE, isLang } from "@/i18n/config";

export async function POST(req: Request) {
  const { lang } = await req.json().catch(() => ({}));
  if (!isLang(lang)) return NextResponse.json({ ok: false }, { status: 400 });

  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: LANG_COOKIE,           // "lang"
    value: lang,
    httpOnly: true,              // Server kann es sicher lesen
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,  // 1 Jahr
    domain: "pagefoundry.de",    // wichtig für Prod
  });
  return res;
}

export const dynamic = "force-dynamic";
