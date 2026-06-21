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
    <div className="glass" style={{ padding: '20px', marginTop: '20px', border: '1px solid rgba(95, 168, 221, 0.15)' }}>
      <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a1a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        Build Matches
        <span style={{ fontSize: '11px', color: '#2c3e50', fontWeight: 400 }}>Members with similar mods</span>
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {matches.map(m => (
          <Link key={m.matched_vehicle_id} href={`/user/${m.matched_username}/${m.matched_slug}`}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', borderRadius: '8px', background: '#f0f0f0', border: '1px solid #f5f5f5' }}
          >
            <div style={{ width: '44px', height: '44px', borderRadius: '8px', overflow: 'hidden', background: '#e4e4e4', flexShrink: 0 }}>
              {m.matched_primary_image ? (
                <img src={m.matched_primary_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : null}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a1a' }}>{m.matched_year} {m.matched_make} {m.matched_model}</p>
              <p style={{ fontSize: '11px', color: '#2c3e50' }}>@{m.matched_username} · {m.common_mods} mods in common</p>
              {m.common_mod_items && m.common_mod_items.length > 0 && (
                <p style={{ fontSize: '10px', color: '#2c3e50', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {m.common_mod_items.slice(0, 3).join(', ')}
                </p>
              )}
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-link)', flexShrink: 0 }}>{m.common_mods}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
