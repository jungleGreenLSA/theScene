'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Badge {
  id: string
  slug: string
  name: string
  description: string
  icon: string
  category: string
  earned_at: string
}

export default function UserBadges({ userId }: { userId: string }) {
  const supabase = createClient()
  const [badges, setBadges] = useState<Badge[]>([])

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('user_badges')
        .select('earned_at, badge:badges(*)')
        .eq('user_id', userId)
        .order('earned_at', { ascending: false })

      const mapped = (data || []).map((d: any) => ({ ...d.badge, earned_at: d.earned_at }))
      setBadges(mapped)
    }
    fetch()
  }, [userId])

  if (badges.length === 0) return null

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
      {badges.map(b => (
        <div
          key={b.id}
          title={`${b.name}: ${b.description}`}
          style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            padding: '3px 10px', borderRadius: '20px',
            background: 'rgba(232,120,23,0.1)', border: '1px solid rgba(232,120,23,0.2)',
            fontSize: '11px', fontWeight: 600, color: '#f97316', cursor: 'default',
          }}
        >
          <span style={{ fontSize: '13px' }}>{b.icon}</span>
          {b.name}
        </div>
      ))}
    </div>
  )
}
