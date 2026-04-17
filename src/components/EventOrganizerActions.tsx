'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function EventOrganizerActions({ eventId, organizerId, eventSlug }: { eventId: string; organizerId: string; eventSlug?: string }) {
  const supabase = createClient()
  const [isOrganizer, setIsOrganizer] = useState(false)

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      if (user.id === organizerId) { setIsOrganizer(true); return }
      const { data } = await supabase.from('event_cochairs').select('id').eq('event_id', eventId).eq('user_id', user.id).single()
      if (data) setIsOrganizer(true)
    }
    check()
  }, [organizerId, eventId])

  if (!isOrganizer) return null

  const handleDelete = async () => {
    const confirmed = window.confirm('Delete this event? This cannot be undone.')
    if (!confirmed) return
    await supabase.from('events').delete().eq('id', eventId)
    window.location.href = '/events'
  }

  const handleClose = async () => {
    await supabase.from('events').update({ status: 'completed' }).eq('id', eventId)
    window.location.reload()
  }

  return (
    <div style={{ display: 'flex', gap: '8px', marginTop: '14px', flexWrap: 'wrap' }}>
      {eventSlug && (
        <Link href={`/events/${eventSlug}/edit`} style={{ padding: '8px 16px', borderRadius: '6px', background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa', fontSize: '12px', fontWeight: 600 }}>
          ✏️ Edit Event
        </Link>
      )}
      <button onClick={handleClose} style={{ padding: '8px 16px', borderRadius: '6px', background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)', color: '#fb923c', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
        Mark as Completed
      </button>
      <button onClick={handleDelete} style={{ padding: '8px 16px', borderRadius: '6px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', color: '#ef4444', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
        🗑️ Delete
      </button>
    </div>
  )
}
