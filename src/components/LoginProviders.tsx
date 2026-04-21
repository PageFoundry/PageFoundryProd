"use client";
type Props = { next?: string };
export default function LoginProviders({ next = "/dashboard" }: Props) {
  const href = `/api/auth/google${next ? `?next=${encodeURIComponent(next)}` : ""}`;
  return (
    <a
      href={href}
      className="w-full flex items-center justify-center gap-2 border border-pfBorder bg-pfSurface hover:border-pfBorderMid hover:bg-pfCard transition-colors rounded-sm px-3 py-2.5 font-mono text-xs tracking-widest uppercase text-pfSubtle hover:text-pfText"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      <img src="/icons/google.svg" alt="" className="h-4 w-4 opacity-70" />
      <span>Continue with Google</span>
    </a>
  );
}
