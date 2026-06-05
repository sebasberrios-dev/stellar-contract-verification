export default function ShieldLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {/* Glow detrás */}
      <div
        className="absolute inset-0 rounded-full blur-xl opacity-40"
        style={{ background: "radial-gradient(circle, #3B82F6 0%, transparent 70%)" }}
      />
      <svg
        width="56"
        height="64"
        viewBox="0 0 56 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="shield-gradient" x1="0" y1="0" x2="56" y2="64" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#60A5FA" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>
        </defs>
        {/* Escudo */}
        <path
          d="M28 2L4 12V32C4 46.4 14.8 59.6 28 63C41.2 59.6 52 46.4 52 32V12L28 2Z"
          fill="url(#shield-gradient)"
          stroke="#3B82F6"
          strokeWidth="1"
          strokeOpacity="0.4"
        />
        {/* Checkmark animado */}
        <path
          d="M16 32L24 40L40 24"
          stroke="#22C55E"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            strokeDasharray: 30,
            strokeDashoffset: 0,
            animation: "check-draw 0.6s ease-out forwards",
          }}
        />
        <style>{`
          @keyframes check-draw {
            from { stroke-dashoffset: 30; }
            to { stroke-dashoffset: 0; }
          }
        `}</style>
      </svg>
    </div>
  );
}
