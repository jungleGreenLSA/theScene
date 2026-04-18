'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import SceneHeatmap from '@/components/SceneHeatmap'
import { getNearbyPrefs, filterByRadius } from '@/lib/nearbyFilter'

interface Club {
  id: string
  name: string
  slug: string
  description: string
  logo_url: string
  cover_image_url: string
  locations: { city: string; state: string; label: string }[]
  member_count: number
}

export default function ClubsPage() {
  const supabase = createClient()
  const [clubs, setClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)
  const [locationSearch, setLocationSearch] = useState('')

  useEffect(() => { fetchClubs() }, [])

  const [nearbyState, setNearbyState] = useState<string | null>(null)

  const fetchClubs = async () => {
    setLoading(true)
    const prefs = await getNearbyPrefs(supabase)
    const { data } = await supabase
      .from('clubs')
      .select(`*, locations:club_locations(city, state, label, lat, lng), members:club_members(id)`)
      .eq('is_public', true)
      .order('name')

    let mapped = (data || []).map((c: any) => ({ ...c, member_count: c.members?.length || 0 }))
    if (prefs.filterClubs && prefs.userCoords) {
      // Keep a club if ANY of its chapter locations falls inside the radius.
      const filtered: typeof mapped = []
      for (const c of mapped) {
        const chapters = (c.locations || []) as any[]
        if (chapters.length === 0) continue
        const near = await filterByRadius(chapters, prefs, l => ({ lat: l.lat ?? null, lng: l.lng ?? null, city: l.city, state: l.state }))
        if (near.length > 0) filtered.push(c)
      }
      mapped = filtered
      setNearbyState(`${prefs.radius} mi of ${prefs.state}`)
    }
    setClubs(mapped)
    setLoading(false)
  }

  const filteredClubs = locationSearch
    ? clubs.filter(club =>
        club.locations?.some(loc =>
          loc.city?.toLowerCase().includes(locationSearch.toLowerCase()) ||
          loc.state?.toLowerCase().includes(locationSearch.toLowerCase())
        ) || club.name.toLowerCase().includes(locationSearch.toLowerCase())
      )
    : clubs

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '80px 32px 40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="text-3xl font-bold">Car <span className="text-purple-light">Clubs</span></h1>
          <p className="text-muted-light" style={{ marginTop: '4px', fontSize: '0.9rem' }}>
            Find your crew. Join your local scene.{nearbyState && <> · filtered to <span style={{ color: '#5fa8dd' }}>{nearbyState}</span></>}
          </p>
        </div>
        <Link href="/clubs/create" className="btn-primary text-xs">Start a Club</Link>
      </div>

      {/* Search */}
      <div className="glass" style={{ padding: '20px', marginBottom: '20px' }}>
        <input
          type="text"
          value={locationSearch}
          onChange={(e) => setLocationSearch(e.target.value)}
          placeholder='Search clubs by name, city, or state... (e.g. "Scranton PA", "Texas")'
          className="input"
          style={{ width: '100%' }}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <SceneHeatmap type="clubs" title="Where the Clubs Are" />
      </div>

      {/* Results */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {[1,2,3].map(i => (
            <div key={i} className="glass overflow-hidden animate-pulse">
              <div style={{ height: '120px', background: '#e4e4e4' }} />
              <div style={{ padding: '16px' }}>
                <div style={{ height: '14px', background: '#e4e4e4', borderRadius: '4px', width: '60%', marginBottom: '8px' }} />
                <div style={{ height: '12px', background: '#e4e4e4', borderRadius: '4px', width: '40%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : filteredClubs.length === 0 ? (
        <div className="glass text-center" style={{ padding: '48px 32px' }}>
          <h2 className="text-xl font-bold" style={{ marginBottom: '8px' }}>No clubs found</h2>
          <p className="text-muted-light" style={{ marginBottom: '20px', fontSize: '0.9rem' }}>
            {locationSearch ? `No clubs match "${locationSearch}". Start one!` : 'Be the first to start a car club on The Scene.'}
          </p>
          <Link href="/clubs/create" className="btn-neon">Start a Club</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {filteredClubs.map((club) => (
            <Link key={club.id} href={`/clubs/${club.slug}`} className="glass overflow-hidden card-hover group">
              <div style={{ height: '120px', position: 'relative', overflow: 'hidden', background: '#e4e4e4' }}>
                {club.cover_image_url ? (
                  <img src={club.cover_image_url} alt={club.name} className="group-hover:scale-105 transition-transform duration-500" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(44, 121, 196, 0.1), rgba(95, 168, 221, 0.1))' }} />
                )}
                {club.logo_url && (
                  <div style={{ position: 'absolute', bottom: '8px', left: '12px', width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', background: '#0c0c14', border: '2px solid #e4e4e4' }}>
                    <img src={club.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
              </div>

              <div style={{ padding: '16px' }}>
                <h3 className="font-bold text-foreground group-hover:text-purple-light transition-colors" style={{ fontSize: '0.95rem' }}>{club.name}</h3>

                {club.locations && club.locations.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                    {club.locations.slice(0, 3).map((loc, i) => (
                      <span key={i} className="text-purple-light" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, padding: '3px 8px', borderRadius: '4px', background: 'rgba(44, 121, 196, 0.1)', border: '1px solid rgba(44, 121, 196, 0.2)' }}>
                        {loc.city}, {loc.state}
                      </span>
                    ))}
                    {club.locations.length > 3 && (
                      <span className="text-muted" style={{ fontSize: '10px', padding: '3px 6px' }}>+{club.locations.length - 3} more</span>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #e4e4e4' }}>
                  <span className="text-muted" style={{ fontSize: '13px' }}>{club.member_count} member{club.member_count !== 1 ? 's' : ''}</span>
                </div>

                {club.description && (
                  <p className="text-muted-light" style={{ fontSize: '12px', marginTop: '8px', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>{club.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
