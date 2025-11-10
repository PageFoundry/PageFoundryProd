// src/app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { generateInvoicePDF } from "@/lib/invoice";
import { sendMail } from "@/lib/email";
import { buildInvoiceMailHTML, buildInvoiceMailText } from "@/lib/mailTemplates";

export const runtime = "nodejs"; // für raw body

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET_DASHBOARD || process.env.STRIPE_WEBHOOK_SECRET_CLI || "";
  if (!sig || !whSecret) return NextResponse.json({ error: "missing signature" }, { status: 400 });

  const raw = Buffer.from(await req.arrayBuffer());

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(raw, sig, whSecret);
  } catch (err) {
    console.error("Webhook signature verify failed", err);
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;

    const productId = session.metadata?.productId as string | undefined;
    const userId = session.metadata?.userId as string | undefined;
    const briefStr = session.metadata?.brief as string | undefined;
    const brief = briefStr ? JSON.parse(briefStr) : undefined;

    if (!productId || !userId) {
      return NextResponse.json({ error: "missing metadata" }, { status: 200 });
    }

    // Duplikate vermeiden: existiert bereits Order mit dieser Session?
    const existing = await prisma.order.findFirst({ where: { stripeSession: session.id } });
    if (existing) return NextResponse.json({ ok: true }, { status: 200 });

    const product = await prisma.product.findUnique({ where: { id: productId } });
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!product || !user) return NextResponse.json({ error: "invalid refs" }, { status: 200 });

    // Order anlegen
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        productId: product.id,
        status: "RECEIVED",
        stripeSession: session.id,
        brief: brief,
      },
    });

    // PDF bauen
    const pdf = await generateInvoicePDF({
      orderId: order.id,
      buyerEmail: user.email,
      productName: product.name,
      priceEuro: (product.priceCents / 100).toFixed(2),
      issuedAt: new Date(),
    });

    // Mail senden
    const html = buildInvoiceMailHTML({
      productName: product.name,
      labelLine: "Amount",
      valueLine: `€${(product.priceCents / 100).toFixed(2)}`,
      invoiceId: order.id,
    });
    const text = buildInvoiceMailText({
      productName: product.name,
      labelLine: "Amount",
      valueLine: `€${(product.priceCents / 100).toFixed(2)}`,
      invoiceId: order.id,
    });

    await sendMail({
      to: user.email,
      subject: "Payment received · Invoice",
      text,
      html,
attachments: [
  {
    filename: `Invoice_${order.id}.pdf`,
    content: pdf,                   // Buffer
    contentType: "application/pdf", // <- Pflichtfeld
  },
],    });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
