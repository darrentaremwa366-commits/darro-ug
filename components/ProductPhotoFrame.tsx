import type { ReactNode } from "react";

interface ProductPhotoFrameProps {
  children: ReactNode;
  className?: string;
  /** Intensity of warm-tone grading overlay (0 = off, 1 = max). Default 0.6. */
  warmth?: number;
  /** If true, hides the bottom Darro banner. Default true for small cards. */
  hideBanner?: boolean;
}

/**
 * A reusable wrapper that makes every product photo look visually consistent,
 * even when the original backgrounds differ (grey tile, brown tile, studio, etc).
 *
 * Effects:
 *  - Warm-tone CSS filter (saturate + sepia tint) so Japan's grey bg and others
 *    all harmonize to the Darro bone/brown palette.
 *  - Subtle vignette (dark corners) so the mannequin/jersey feels centered.
 *  - Bottom linear-gradient banner tint so card bottoms look uniform when
 *    mixed across different backdrops.
 *  - Optional tiny "DARRO" wordmark banner for premium feel.
 */
export default function ProductPhotoFrame({
  children,
  className = "",
  warmth = 0.6,
  hideBanner = false,
}: ProductPhotoFrameProps) {
  const warmthOpacity = Math.max(0, Math.min(1, warmth));

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      {/* Warm-tone + vignette filters applied via CSS backdrop on inner */}
      <div
        className="relative w-full h-full"
        style={{
          filter: "saturate(1.05) contrast(1.02) brightness(0.99)",
        }}
      >
        {children}
      </div>

      {/* Warm-tone color overlay (sepia/amber tint) — neutralizes grey, unifies browns */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 mix-blend-multiply"
        style={{
          background:
            "linear-gradient(135deg, rgba(191,139,92,0) 0%, rgba(191,139,92,0.00) 40%, rgba(191,139,92," +
            (0.12 * warmthOpacity).toFixed(3) +
            ") 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 mix-blend-soft-light"
        style={{
          background:
            "radial-gradient(ellipse at 50% 45%, rgba(255,234,210,0) 55%, rgba(109,74,49," +
            (0.22 * warmthOpacity).toFixed(3) +
            ") 100%)",
        }}
      />

      {/* Subtle vignette */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          boxShadow:
            "inset 0 0 60px 4px rgba(28,22,15," +
            (0.18 * warmthOpacity).toFixed(3) +
            ")",
        }}
      />

      {/* Bottom banner tint + optional brand mark */}
      {!hideBanner && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24"
          style={{
            background:
              "linear-gradient(to top, rgba(28,22,15,0.65) 0%, rgba(28,22,15,0.35) 35%, rgba(28,22,15,0) 100%)",
          }}
        />
      )}
    </div>
  );
}
