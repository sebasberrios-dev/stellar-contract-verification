interface LogoProps {
  variant: "full" | "nav";
  className?: string;
}

const FONT_STACK = "ui-sans-serif, system-ui, -apple-system, sans-serif";

export default function Logo({ variant, className = "" }: LogoProps) {
  return variant === "full" ? (
    <FullLogo className={className} />
  ) : (
    <NavLogo className={className} />
  );
}

function NavLogo({ className }: { className: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg
        width="140"
        height="32"
        viewBox="0 0 140 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <defs>
          <linearGradient id="logo-nav-silver" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="55%" stopColor="#9CA3AF" />
            <stop offset="100%" stopColor="#4B5563" />
          </linearGradient>
          <linearGradient id="logo-nav-cyan" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00FFFF" />
            <stop offset="50%" stopColor="#00BFFF" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>
        </defs>

        {/* Brillo sutil — borde superior de cada letra (capa duplicada desplazada) */}
        <text x="3" y="21" fontFamily={FONT_STACK} fontWeight="800" fontSize="24" letterSpacing="0.5" fill="#FFFFFF" opacity="0.18">
          CSV
        </text>

        {/* Letterforms con gradientes 3D */}
        <text x="3" y="24" fontFamily={FONT_STACK} fontWeight="800" fontSize="24" letterSpacing="0.5">
          <tspan fill="url(#logo-nav-silver)">C</tspan>
          <tspan fill="url(#logo-nav-silver)">S</tspan>
          <tspan fill="url(#logo-nav-cyan)">V</tspan>
        </text>
      </svg>

      <span className="text-white text-[13px] font-medium tracking-wide whitespace-nowrap">
        Contract Source Verify
      </span>
    </div>
  );
}

function FullLogo({ className }: { className: string }) {
  return (
    <svg
      width="480"
      height="480"
      viewBox="0 0 480 480"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient id="logo-full-silver" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="50%" stopColor="#9CA3AF" />
          <stop offset="100%" stopColor="#374151" />
        </linearGradient>
        <linearGradient id="logo-full-cyan" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00FFFF" />
          <stop offset="45%" stopColor="#00BFFF" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id="logo-orbital-stroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#00FFFF" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
        <radialGradient id="logo-ambient-glow" cx="50%" cy="44%" r="48%">
          <stop offset="0%" stopColor="#1D4ED8" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#1D4ED8" stopOpacity="0" />
        </radialGradient>
        <filter id="logo-soft-glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="9" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="logo-dot-glow" x="-300%" y="-300%" width="700%" height="700%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>

      {/* Fondo */}
      <rect width="480" height="480" rx="40" fill="#000000" />

      {/* Glow ambiental azul oscuro detrás del lettermark */}
      <ellipse cx="240" cy="214" rx="200" ry="160" fill="url(#logo-ambient-glow)" />

      {/* Círculo orbital — arco cyan→azul con puntos luminosos en los extremos */}
      <path
        d="M 96 132 A 172 172 0 0 1 384 132"
        fill="none"
        stroke="url(#logo-orbital-stroke)"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.55"
      />
      <circle cx="96" cy="132" r="5" fill="#00FFFF" filter="url(#logo-dot-glow)" />
      <circle cx="96" cy="132" r="2.5" fill="#FFFFFF" />
      <circle cx="384" cy="132" r="4.5" fill="#1D4ED8" filter="url(#logo-dot-glow)" />
      <circle cx="384" cy="132" r="2" fill="#9DC4FF" />

      {/* C — gradiente plateado 3D + brillo superior (capa duplicada) */}
      <text x="78" y="290" fontFamily={FONT_STACK} fontWeight="800" fontSize="176" fill="url(#logo-full-silver)">C</text>
      <text x="78" y="287" fontFamily={FONT_STACK} fontWeight="800" fontSize="176" fill="#FFFFFF" opacity="0.16">C</text>

      {/* Ícono de documento anidado en la apertura de la C */}
      <g transform="translate(118, 206)" opacity="0.95">
        <rect x="0" y="0" width="36" height="46" rx="5" fill="#0a0b0f" stroke="#9CA3AF" strokeOpacity="0.4" strokeWidth="1.5" />
        <line x1="9" y1="14" x2="27" y2="14" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" />
        <line x1="9" y1="22" x2="27" y2="22" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" />
        <path d="M9 31 L16 38 L28 25" stroke="#00BFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>

      {/* S — gradiente plateado 3D + brillo superior */}
      <text x="208" y="290" fontFamily={FONT_STACK} fontWeight="800" fontSize="176" fill="url(#logo-full-silver)">S</text>
      <text x="208" y="287" fontFamily={FONT_STACK} fontWeight="800" fontSize="176" fill="#FFFFFF" opacity="0.16">S</text>

      {/* V — gradiente cyan 3D + glow exterior + borde brillante #00FFFF */}
      <text
        x="318"
        y="290"
        fontFamily={FONT_STACK}
        fontWeight="800"
        fontSize="176"
        fill="url(#logo-full-cyan)"
        stroke="#00FFFF"
        strokeOpacity="0.45"
        strokeWidth="1.5"
        filter="url(#logo-soft-glow)"
      >
        V
      </text>

      {/* Sparkle de 4 puntas — arriba a la derecha de la V */}
      <path
        d="M 410 110 L 414 124 L 428 128 L 414 132 L 410 146 L 406 132 L 392 128 L 406 124 Z"
        fill="#FFFFFF"
      />
      <circle cx="410" cy="128" r="16" fill="#FFFFFF" opacity="0.05" filter="url(#logo-dot-glow)" />

      {/* Wordmark — VERIFY destacado en gradiente cyan */}
      <text
        x="240"
        y="412"
        textAnchor="middle"
        fontFamily={FONT_STACK}
        fontWeight="600"
        fontSize="23"
        letterSpacing="6"
      >
        <tspan fill="#FFFFFF">CONTRACT SOURCE </tspan>
        <tspan fill="url(#logo-full-cyan)">VERIFY</tspan>
      </text>
    </svg>
  );
}
