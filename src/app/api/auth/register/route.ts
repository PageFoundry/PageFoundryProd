import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendMail } from "@/lib/email";
import { signJWT } from "@/lib/auth";
import { cookies, headers } from "next/headers";
import { LANG_COOKIE, type Lang } from "@/i18n/config";
import { loadMessages, createT } from "@/i18n/translate";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return NextResponse.json({ message:"missing" }, { status:400 });

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return NextResponse.json({ message:"exists" }, { status:409 });

    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, passwordHash: hash, role: "USER" } });

    const store = await cookies();
    const langCookie = store.get(LANG_COOKIE)?.value as Lang | undefined;
    const accept = (await headers()).get("accept-language") || "";
    const lang: Lang = langCookie ?? (accept.toLowerCase().startsWith("de") ? "de" : "en");
    const t = createT(await loadMessages(lang));

    await sendMail({
      to: email,
      subject: t("auth.mail.welcomeSubject"),
      text: t("auth.mail.welcomeText"),
      html: `<p>${t("auth.mail.welcomeText")}</p>`,
    });

    const jwt = signJWT({ sub: user.id, role: user.role });
    const res = NextResponse.json({ id: user.id });
    res.cookies.set("pf_auth", jwt, {
      httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60*60*24*7, domain: "pagefoundry.de"
    });
    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message:"error" }, { status:500 });
  }
}
