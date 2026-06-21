'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useFocusTrap } from '@/lib/useFocusTrap'

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
  const popoverRef = useRef<HTMLDivElement>(null)
  useFocusTrap(open, popoverRef, () => { setOpen(false); setReason('') })

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
        aria-haspopup="dialog"
        aria-expanded={open}
        style={{ background: 'none', border: 'none', color: '#2c3e50', fontSize: '14px', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px' }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
        onMouseLeave={(e) => (e.currentTarget.style.color = '#555555')}
        title="Report content"
      >
        Report
      </button>

      {open && (
        <div ref={popoverRef} role="dialog" aria-modal="true" aria-labelledby={`content-report-title-${targetId}`} className="menu-pop" style={{
          position: 'absolute',
          bottom: '100%',
          right: 0,
          marginBottom: '8px',
          width: '240px',
          background: '#f0f0f0',
          backdropFilter: 'blur(16px)',
          border: '1px solid #e4e4e4',
          borderRadius: '10px',
          padding: '16px',
          zIndex: 50,
          boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
          transformOrigin: 'bottom right',
        }}>
          {submitted ? (
            <p role="status" aria-live="polite" style={{ fontSize: '13px', color: 'var(--color-success)', fontWeight: 500 }}>Report submitted. Thank you.</p>
          ) : (
            <>
              <p id={`content-report-title-${targetId}`} className="font-semibold text-foreground" style={{ fontSize: '13px', marginBottom: '8px' }}>Report this {targetType}</p>
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
                  style={{ flex: 1, padding: '8px', borderRadius: '6px', background: '#f5f5f5', border: '1px solid #e4e4e4', color: '#2c3e50', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!reason || loading}
                  style={{ flex: 1, padding: '8px', borderRadius: '6px', background: reason ? '#ef4444' : 'rgba(239,68,68,0.3)', border: 'none', color: 'white', fontSize: '11px', fontWeight: 600, cursor: reason ? 'pointer' : 'default', opacity: loading ? 0.5 : 1 }}
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
