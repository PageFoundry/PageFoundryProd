import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signJWT } from "@/lib/auth";


export async function POST(req: NextRequest) {
try {
const { email, password } = await req.json();
if (!email || !password) {
return NextResponse.json(
{ message: "Email and password required" },
{ status: 400 }
);
}


const user = await prisma.user.findUnique({ where: { email } });
if (!user) {
return NextResponse.json(
{ message: "Invalid credentials" },
{ status: 401 }
);
}


const ok = await bcrypt.compare(password, user.passwordHash);
if (!ok) {
return NextResponse.json(
{ message: "Invalid credentials" },
{ status: 401 }
);
}


const token = signJWT({ sub: user.id, role: user.role });


const res = NextResponse.json({ id: user.id, role: user.role });
res.cookies.set("pf_auth", token, {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
  domain: "pagefoundry.de",
});
return res;
} catch (err) {
console.error(err);
return NextResponse.json({ message: "Server error" }, { status: 500 });
}
}
