interface NetworkBarProps {
  name: string;
  coverage: number;
  color: "green" | "cyan" | "yellow";
}

const colorMap: Record<NetworkBarProps["color"], { bar: string; text: string }> = {
  green: { bar: "bg-green-500", text: "text-green-400" },
  cyan: { bar: "bg-[#00BFFF]", text: "text-[#00BFFF]" },
  yellow: { bar: "bg-yellow-400", text: "text-yellow-400" },
};

export default function NetworkBar({ name, coverage, color }: NetworkBarProps) {
  const { bar, text } = colorMap[color];

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center text-sm mb-1">
        <span className="text-slate-300 font-medium">{name}</span>
        <span className={`font-bold tabular-nums ${text}`}>{coverage}%</span>
      </div>
      <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all duration-700 ${bar}`}
          style={{ width: `${coverage}%` }}
        />
      </div>
    </div>
  );
}
