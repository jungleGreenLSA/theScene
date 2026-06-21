'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const STATUSES = [
  { value: 'going', label: "I'm Going", color: '#22c55e', bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.3)' },
  { value: 'maybe', label: 'Might Go', color: '#2dd4bf', bg: 'rgba(45,212,191,0.1)', border: 'rgba(45,212,191,0.2)' },
  { value: 'not_going', label: "Can't Make It", color: '#6b7280', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.06)' },
]

export default function EventRSVP({ eventId }: { eventId: string }) {
  const supabase = createClient()
  const [currentStatus, setCurrentStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('event_rsvps').select('status').eq('event_id', eventId).eq('user_id', user.id).maybeSingle()
      if (data) setCurrentStatus(data.status)
    }
    check()
  }, [eventId])

  const handleRSVP = async (status: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/auth/login'; return }

    const prev = currentStatus
    const nextStatus = prev === status ? null : status
    // Optimistic: paint the button first, rollback on error.
    setCurrentStatus(nextStatus)
    setLoading(true)

    let err = null
    if (prev === status) {
      const r = await supabase.from('event_rsvps').delete().eq('event_id', eventId).eq('user_id', user.id)
      err = r.error
    } else if (prev) {
      const r = await supabase.from('event_rsvps').update({ status }).eq('event_id', eventId).eq('user_id', user.id)
      err = r.error
    } else {
      const r = await supabase.from('event_rsvps').insert({ event_id: eventId, user_id: user.id, status })
      err = r.error
    }

    if (err) {
      console.error('[EventRSVP] Save failed:', err)
      setCurrentStatus(prev)
      alert('RSVP failed: ' + err.message)
    }
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      {STATUSES.map(s => {
        const isSelected = currentStatus === s.value
        return (
          <button
            key={s.value}
            onClick={() => handleRSVP(s.value)}
            disabled={loading}
            style={{
              padding: '8px 18px', borderRadius: '20px', cursor: 'pointer',
              fontSize: '12px', fontWeight: 600, transition: 'all 0.2s',
              background: isSelected ? s.bg : 'rgba(18,18,30,0.5)',
              border: `1px solid ${isSelected ? s.border : 'rgba(255,255,255,0.08)'}`,
              color: isSelected ? s.color : '#9ca3af',
              opacity: loading ? 0.5 : 1,
              minHeight: '44px',
            }}
          >
            {s.label}
          </button>
        )
      })}
    </div>
  )
}
