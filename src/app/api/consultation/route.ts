import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromCookie } from "@/lib/auth";


// User submits request for Free Consultation. We store it so admin can call them.


export async function POST(req: NextRequest) {
const body = await req.json();
const { name, phone, note, preferredTime } = body || {};


if (!name || !phone || !preferredTime) {
return NextResponse.json({ message: "Missing fields" }, { status: 400 });
}


const caller = getUserFromCookie();


const saved = await prisma.consultationRequest.create({
data: {
userId: caller ? caller.sub : null,
name,
phone,
note: note || "",
preferredTime,
},
});


// todo: optional notify via Discord webhook or email provider here


return NextResponse.json({ ok: true, id: saved.id });
}