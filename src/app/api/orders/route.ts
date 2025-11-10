import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromCookie } from "@/lib/auth";


export async function GET() {
const user = getUserFromCookie();
if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });


const orders = await prisma.order.findMany({
where: { userId: user.sub },
include: { product: true },
orderBy: { createdAt: "desc" },
});
return NextResponse.json(orders);
}


export async function POST(req: NextRequest) {
const user = getUserFromCookie();
if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });


const { productId, stripeSession } = await req.json();
if (!productId) return NextResponse.json({ message: "Missing productId" }, { status: 400 });


const product = await prisma.product.findUnique({ where: { id: productId } });
if (!product) return NextResponse.json({ message: "Invalid product" }, { status: 404 });


const order = await prisma.order.create({
data: { userId: user.sub, productId, stripeSession: stripeSession || null },
});
return NextResponse.json(order);
}