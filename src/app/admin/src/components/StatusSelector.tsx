"use client";

type Status = "RECEIVED" | "IN_PROGRESS" | "DONE";

export default function StatusSelector({
  value,
  onChange,
  disabled = false,
}: {
  value: Status;
  onChange: (s: Status) => void;
  disabled?: boolean;
}) {
  return (
    <select
      className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-sm text-white"
      value={value}
      onChange={(e) => onChange(e.target.value as Status)}
      disabled={disabled}
    >
      <option value="RECEIVED">Received</option>
      <option value="IN_PROGRESS">In progress</option>
      <option value="DONE">Done</option>
    </select>
  );
}
