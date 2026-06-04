interface StatsCardProps {
  label: string;
  value: string;
  color?: "cyan" | "blue" | "yellow" | "red" | "white";
}

const colorMap: Record<NonNullable<StatsCardProps["color"]>, string> = {
  cyan: "text-[#00BFFF]",
  blue: "text-[#3B82F6]",
  yellow: "text-yellow-400",
  red: "text-red-400",
  white: "text-white",
};

export default function StatsCard({ label, value, color = "white" }: StatsCardProps) {
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
      <span className={`text-4xl font-bold tabular-nums ${colorMap[color]}`}>{value}</span>
      <span className="text-xs uppercase tracking-wider text-zinc-500 mt-1">{label}</span>
    </div>
  );
}
