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
    const { error, count } = await supabase.from('events').delete({ count: 'exact' }).eq('id', eventId)
    if (error) { alert('Delete failed: ' + error.message); return }
    if (!count) { alert('Delete was silently blocked. Migration 013 (events DELETE policy) likely has not been applied in Supabase yet.'); return }
    window.location.href = '/events'
  }

  const handleClose = async () => {
    const { error } = await supabase.from('events').update({ status: 'completed' }).eq('id', eventId)
    if (error) { alert('Failed to close event: ' + error.message); return }
    window.location.reload()
  }

  return (
    <div style={{ display: 'flex', gap: '8px', marginTop: '14px', flexWrap: 'wrap' }}>
      {eventSlug && (
        <Link href={`/events/${eventSlug}/edit`} style={{ padding: '8px 16px', borderRadius: '6px', background: 'rgba(44, 121, 196, 0.15)', border: '1px solid rgba(44, 121, 196, 0.3)', color: '#5fa8dd', fontSize: '12px', fontWeight: 600 }}>
          Edit Event
        </Link>
      )}
      <button onClick={handleClose} style={{ padding: '8px 16px', borderRadius: '6px', background: 'rgba(95, 168, 221, 0.1)', border: '1px solid rgba(95, 168, 221, 0.2)', color: '#90caf9', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
        Mark as Completed
      </button>
      <button onClick={handleDelete} className="btn-danger">
        Delete
      </button>
    </div>
  )
}
