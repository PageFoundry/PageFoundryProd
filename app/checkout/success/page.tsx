import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Order Confirmed · PageFoundry",
  robots: "noindex",
};

export default function CheckoutSuccessPage() {
  return (
    <section className="section-pad flex flex-col items-center justify-center min-h-[70vh]">
      <div className="pf-card p-10 text-center max-w-md w-full fade-in">
        <span
          className="block text-pfAccent mb-6"
          style={{ fontSize: "2.5rem", lineHeight: 1 }}
        >
          ◈
        </span>
        <h1
          className="leading-none text-pfText mb-4"
          style={{
            fontFamily: "var(--font-display), Impact, sans-serif",
            fontSize: "clamp(2.5rem, 7vw, 4rem)",
          }}
        >
          Payment Successful
        </h1>
        <p className="text-pfSubtle text-sm font-mono">
          Thank you. Your payment has been processed and your order is confirmed.
        </p>
        <a
          href="/dashboard"
          className="btn-accent mt-8 justify-center"
        >
          View Dashboard →
        </a>
      </div>
    </section>
  );
}
