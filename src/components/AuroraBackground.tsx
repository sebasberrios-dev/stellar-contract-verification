/**
 * One soft diagonal beam of light over near-black — reference-image style —
 * plus a faint counter-beam for depth. Transform-only keyframes run on the
 * compositor; animation stops under prefers-reduced-motion (static glow
 * remains). A gradient fades the bottom into the page background.
 */
export default function AuroraBackground() {
  return (
    <div
      className="absolute inset-x-0 top-0 h-[640px] overflow-hidden pointer-events-none z-0"
      aria-hidden="true"
    >
      <div className="aurora-beam aurora-beam-1" />
      <div className="aurora-beam aurora-beam-2" />
      {/* Fade into the page background so the beam has no hard edge */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, transparent 45%, hsl(var(--background)) 100%)",
        }}
      />
    </div>
  );
}
