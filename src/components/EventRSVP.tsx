'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const STATUSES = [
  { value: 'going', label: "I'm Going", color: '#22c55e', bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.3)' },
  { value: 'maybe', label: 'Might Go', color: '#fb923c', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.2)' },
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
      const { data } = await supabase.from('event_rsvps').select('status').eq('event_id', eventId).eq('user_id', user.id).single()
      if (data) setCurrentStatus(data.status)
    }
    check()
  }, [eventId])

  const handleRSVP = async (status: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/auth/login'; return }
    setLoading(true)

    if (currentStatus === status) {
      // Remove RSVP
      await supabase.from('event_rsvps').delete().eq('event_id', eventId).eq('user_id', user.id)
      setCurrentStatus(null)
    } else if (currentStatus) {
      // Update RSVP
      await supabase.from('event_rsvps').update({ status }).eq('event_id', eventId).eq('user_id', user.id)
      setCurrentStatus(status)
    } else {
      // New RSVP
      await supabase.from('event_rsvps').insert({ event_id: eventId, user_id: user.id, status })
      setCurrentStatus(status)
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
              border: `1px solid ${isSelected ? s.border : 'rgba(255,255,255,0.06)'}`,
              color: isSelected ? s.color : '#6b7280',
              opacity: loading ? 0.5 : 1,
            }}
          >
            {s.label}
          </button>
        )
      })}
    </div>
  )
}
