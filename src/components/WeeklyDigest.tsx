'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface DigestData {
  garage_views_week: number
  props_received_week: number
  guestbook_entries_week: number
  new_followers_week: number
  total_props: number
  total_views: number
}

export default function WeeklyDigest() {
  const supabase = createClient()
  const [digest, setDigest] = useState<DigestData | null>(null)

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.rpc('get_weekly_digest', { p_user_id: user.id })
      if (data && data.length > 0) setDigest(data[0])
    }
    fetch()
  }, [])

  if (!digest) return null
  const hasActivity = digest.garage_views_week > 0 || digest.props_received_week > 0 || digest.guestbook_entries_week > 0 || digest.new_followers_week > 0

  if (!hasActivity) return null

  return (
    <div className="glass" style={{ padding: '16px', marginBottom: '16px', border: '1px solid rgba(45,212,191,0.15)' }}>
      <p className="eyebrow" style={{ marginBottom: '10px' }}>Your Week in Review</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 72px), 1fr))', gap: '8px' }}>
        {[
          { value: digest.garage_views_week, label: 'Views' },
          { value: digest.props_received_week, label: 'Props' },
          { value: digest.guestbook_entries_week, label: 'Guestbook' },
          { value: digest.new_followers_week, label: 'Followers' },
        ].map(s => (
          <div key={s.label} style={{ textAlign: 'center', padding: '8px', borderRadius: '6px', background: 'rgba(18,18,30,0.5)' }}>
            <div className="spec" style={{ fontSize: '18px', fontWeight: 700, color: s.value > 0 ? '#2dd4bf' : '#6b7280' }}>
              {s.value > 0 ? `+${s.value}` : '0'}
            </div>
            <div style={{ fontSize: '9px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
