'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface NearbyMember {
  user_id: string
  username: string
  display_name: string
  avatar_url: string
  location: string
  vehicle_count: number
}

export default function NearbyMembers() {
  const supabase = createClient()
  const [members, setMembers] = useState<NearbyMember[]>([])
  const [userLocation, setUserLocation] = useState('')
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    const loadLocation = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase.from('profiles').select('location').eq('id', user.id).single()
      if (profile?.location) {
        setUserLocation(profile.location)
        fetchNearby(profile.location)
      }
    }
    loadLocation()
  }, [])

  const fetchNearby = async (location: string) => {
    // Extract city or state from location
    const parts = location.split(',').map(s => s.trim())
    const searchTerm = parts[0] // Use city name
    if (!searchTerm) return

    const { data } = await supabase.rpc('get_nearby_members', { p_location: searchTerm, p_limit: 10 })
    setMembers((data || []) as NearbyMember[])
    setSearched(true)
  }

  if (!searched || members.length === 0) return null

  return (
    <div className="glass" style={{ padding: '16px', marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span className="eyebrow">Near {userLocation}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {members.slice(0, 5).map(m => (
          <Link key={m.user_id} href={`/user/${m.username}`}
            className="card-hover"
            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', borderRadius: '8px', minHeight: '44px' }}
          >
            <div style={{ flexShrink: 0 }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', background: 'rgba(45,212,191,0.1)', backgroundImage: m.avatar_url ? `url(${m.avatar_url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(45,212,191,0.2)' }}>
                {!m.avatar_url && <span style={{ fontSize: '11px', color: '#2dd4bf', fontWeight: 700 }}>{m.username?.charAt(0).toUpperCase()}</span>}
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#e4e1ed', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.display_name || m.username}</p>
            </div>
            <span className="spec" style={{ fontSize: '10px', color: '#6b7280', flexShrink: 0 }}>{m.vehicle_count} ride{m.vehicle_count === 1 ? '' : 's'}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
