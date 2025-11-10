export default function StatusBadge({ status }: { status: string }) {
const map: Record<string, string> = {
RECEIVED: "bg-yellow-500/20 text-yellow-300",
IN_PROGRESS: "bg-pfOrange/20 text-pfOrange",
DONE: "bg-green-500/20 text-green-400",
};
return (
<span
className={`text-xs font-semibold px-3 py-1 rounded-full ${
map[status] || "bg-zinc-600/20 text-zinc-300"
}`}
>
{status}
</span>
);
}