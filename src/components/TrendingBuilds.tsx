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
        <span className="eyebrow">Trending This Week</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {builds.map((b, i) => (
          <Link key={b.vehicle_id} href={`/user/${b.owner_username}/${b.slug}`}
            className="card-hover"
            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '8px', background: 'var(--color-surface-lowest)', border: '1px solid var(--color-border)', transition: 'all 0.2s', minHeight: '44px' }}
          >
            <span className="spec" style={{ fontSize: '13px', color: i === 0 ? 'var(--color-accent)' : i < 3 ? 'var(--color-accent)' : 'var(--color-muted)', width: '20px', textAlign: 'center', flexShrink: 0 }}>{i + 1}</span>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', overflow: 'hidden', background: 'var(--color-surface-light)', flexShrink: 0 }}>
              {b.primary_image_url ? (
                <img src={b.primary_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', maxWidth: '100%' }} />
              ) : null}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <span className="spec">{b.year}</span> {b.make} {b.model}
              </p>
              <p style={{ fontSize: '11px', color: 'var(--color-muted)' }}>@{b.owner_username}</p>
            </div>
            <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: 'var(--color-muted-light)', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <span className="spec" style={{ color: 'var(--color-accent)' }}>{b.recent_props} props</span>
              <span className="spec">{b.view_count} views</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
