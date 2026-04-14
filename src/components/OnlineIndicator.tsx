'use client'

export default function OnlineIndicator({ isOnline, size = 10 }: { isOnline: boolean; size?: number }) {
  if (!isOnline) return null
  return (
    <div style={{
      width: `${size}px`, height: `${size}px`, borderRadius: '50%',
      background: '#22c55e', border: '2px solid #0c0c14',
      boxShadow: '0 0 6px rgba(34,197,94,0.5)',
      position: 'absolute', bottom: 0, right: 0,
    }} title="Online now" />
  )
}
