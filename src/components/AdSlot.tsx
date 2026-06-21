'use client'

interface AdSlotProps {
  placement: 'banner' | 'sidebar' | 'feed-inline' | 'event-sponsor'
  className?: string
}

export default function AdSlot({ placement, className = '' }: AdSlotProps) {
  // This component is a placeholder for future ad/sponsor integration.
  // When ready to monetize, replace the placeholder with:
  // - Google AdSense script tags
  // - Direct sponsor banner images
  // - Affiliate links
  // - Promoted listings

  const styles: Record<string, string> = {
    'banner': 'h-24 max-w-4xl mx-auto',
    'sidebar': 'h-64 w-full',
    'feed-inline': 'h-20 max-w-2xl mx-auto',
    'event-sponsor': 'h-28 max-w-3xl mx-auto',
  }

  // In development, show the slot. In production with no ads configured, hide it.
  if (process.env.NODE_ENV === 'production') return null

  return (
    <div className={`rounded-lg flex items-center justify-center my-6 ${styles[placement]} ${className}`} style={{ border: '1px dashed rgba(45,212,191,0.2)', background: 'rgba(27,27,35,0.5)' }}>
      <div className="text-center">
        <p className="text-xs text-muted uppercase tracking-wider font-semibold">Ad Slot: {placement}</p>
        <p className="text-[10px] text-muted mt-1">Monetization placeholder — hidden in production</p>
      </div>
    </div>
  )
}
