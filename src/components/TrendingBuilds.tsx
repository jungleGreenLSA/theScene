'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface TrendingVehicle {
  vehicle_id: string
  year: number
  make: string
  model: string
  color: string
  primary_image_url: string
  build_status: string
  slug: string
  owner_username: string
  owner_display_name: string
  owner_avatar_url: string
  props_count: number
  view_count: number
  recent_props: number
  trending_score: number
}

export default function TrendingBuilds() {
  const supabase = createClient()
  const [builds, setBuilds] = useState<TrendingVehicle[]>([])

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.rpc('get_trending_builds', { p_days: 7, p_limit: 6 })
      setBuilds((data || []) as TrendingVehicle[])
    }
    fetch()
  }, [])

  if (builds.length === 0) return null

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#e2e4e9', display: 'flex', alignItems: 'center', gap: '6px' }}>
          Trending This Week
        </h3>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {builds.map((b, i) => (
          <Link key={b.vehicle_id} href={`/user/${b.owner_username}/${b.slug}`}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '8px', background: 'rgba(18,18,30,0.5)', border: '1px solid rgba(255,255,255,0.04)', transition: 'all 0.2s' }}
          >
            <span style={{ fontSize: '14px', fontWeight: 700, color: i < 3 ? '#fb923c' : '#6b7280', width: '20px', textAlign: 'center' }}>{i + 1}</span>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', overflow: 'hidden', background: 'rgba(26,26,46,0.5)', flexShrink: 0 }}>
              {b.primary_image_url ? (
                <img src={b.primary_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : null}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#e2e4e9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.year} {b.make} {b.model}</p>
              <p style={{ fontSize: '11px', color: '#6b7280' }}>@{b.owner_username}</p>
            </div>
            <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: '#8892a4', flexShrink: 0 }}>
              <span>{b.recent_props} props</span>
              <span>{b.view_count} views</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
