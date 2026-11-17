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
          background: '#e87817',
          border: '1px solid #f97316',
          color: 'white',
          fontSize: '20px',
          cursor: 'pointer',
          zIndex: 998,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 20px rgba(232,120,23,0.3)',
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
            background: '#f0f0f0',
            backdropFilter: 'blur(16px)',
            border: '1px solid #e4e4e4',
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
              className="text-purple-light hover:text-neon-light font-semibold"
            >
              Report it here
            </a>
          </p>

          <div style={{ borderTop: '1px solid #e4e4e4', paddingTop: '12px' }}>
            <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '8px' }}>Or reach us directly:</p>
            <a
              href="mailto:support@thescene.fyi"
              className="text-purple-light hover:text-neon-light"
              style={{ fontSize: '0.85rem', fontWeight: 600 }}
            >
              support@thescene.fyi
            </a>
          </div>
        </div>
      )}
    </>
  )
}
