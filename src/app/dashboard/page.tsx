import { prisma } from "@/lib/prisma";
import { getUserFromCookie } from "@/lib/auth";
import StatusBadge from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = getUserFromCookie();
  if (!user) {
    return <div className="p-6 text-center text-red-500">Unauthorized</div>;
  }

  const orders = await prisma.order.findMany({
    where: { userId: user.sub },
    include: { product: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <section className="relative z-10 px-6 py-16 text-white">
      <div className="mx-auto max-w-screen-lg">
        <h1 className="text-2xl font-semibold mb-8">Your Orders</h1>

        {orders.length === 0 && (
          <div className="text-zinc-400 text-sm">No orders yet.</div>
        )}

        <div className="flex flex-col gap-4">
          {orders.map((o: typeof orders[number]) => (
            <div
              key={o.id}
              className="rounded-xl border border-white/10 bg-white/[0.05] p-4 backdrop-blur-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
            >
              <div>
                <div className="text-white font-medium">{o.product.name}</div>
                <div className="text-xs text-zinc-400">
                  {new Date(o.createdAt).toLocaleString()}
                </div>
              </div>
              <StatusBadge status={o.status} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
