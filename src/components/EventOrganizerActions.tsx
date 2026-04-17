'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function EventOrganizerActions({ eventId, organizerId }: { eventId: string; organizerId: string }) {
  const supabase = createClient()
  const [isOrganizer, setIsOrganizer] = useState(false)

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user && user.id === organizerId) setIsOrganizer(true)
    }
    check()
  }, [organizerId])

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
      <button onClick={handleClose} style={{ padding: '8px 16px', borderRadius: '6px', background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)', color: '#fb923c', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
        Mark as Completed
      </button>
      <button onClick={handleDelete} style={{ padding: '8px 16px', borderRadius: '6px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', color: '#ef4444', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
        🗑️ Delete Event
      </button>
    </div>
  )
}
