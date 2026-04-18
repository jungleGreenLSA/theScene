'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { getNearbyPrefs } from '@/lib/nearbyFilter'

interface Vehicle {
  id: string
  slug: string
  year: number
  make: string
  model: string
  color: string
  engine: string
  horsepower: string
  build_status: string
  primary_image_url: string
  props_count: number
  view_count: number
  owner: {
    username: string
    display_name: string
    avatar_url: string
    location: string
  }
}

export default function ExplorePage() {
  const supabase = createClient()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [nearbyState, setNearbyState] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [make, setMake] = useState('')
  const [location, setLocation] = useState('')

  const fetchVehicles = async () => {
    setLoading(true)

    let query = supabase
      .from('vehicles')
      .select(`
        *,
        owner:profiles(username, display_name, avatar_url, location)
      `)
      .eq('is_public', true)

    if (make) query = query.ilike('make', `%${make}%`)
    if (search) {
      query = query.or(`make.ilike.%${search}%,model.ilike.%${search}%`)
    }

    query = query.order('props_count', { ascending: false })

    query = query.limit(48)
    const { data } = await query
    let results = (data || []) as Vehicle[]

    if (location) {
      const loc = location.toLowerCase()
      results = results.filter(v =>
        v.owner?.location?.toLowerCase().includes(loc)
      )
    }

    // "Only show people near me" toggle from settings
    const prefs = await getNearbyPrefs(supabase)
    if (prefs.filterPeople && prefs.state) {
      results = results.filter(v => {
        const parts = (v.owner?.location || '').split(',').map(s => s.trim())
        return (parts[1] || '').toUpperCase().slice(0, 2) === prefs.state
      })
      setNearbyState(prefs.state)
    }

    setVehicles(results)
    setLoading(false)
  }

  useEffect(() => { fetchVehicles() }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchVehicles()
  }


  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '80px 32px 40px' }}>
      {/* Header */}
      <div className="text-center" style={{ marginBottom: '24px' }}>
        <h1 className="text-3xl font-bold">Explore <span className="text-purple-light">The Scene</span></h1>
        <p className="text-muted-light" style={{ marginTop: '8px', fontSize: '0.9rem' }}>
          Discover builds from enthusiasts{nearbyState ? <> in <span style={{ color: '#a78bfa' }}>{nearbyState}</span></> : ' across the country'}
        </p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="glass" style={{ padding: '20px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by make or model..."
            className="input"
            style={{ flex: '1 1 200px' }}
          />
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location or zip..."
            className="input"
            style={{ flex: '0 1 180px' }}
          />
          <select value={make} onChange={(e) => setMake(e.target.value)} className="input" style={{ flex: '0 1 150px' }}>
            <option value="">All Makes</option>
            <option>Chevrolet</option>
            <option>Ford</option>
            <option>Dodge</option>
            <option>Honda</option>
            <option>Toyota</option>
            <option>BMW</option>
            <option>Nissan</option>
            <option>Subaru</option>
            <option>Mazda</option>
            <option>Porsche</option>
            <option>Audi</option>
            <option>Mercedes</option>
            <option>Lexus</option>
            <option>Jeep</option>
            <option>Ram</option>
          </select>
          <button type="submit" className="btn-primary text-xs">Search</button>
        </div>

      </form>

      {/* AI Search Teaser */}
      <div className="glass" style={{ padding: '14px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '14px', border: '1px solid rgba(249,115,22,0.15)' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p className="text-foreground font-semibold" style={{ fontSize: '13px', lineHeight: 1.3 }}>AI Search Coming Soon</p>
          <p className="text-muted-light" style={{ fontSize: '11px', lineHeight: 1.4 }}>
            &quot;Find me all red Corvettes within 50 miles of 75201&quot; -- natural language search is on our roadmap.
          </p>
        </div>
        <span className="text-neon-light font-bold" style={{ fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase', padding: '4px 10px', background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: '4px', flexShrink: 0 }}>
          Soon
        </span>
      </div>

      {/* Results count */}
      {!loading && (
        <p className="text-muted" style={{ fontSize: '13px', marginBottom: '16px' }}>{vehicles.length} build{vehicles.length !== 1 ? 's' : ''} found</p>
      )}

      {/* Vehicle Grid / Results */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {[1,2,3].map(i => (
            <div key={i} className="glass overflow-hidden animate-pulse">
              <div style={{ aspectRatio: '16 / 9', background: 'rgba(26,26,46,0.5)' }} />
              <div style={{ padding: '16px' }}>
                <div style={{ height: '14px', background: 'rgba(26,26,46,0.5)', borderRadius: '4px', width: '75%', marginBottom: '8px' }} />
                <div style={{ height: '12px', background: 'rgba(26,26,46,0.5)', borderRadius: '4px', width: '50%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : vehicles.length === 0 ? (
        <div className="glass text-center" style={{ padding: '48px 32px' }}>
          <h2 className="text-xl font-bold" style={{ marginBottom: '8px' }}>No builds found</h2>
          <p className="text-muted-light" style={{ marginBottom: '20px', fontSize: '0.9rem' }}>Try adjusting your filters or be the first to add this type of build.</p>
          <Link href="/auth/register" className="btn-neon">Create Your Garage</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {vehicles.map((vehicle) => (
            <Link
              key={vehicle.id}
              href={`/user/${vehicle.owner?.username}/${vehicle.slug}`}
              className="glass overflow-hidden card-hover group"
            >
              <div style={{ aspectRatio: '16 / 9', position: 'relative', overflow: 'hidden', background: 'rgba(26,26,46,0.5)' }}>
                {vehicle.primary_image_url ? (
                  <img
                    src={vehicle.primary_image_url}
                    alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                    className="group-hover:scale-105 transition-transform duration-500"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : null}
                <span className="text-purple-light" style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, padding: '4px 8px', borderRadius: '4px', background: 'rgba(12,12,20,0.8)', border: '1px solid rgba(124,58,237,0.3)' }}>
                  {vehicle.build_status?.replace('_', ' ')}
                </span>
              </div>

              <div style={{ padding: '16px' }}>
                <h3 className="font-bold text-foreground group-hover:text-purple-light transition-colors" style={{ fontSize: '0.95rem' }}>
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </h3>
                <p className="text-muted-light" style={{ fontSize: '13px', marginTop: '4px' }}>
                  {vehicle.color}
                  {vehicle.horsepower && <span> · {vehicle.horsepower}</span>}
                </p>
                {vehicle.owner?.location && (
                  <p className="text-muted" style={{ fontSize: '12px', marginTop: '4px' }}>{vehicle.owner.location}</p>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', overflow: 'hidden', background: 'rgba(26,26,46,0.5)' }}>
                      {vehicle.owner?.avatar_url ? (
                        <img src={vehicle.owner.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div className="text-muted" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
                          {vehicle.owner?.username?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span className="text-muted-light" style={{ fontSize: '12px' }}>{vehicle.owner?.username}</span>
                  </div>
                  <div className="text-muted" style={{ display: 'flex', gap: '10px', fontSize: '12px' }}>
                    <span>{vehicle.props_count || 0} props</span>
                    <span>{vehicle.view_count || 0} views</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
