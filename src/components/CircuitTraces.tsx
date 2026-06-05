export default function CircuitTraces() {
  return (
    <svg
      className="fixed inset-0 w-full h-full z-0 pointer-events-none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ opacity: 0.06 }}
    >
      <g stroke="#60a5fa" strokeWidth="1" fill="none">
        {/* Líneas horizontales */}
        <line x1="0" y1="15%" x2="100%" y2="15%" />
        <line x1="0" y1="35%" x2="100%" y2="35%" />
        <line x1="0" y1="55%" x2="100%" y2="55%" />
        <line x1="0" y1="75%" x2="100%" y2="75%" />

        {/* Líneas verticales */}
        <line x1="10%" y1="0" x2="10%" y2="100%" />
        <line x1="30%" y1="0" x2="30%" y2="100%" />
        <line x1="50%" y1="0" x2="50%" y2="100%" />
        <line x1="70%" y1="0" x2="70%" y2="100%" />
        <line x1="90%" y1="0" x2="90%" y2="100%" />

        {/* Nodos en intersecciones */}
        <circle cx="10%" cy="15%" r="3" fill="#60a5fa" stroke="none" />
        <circle cx="30%" cy="35%" r="3" fill="#60a5fa" stroke="none" />
        <circle cx="50%" cy="15%" r="3" fill="#60a5fa" stroke="none" />
        <circle cx="70%" cy="55%" r="3" fill="#60a5fa" stroke="none" />
        <circle cx="90%" cy="35%" r="3" fill="#60a5fa" stroke="none" />
        <circle cx="10%" cy="75%" r="3" fill="#60a5fa" stroke="none" />
        <circle cx="50%" cy="55%" r="3" fill="#60a5fa" stroke="none" />
        <circle cx="70%" cy="75%" r="3" fill="#60a5fa" stroke="none" />
        <circle cx="30%" cy="75%" r="3" fill="#60a5fa" stroke="none" />
        <circle cx="90%" cy="55%" r="2" fill="#60a5fa" stroke="none" />

        {/* Trazados de circuito (L-shapes) */}
        <polyline points="10%,15% 20%,15% 20%,35% 30%,35%" />
        <polyline points="50%,15% 60%,15% 60%,35% 70%,35%" />
        <polyline points="30%,75% 40%,75% 40%,55% 50%,55%" />
        <polyline points="70%,55% 80%,55% 80%,75% 90%,75%" />
      </g>
    </svg>
  );
}
