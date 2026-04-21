"use client";

export default function AdminError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <section className="section-pad flex min-h-[60vh] items-center justify-center">
      <div className="pf-card p-8 max-w-md w-full text-center">
        <span className="label-mono block mb-4">Admin Error</span>
        <p className="text-pfSubtle text-sm mb-6">{error.message || "Something went wrong."}</p>
        <button onClick={reset} className="btn-accent justify-center">Try again →</button>
      </div>
    </section>
  );
}
