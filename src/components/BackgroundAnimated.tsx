"use client";

export default function BackgroundAnimated() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-pfBg" style={{ transform: "translateZ(0)" }}>
      <div className="absolute inset-0 bg-grid" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.8)_75%)]" />
    </div>
  );
}
