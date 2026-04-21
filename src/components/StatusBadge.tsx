export default function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    RECEIVED:    "border-pfBorderMid text-pfSubtle bg-pfSurface",
    IN_PROGRESS: "border-pfBorderAccent text-pfAccent bg-pfAccentDim",
    DONE:        "border-green-500/30 text-green-400 bg-green-500/[0.07]",
  };

  const labels: Record<string, string> = {
    RECEIVED:    "Received",
    IN_PROGRESS: "In Progress",
    DONE:        "Done",
  };

  return (
    <span
      className={`status-badge ${styles[status] ?? "border-pfBorder text-pfMuted bg-pfCard"}`}
      style={{ fontFamily: "var(--font-mono)" }}
    >
      {labels[status] ?? status}
    </span>
  );
}
