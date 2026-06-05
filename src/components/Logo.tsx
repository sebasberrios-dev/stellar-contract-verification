export default function Logo() {
  return (
    <div className="flex items-center gap-2">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        {/* hexágono */}
        <path
          d="M12 2 L20.66 7 L20.66 17 L12 22 L3.34 17 L3.34 7 Z"
          stroke="#3b82f6"
          strokeWidth="1.5"
          fill="none"
          strokeLinejoin="round"
        />
        {/* checkmark */}
        <path
          d="M8 12 L11 15 L16 9"
          stroke="#3b82f6"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-lg font-bold tracking-tight">
        <span className="text-white">CSV</span>
        <span className="text-zinc-400">Stellar</span>
      </span>
    </div>
  );
}
