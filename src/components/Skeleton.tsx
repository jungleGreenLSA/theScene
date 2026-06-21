/**
 * Skeleton — shimmer placeholder for loading states.
 * Replaces bare "Loading…" text to reduce perceived wait and prevent CLS.
 * Motion is defined in globals.css (.skeleton / .skeleton-*) and is
 * automatically neutralized under prefers-reduced-motion.
 */
type Variant = 'line' | 'avatar' | 'card'

export default function Skeleton({
  variant = 'line',
  count = 1,
  width,
  style,
}: {
  variant?: Variant
  count?: number
  width?: string | number
  style?: React.CSSProperties
}) {
  const cls = `skeleton skeleton-${variant}`
  return (
    <span role="status" aria-label="Loading" style={{ display: 'block' }}>
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className={cls} style={{ display: 'block', width, ...style }} />
      ))}
    </span>
  )
}
