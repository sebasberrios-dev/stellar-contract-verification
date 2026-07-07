/**
 * Pure-CSS aurora: blurred radial blobs drifting on the compositor thread
 * (transform-only keyframes) with a fade into the page background.
 * Killed entirely under prefers-reduced-motion (static glow remains).
 */
export default function AuroraBackground() {
  return (
    <div
      className="absolute inset-x-0 top-0 h-[560px] overflow-hidden pointer-events-none z-0"
      aria-hidden="true"
    >
      <div className="aurora-blob aurora-blob-1" />
      <div className="aurora-blob aurora-blob-2" />
      <div className="aurora-blob aurora-blob-3" />
      {/* Fade into the page background so the aurora has no hard edge */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, transparent 40%, hsl(var(--background)) 100%)",
        }}
      />
    </div>
  );
}
