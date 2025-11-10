// /src/app/api/auth/register/route.ts

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signJwt } from "@/lib/jwt";
import { sendMail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email, password, phone } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Missing fields" },
        { status: 400 }
      );
    }

    // 1. User schon vorhanden?
    const exists = await prisma.user.findUnique({
      where: { email },
    });
    if (exists) {
      return NextResponse.json(
        { message: "User exists" },
        { status: 409 }
      );
    }

    // 2. Passwort hashen
    const hashed = await bcrypt.hash(password, 10);

    // 3. User anlegen (achte auf passwordHash statt password)
    const user = await prisma.user.create({
      data: {
        email,
        phone,
        passwordHash: hashed,
        role: "USER",
      },
    });

    // 4. JWT bauen
    const token = signJwt({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    // 5. Cookie setzen
    const res = NextResponse.json({ success: true });

res.cookies.set("pf_auth", token, {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  path: "/",
  maxAge: 7 * 24 * 60 * 60,
  domain: "pagefoundry.de",
});

    // 6. Willkommensmail senden (HTML mit Logo)
    try {
      await sendMail({
        to: user.email,
        subject: "Willkommen bei PageFoundry",
        text:
          `Willkommen bei PageFoundry.\n\n` +
          `Dein Account wurde erstellt.\n\n` +
          `Du kannst dich jederzeit unter https://pagefoundry.de/dashboard anmelden.`,
        html: `
  <div style="background-color:#0f0f10;padding:24px;color:#fff;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;line-height:1.5;">
    <div style="max-width:480px;margin:0 auto;border:1px solid #2a2a2a;border-radius:16px;background-color:#1a1a1a;padding:24px;">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="display:inline-block;background-color:#ff7518;border-radius:12px;padding:12px 16px;font-weight:600;font-size:14px;color:#000;">
          PageFoundry
        </div>
      </div>

      <h1 style="font-size:18px;font-weight:600;margin:0 0 16px 0;color:#fff;">
        Willkommen bei PageFoundry
      </h1>

      <p style="font-size:14px;color:#d1d1d1;margin:0 0 16px 0;">
        Dein Account wurde erstellt. Ab jetzt bekommst du alles zentral in deinem Dashboard.
      </p>

      <div style="background-color:#0f0f10;border:1px solid #2a2a2a;border-radius:12px;padding:16px;margin-bottom:20px;">
        <div style="font-size:13px;color:#9ca3af;line-height:1.4;">
          <div><span style="color:#fff;">E-Mail:</span> ${user.email}</div>
          ${
            phone
              ? `<div><span style="color:#fff;">Telefon:</span> ${phone}</div>`
              : ""
          }
          <div style="margin-top:12px;color:#9ca3af;font-size:12px;">
            Bewahre diese Daten vertraulich auf.
          </div>
        </div>
      </div>

      <a
        href="https://pagefoundry.de/dashboard"
        style="display:block;text-align:center;text-decoration:none;background-color:#ff7518;color:#000;font-weight:600;font-size:14px;padding:12px 16px;border-radius:999px;"
      >
        Zum Dashboard
      </a>

      <p style="font-size:12px;color:#565656;margin-top:24px;text-align:center;line-height:1.4;">
        Diese E-Mail wurde automatisch generiert. Wenn du das nicht warst bitte antworte auf diese Mail.
      </p>
    </div>

    <div style="max-width:480px;margin:16px auto 0 auto;text-align:center;color:#3f3f46;font-size:11px;line-height:1.4;">
      © ${new Date().getFullYear()} PageFoundry
    </div>
  </div>
        `,
      });
    } catch (mailErr) {
      console.error("register sendMail failed", mailErr);
    }

    return res;
  } catch (err) {
    console.error("Register error", err);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}
