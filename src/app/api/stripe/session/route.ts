// src/app/api/stripe/session/route.ts
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { getUserFromCookie } from "@/lib/auth";

const APP_BASE_URL = process.env.APP_BASE_URL || "https://pagefoundry.de";

export async function POST(req: Request) {
  try {
    const me = getUserFromCookie();
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { productId, brief } = await req.json();
    if (!productId) return NextResponse.json({ error: "Missing productId" }, { status: 400 });

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const user = await prisma.user.findUnique({ where: { id: me.sub } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const session = await stripe.checkout.sessions.create({
      mode: product.recurring ? "subscription" : "payment",
      customer_email: user.email,
      line_items: [{
        price_data: {
          currency: "eur",
          product_data: { name: product.name, description: product.description ?? undefined },
          unit_amount: product.priceCents,
          ...(product.recurring ? { recurring: { interval: "month", interval_count: 1 } } : {}),
        },
        quantity: 1,
      }],
      success_url: `${APP_BASE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_BASE_URL}/checkout/cancel`,
      automatic_tax: { enabled: true },
      metadata: {
        productId: product.id,
        userId: user.id,
        // Brief als kompaktes JSON-String speichern
        brief: brief && typeof brief === "object" ? JSON.stringify(brief) : "",
      },
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (err) {
    console.error("stripe/session error", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
