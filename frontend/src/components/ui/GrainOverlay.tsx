export function GrainOverlay() {
  return (
    <div className="grain-overlay pointer-events-none fixed inset-0 z-50 opacity-[0.06]" aria-hidden="true">
      <svg width="100%" height="100%">
        <filter id="noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves={3} stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noise)" />
      </svg>
    </div>
  );
}
