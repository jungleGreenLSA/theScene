'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Match {
  matched_vehicle_id: string
  matched_username: string
  matched_display_name: string
  matched_avatar_url: string
  matched_year: number
  matched_make: string
  matched_model: string
  matched_slug: string
  matched_primary_image: string
  common_mods: number
  common_mod_items: string[]
}

export default function BuildMatch({ vehicleId }: { vehicleId: string }) {
  const supabase = createClient()
  const [matches, setMatches] = useState<Match[]>([])

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.rpc('get_build_matches', { p_vehicle_id: vehicleId, p_limit: 3 })
      setMatches((data || []) as Match[])
    }
    fetch()
  }, [vehicleId])

  if (matches.length === 0) return null

  return (
    <div className="glass" style={{ padding: '20px', marginTop: '20px', border: '1px solid rgba(45,212,191,0.15)' }}>
      <div style={{ marginBottom: '14px' }}>
        <span className="eyebrow">Build Matches</span>
        <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>Members with similar mods</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {matches.map(m => (
          <Link key={m.matched_vehicle_id} href={`/user/${m.matched_username}/${m.matched_slug}`}
            className="card-hover"
            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', borderRadius: '8px', background: 'rgba(18,18,30,0.5)', border: '1px solid rgba(255,255,255,0.06)', minHeight: '44px' }}
          >
            <div style={{ width: '44px', height: '44px', borderRadius: '8px', overflow: 'hidden', background: 'rgba(26,26,46,0.5)', flexShrink: 0 }}>
              {m.matched_primary_image ? (
                <img src={m.matched_primary_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : null}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#e4e1ed' }}><span className="spec">{m.matched_year}</span> {m.matched_make} {m.matched_model}</p>
              <p style={{ fontSize: '11px', color: '#9ca3af' }}>@{m.matched_username} · <span className="spec">{m.common_mods}</span> mods in common</p>
              {m.common_mod_items && m.common_mod_items.length > 0 && (
                <p style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {m.common_mod_items.slice(0, 3).join(', ')}
                </p>
              )}
            </div>
            <span className="spec" style={{ fontSize: '11px', fontWeight: 700, color: '#2dd4bf', flexShrink: 0 }}>{m.common_mods}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
