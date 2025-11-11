import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";


const JWT_SECRET = process.env.JWT_SECRET || "DEV_ONLY_CHANGE_ME";


export function middleware(req: NextRequest) {
const { pathname } = req.nextUrl;


const protectedUserRoutes = ["/dashboard", "/settings", "/checkout"]; // prefix for checkout
const adminRoutes = ["/admin"]; // strict


const needsUser = protectedUserRoutes.some((r) =>
pathname === r || pathname.startsWith(r + "/")
);
const needsAdmin = adminRoutes.some((r) => pathname === r || pathname.startsWith(r + "/"));


if (!needsUser && !needsAdmin) {
return NextResponse.next();
}


const token = req.cookies.get("pf_auth")?.value;
if (!token) {
const url = req.nextUrl.clone();
url.pathname = "/login";
return NextResponse.redirect(url);
}


try {
const decoded = jwt.verify(token, JWT_SECRET) as { sub: string; role: string };


if (needsAdmin && decoded.role !== "ADMIN") {
const url = req.nextUrl.clone();
url.pathname = "/dashboard";
return NextResponse.redirect(url);
}


return NextResponse.next();
} catch {
const url = req.nextUrl.clone();
url.pathname = "/login";
return NextResponse.redirect(url);
}
}


export const config = {
matcher: ["/dashboard/:path*", "/settings/:path*", "/checkout/:path*", "/admin/:path*"],
};