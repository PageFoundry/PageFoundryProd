import { prisma } from "@/lib/prisma";
import { getUserFromCookie } from "@/lib/auth";
import { notFound } from "next/navigation";
import CheckoutBriefForm from "@/components/CheckoutBriefForm";

export const dynamic = "force-dynamic";

export default async function CheckoutPage(props: any) {
  const productId = props?.params?.productId as string | undefined;

  const user = getUserFromCookie();
  if (!user) {
    return (
      <section className="relative z-10 flex min-h-[70vh] items-center justify-center px-6 py-16 text-white">
        <div className="text-center text-red-500">Unauthorized</div>
      </section>
    );
  }

  if (!productId) notFound();

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) notFound();

  const monthly = product.recurring;

  return (
    <section className="relative z-10 px-6 py-16 text-white">
      <div className="mx-auto w-full max-w-lg rounded-2xl border border-white/10 bg-white/[0.05] p-6 shadow-card backdrop-blur-sm">
        <h1 className="text-xl font-semibold text-white mb-4">Checkout</h1>

        <div className="text-white text-lg font-medium leading-tight">
          {product.name}
        </div>
        <div className="text-sm text-zinc-400 leading-relaxed mt-2">
          {product.description}
        </div>

        <div className="mt-6 text-white text-base font-medium">
          {monthly ? (
            <>
              <div>Recurring service</div>
              <div className="text-zinc-400 text-sm">{product.recurringInfo}</div>
            </>
          ) : (
            <>
              <div>One-time price</div>
              <div className="text-zinc-400 text-sm">€{(product.priceCents / 100).toFixed(2)}</div>
            </>
          )}
        </div>

        <CheckoutBriefForm productId={product.id} />

        <div className="mt-4 text-[10px] text-zinc-600">Secure checkout powered by Stripe.</div>
      </div>
    </section>
  );
}
