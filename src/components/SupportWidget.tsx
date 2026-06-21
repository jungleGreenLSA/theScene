'use client'

import { useState } from 'react'

export default function SupportWidget() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: 'fixed',
          bottom: '24px',
          left: '24px',
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: '#0f766e',
          border: '1px solid #2dd4bf',
          color: 'white',
          fontSize: '20px',
          cursor: 'pointer',
          zIndex: 998,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 20px rgba(45,212,191,0.3)',
          transition: 'all 0.2s',
        }}
        aria-label="Support"
      >
        {open ? 'x' : '?'}
      </button>

      {/* Popup */}
      {open && (
        <div
          style={{
            position: 'fixed',
            bottom: '84px',
            left: '24px',
            width: '320px',
            borderRadius: '12px',
            background: 'rgba(18,18,30,0.95)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.06)',
            padding: '24px',
            zIndex: 999,
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}
        >
          <h3 className="font-bold text-foreground" style={{ fontSize: '1rem', marginBottom: '12px' }}>Need Help?</h3>

          <p className="text-muted-light" style={{ fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '16px' }}>
            See an issue?{' '}
            <a
              href="mailto:support@thescene.fyi?subject=Bug Report"
              className="font-semibold"
              style={{ color: '#2dd4bf' }}
            >
              Report it here
            </a>
          </p>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
            <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '8px' }}>Or reach us directly:</p>
            <a
              href="mailto:support@thescene.fyi"
              style={{ fontSize: '0.85rem', fontWeight: 600, color: '#2dd4bf' }}
            >
              support@thescene.fyi
            </a>
          </div>
        </div>
      )}
    </>
  )
}
