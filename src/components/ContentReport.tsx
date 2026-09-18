'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ContentReportProps {
  targetType: 'post' | 'comment' | 'event' | 'guestbook'
  targetId: string
}

export default function ContentReport({ targetType, targetId }: ContentReportProps) {
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!reason) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/auth/login'; return }

    setLoading(true)
    await supabase.from('reports').insert({
      reporter_id: user.id,
      target_type: targetType,
      target_id: targetId,
      reason,
    })
    setSubmitted(true)
    setLoading(false)
    setTimeout(() => { setOpen(false); setSubmitted(false); setReason('') }, 2000)
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ background: 'none', border: 'none', color: 'var(--color-muted)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', padding: '8px 10px', borderRadius: '4px', minHeight: '44px', transition: 'color 0.15s' }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-muted-light)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-muted)')}
        aria-expanded={open}
        aria-label="Report content"
        title="Report content"
      >
        Report
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          right: 0,
          marginBottom: '8px',
          width: 'min(240px, calc(100vw - 32px))',
          background: 'var(--color-surface-lowest)',
          backdropFilter: 'blur(16px)',
          border: '1px solid var(--color-border)',
          borderRadius: '10px',
          padding: '16px',
          zIndex: 50,
          boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
        }}>
          {submitted ? (
            <p style={{ fontSize: '13px', color: 'var(--color-success)', fontWeight: 500 }}>Report submitted. Thank you.</p>
          ) : (
            <>
              <p className="font-semibold text-foreground" style={{ fontSize: '13px', marginBottom: '8px' }}>Report this {targetType}</p>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="input"
                style={{ fontSize: '12px', marginBottom: '8px' }}
              >
                <option value="">Select reason...</option>
                <option value="spam">Spam</option>
                <option value="harassment">Harassment</option>
                <option value="inappropriate">Inappropriate content</option>
                <option value="misinformation">Misinformation</option>
                <option value="other">Other</option>
              </select>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => { setOpen(false); setReason('') }}
                  style={{ flex: 1, padding: '8px', borderRadius: '6px', background: 'var(--color-surface-light)', border: '1px solid var(--color-border)', color: 'var(--color-muted-light)', fontSize: '11px', fontWeight: 600, cursor: 'pointer', minHeight: '44px' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!reason || loading}
                  style={{ flex: 1, padding: '8px', borderRadius: '6px', background: reason ? 'var(--color-danger)' : 'rgba(229,72,77,0.2)', border: 'none', color: reason ? 'white' : 'var(--color-muted)', fontSize: '11px', fontWeight: 700, cursor: reason ? 'pointer' : 'default', opacity: loading ? 0.5 : 1, minHeight: '44px' }}
                >
                  Report
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
