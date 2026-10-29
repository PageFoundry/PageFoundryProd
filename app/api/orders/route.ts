import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromCookie } from "@/lib/auth";


export async function GET() {
const user = await getUserFromCookie();
if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });


const orders = await prisma.order.findMany({
where: { userId: user.sub },
include: { product: true },
orderBy: { createdAt: "desc" },
});
return NextResponse.json(orders);
}
