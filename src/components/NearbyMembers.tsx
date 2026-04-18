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
  is_online: boolean
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

  const onlineCount = members.filter(m => m.is_online).length

  return (
    <div className="glass" style={{ padding: '16px', marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#e2e4e9', display: 'flex', alignItems: 'center', gap: '6px' }}>
          Near {userLocation}
        </h3>
        {onlineCount > 0 && (
          <span style={{ fontSize: '11px', color: '#22c55e', fontWeight: 600 }}>● {onlineCount} online</span>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {members.slice(0, 5).map(m => (
          <Link key={m.user_id} href={`/user/${m.username}`}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px', borderRadius: '6px' }}
          >
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', overflow: 'hidden', background: 'rgba(26,26,46,0.5)', backgroundImage: m.avatar_url ? `url(${m.avatar_url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {!m.avatar_url && <span style={{ fontSize: '10px', color: '#6b7280' }}>{m.username?.charAt(0).toUpperCase()}</span>}
              </div>
              {m.is_online && (
                <div style={{ position: 'absolute', bottom: -1, right: -1, width: '9px', height: '9px', borderRadius: '50%', background: '#22c55e', border: '2px solid #12121e' }} />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#e2e4e9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.display_name || m.username}</p>
            </div>
            <span style={{ fontSize: '10px', color: '#6b7280' }}>{m.vehicle_count} ride{m.vehicle_count === 1 ? '' : 's'}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
