import { NextResponse } from "next/server";
import { LANG_COOKIE, isLang } from "@/i18n/config";

export async function POST(req: Request) {
  const { lang } = await req.json().catch(() => ({}));
  if (!isLang(lang)) return NextResponse.json({ ok: false }, { status: 400 });

  const requestUrl = new URL(req.url);
  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: LANG_COOKIE,
    value: lang,
    httpOnly: true,
    secure: requestUrl.protocol === "https:",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}

export const dynamic = "force-dynamic";
