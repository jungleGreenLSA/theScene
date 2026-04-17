'use client'

import { useState } from 'react'

export default function GarageQR({ username, vehicleSlug, vehicleId }: { username: string; vehicleSlug: string; vehicleId: string }) {
  const [showQR, setShowQR] = useState(false)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thescene.fyi'
  const garageUrl = `${siteUrl}/ride/${vehicleId}`
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(garageUrl)}&bgcolor=0c0c14&color=a78bfa`

  return (
    <>
      <button
        onClick={() => setShowQR(!showQR)}
        style={{
          background: 'none', border: 'none',
          padding: '0', color: '#8892a4', fontSize: '14px',
          fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
        }}
      >
        📱 QR Code
      </button>

      {showQR && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }} onClick={() => setShowQR(false)} />
          <div className="glass" style={{ position: 'relative', padding: '32px', textAlign: 'center', maxWidth: '380px', width: '100%' }}>
            <button onClick={() => setShowQR(false)} style={{ position: 'absolute', top: '12px', right: '16px', background: 'none', border: 'none', color: '#6b7280', fontSize: '20px', cursor: 'pointer' }}>&times;</button>
            <h3 className="font-bold text-foreground" style={{ marginBottom: '4px' }}>Your Garage QR Code</h3>
            <p className="text-muted" style={{ fontSize: '12px', marginBottom: '20px' }}>Print this and put it on your dashboard at car shows</p>
            <div style={{ background: '#0c0c14', borderRadius: '12px', padding: '20px', display: 'inline-block', marginBottom: '16px' }}>
              <img src={qrUrl} alt="QR Code" style={{ width: '200px', height: '200px', borderRadius: '4px' }} />
            </div>
            <p className="text-muted-light" style={{ fontSize: '11px', wordBreak: 'break-all', marginBottom: '16px' }}>{garageUrl}</p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <a href={qrUrl} download={`thescene-${username}-${vehicleSlug}.png`} className="btn-primary" style={{ fontSize: '11px', padding: '8px 16px' }}>
                Download PNG
              </a>
              <button onClick={() => { navigator.clipboard.writeText(garageUrl); }} className="btn-outline" style={{ fontSize: '11px', padding: '8px 16px' }}>
                Copy Link
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
