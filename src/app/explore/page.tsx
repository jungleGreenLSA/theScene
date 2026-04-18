'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { getNearbyPrefs, filterByRadius, distanceMiles as libDistance } from '@/lib/nearbyFilter'
import { geocodeCityState } from '@/lib/mapbox'
import AddressAutocomplete from '@/components/AddressAutocomplete'

const RADIUS_OPTIONS = [
  { miles: 25, label: '25 mi' },
  { miles: 50, label: '50 mi' },
  { miles: 100, label: '100 mi' },
  { miles: 250, label: '250 mi' },
]
const DEFAULT_RADIUS = 60

// Haversine distance between two lat/lng points in miles.
function distanceMiles(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 3958.8
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

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
  const [locationText, setLocationText] = useState('')
  const [searchCoords, setSearchCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [radius, setRadius] = useState(DEFAULT_RADIUS)
  // In-memory cache of geocoded "City, ST" → coords; persists for the page lifetime
  const geoCache = useRef<Map<string, { lat: number; lng: number } | null>>(new Map())

  const fetchVehicles = async () => {
    setLoading(true)

    let query = supabase
      .from('vehicles')
      .select(`
        *,
        owner:profiles(username, display_name, avatar_url, location)
      `)
      .eq('is_public', true)

    if (search) {
      query = query.or(`make.ilike.%${search}%,model.ilike.%${search}%`)
    }

    query = query.order('props_count', { ascending: false }).limit(48)
    const { data } = await query
    let results = (data || []) as Vehicle[]

    // City+radius filter — geocode each vehicle's owner location once and
    // drop anything farther than `radius` miles from the search point.
    if (searchCoords) {
      const keyed = results.map(v => {
        const parts = (v.owner?.location || '').split(',').map(s => s.trim())
        const city = parts[0] || ''
        const state = (parts[1] || '').toUpperCase().slice(0, 2)
        return { v, key: `${city.toLowerCase()}|${state.toLowerCase()}`, city, state }
      })
      // Geocode uncached keys in parallel
      const missing = keyed.filter(k => k.city && k.state && !geoCache.current.has(k.key))
      await Promise.all(missing.map(async (k) => {
        try { geoCache.current.set(k.key, await geocodeCityState(k.city, k.state)) }
        catch { geoCache.current.set(k.key, null) }
      }))
      results = keyed
        .map(k => {
          const coords = geoCache.current.get(k.key)
          if (!coords) return null
          const dist = distanceMiles(searchCoords, coords)
          if (dist > radius) return null
          return { ...k.v, _distance: dist } as Vehicle & { _distance: number }
        })
        .filter((v): v is Vehicle & { _distance: number } => v !== null)
        .sort((a, b) => a._distance - b._distance)
    }

    // "Only show people near me" toggle from settings (no-op if city search is active)
    if (!searchCoords) {
      const prefs = await getNearbyPrefs(supabase)
      if (prefs.filterPeople && prefs.userCoords) {
        results = await filterByRadius(results, prefs, v => {
          const parts = (v.owner?.location || '').split(',').map(s => s.trim())
          return { city: parts[0] || null, state: parts[1] || null }
        })
        setNearbyState(`${prefs.radius} mi of ${prefs.state}`)
      } else {
        setNearbyState(null)
      }
    }

    setVehicles(results)
    setLoading(false)
  }

  useEffect(() => { fetchVehicles() /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [searchCoords, radius])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchVehicles()
  }

  const clearCity = () => {
    setLocationText('')
    setSearchCoords(null)
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
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'stretch' }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by make or model..."
            className="input"
            style={{ flex: '1 1 200px' }}
          />
          <div style={{ flex: '1 1 220px', minWidth: '220px' }}>
            <AddressAutocomplete
              defaultValue={locationText}
              placeholder="City (e.g. Dallas, TX)"
              mode="city"
              onChange={(a) => {
                const label = [a.city, a.state].filter(Boolean).join(', ')
                setLocationText(label)
                if (a.lat != null && a.lng != null) setSearchCoords({ lat: a.lat, lng: a.lng })
              }}
            />
          </div>
          <button type="submit" className="btn-primary text-xs">Search</button>
        </div>

        {searchCoords && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: '#6b7280' }}>Within</span>
            <div style={{ display: 'inline-flex', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
              {RADIUS_OPTIONS.map(opt => (
                <button
                  key={opt.miles}
                  type="button"
                  onClick={() => setRadius(opt.miles)}
                  style={{
                    padding: '6px 12px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                    background: radius === opt.miles ? 'rgba(124,58,237,0.2)' : 'rgba(18,18,30,0.5)',
                    color: radius === opt.miles ? '#a78bfa' : '#8892a4',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <span style={{ fontSize: '12px', color: '#8892a4' }}>of <span style={{ color: '#a78bfa', fontWeight: 600 }}>{locationText}</span></span>
            <button type="button" onClick={clearCity} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#6b7280', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Clear</button>
          </div>
        )}
      </form>

      {/* Results count */}
      {!loading && (
        <p className="text-muted" style={{ fontSize: '13px', marginBottom: '16px' }}>{vehicles.length} build{vehicles.length !== 1 ? 's' : ''} found</p>
      )}

      {/* Vehicle Grid / Results */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {[1,2,3].map(i => (
            <div key={i} className="glass overflow-hidden animate-pulse">
              <div style={{ aspectRatio: '2 / 1', background: 'rgba(26,26,46,0.5)' }} />
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
              <div style={{ aspectRatio: '2 / 1', position: 'relative', overflow: 'hidden', background: 'rgba(26,26,46,0.5)' }}>
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
