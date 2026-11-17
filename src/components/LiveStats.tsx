'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LiveStats() {
  const supabase = createClient()
  const [stats, setStats] = useState({ garages: 0, props: 0, events: 0, guestbook: 0 })

  useEffect(() => {
    const fetch = async () => {
      const [{ count: garages }, { count: events }, { count: guestbook }] = await Promise.all([
        supabase.from('vehicles').select('id', { count: 'exact', head: true }),
        supabase.from('events').select('id', { count: 'exact', head: true }),
        supabase.from('guestbook_entries').select('id', { count: 'exact', head: true }),
      ])

      // Get total props from vehicles
      const { data: vehicles } = await supabase.from('vehicles').select('props_count')
      const totalProps = (vehicles || []).reduce((sum: number, v: any) => sum + (v.props_count || 0), 0)

      setStats({
        garages: garages || 0,
        props: totalProps,
        events: events || 0,
        guestbook: guestbook || 0,
      })
    }
    fetch()
  }, [])

  const items = [
    { value: stats.garages, label: 'Garages Built' },
    { value: stats.props, label: 'Props Given' },
    { value: stats.events, label: 'Events Listed' },
    { value: stats.guestbook, label: 'Guestbook Signs' },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))', gap: '12px' }}>
      {items.map((stat) => (
        <div key={stat.label} className="glass card-hover" style={{ padding: '28px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 700, color: '#f97316' }}>{stat.value.toLocaleString()}</div>
          <div style={{ fontSize: '11px', color: '#555555', textTransform: 'uppercase', letterSpacing: '1.5px', marginTop: '8px' }}>{stat.label}</div>
        </div>
      ))}
    </div>
  )
}
