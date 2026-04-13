'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

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

  // Filters
  const [search, setSearch] = useState('')
  const [make, setMake] = useState('')
  const [color, setColor] = useState('')
  const [buildStatus, setBuildStatus] = useState('')
  const [location, setLocation] = useState('')
  const [partSearch, setPartSearch] = useState('')
  const [sortBy, setSortBy] = useState('props')
  const [showAdvanced, setShowAdvanced] = useState(false)

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
    if (color) query = query.ilike('color', `%${color}%`)
    if (buildStatus) query = query.eq('build_status', buildStatus)
    if (search) {
      query = query.or(`make.ilike.%${search}%,model.ilike.%${search}%`)
    }

    if (sortBy === 'props') {
      query = query.order('props_count', { ascending: false })
    } else if (sortBy === 'newest') {
      query = query.order('created_at', { ascending: false })
    } else if (sortBy === 'views') {
      query = query.order('view_count', { ascending: false })
    }

    query = query.limit(48)

    const { data } = await query

    let results = (data || []) as Vehicle[]

    // Client-side location filter (searches owner.location)
    if (location) {
      const loc = location.toLowerCase()
      results = results.filter(v =>
        v.owner?.location?.toLowerCase().includes(loc)
      )
    }

    setVehicles(results)
    setLoading(false)
  }

  useEffect(() => {
    fetchVehicles()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchVehicles()
  }

  // Search mods by part name
  const searchByPart = async () => {
    if (!partSearch.trim()) return
    setLoading(true)

    const { data: mods } = await supabase
      .from('vehicle_modifications')
      .select('vehicle_id, item, brand')
      .or(`item.ilike.%${partSearch}%,brand.ilike.%${partSearch}%`)
      .limit(100)

    if (mods && mods.length > 0) {
      const vehicleIds = [...new Set(mods.map(m => m.vehicle_id))]

      const { data } = await supabase
        .from('vehicles')
        .select(`
          *,
          owner:profiles(username, display_name, avatar_url, location)
        `)
        .in('id', vehicleIds)
        .eq('is_public', true)

      setVehicles((data || []) as Vehicle[])
    } else {
      setVehicles([])
    }

    setLoading(false)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-2">Explore <span className="text-purple-light">The Scene</span></h1>
        <p className="text-muted-light">Discover builds from enthusiasts across the country</p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="glass p-5 mb-4">
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by make or model... (e.g. Corvette, Civic, Mustang)"
            className="input flex-1"
          />
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location or zip code..."
            className="input md:w-56"
          />
          <select value={make} onChange={(e) => setMake(e.target.value)} className="input md:w-44">
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

        {/* Toggle advanced */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-purple-light mt-3 hover:text-neon-light transition-colors"
        >
          {showAdvanced ? '▲ Hide' : '▼ Show'} Advanced Filters
        </button>

        {/* Advanced filters */}
        {showAdvanced && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4 pt-4 border-t border-border">
            <input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="Color..."
              className="input"
            />
            <select value={buildStatus} onChange={(e) => setBuildStatus(e.target.value)} className="input">
              <option value="">Build Status</option>
              <option value="stock">Stock</option>
              <option value="lightly_modified">Lightly Modified</option>
              <option value="modified">Modified</option>
              <option value="full_build">Full Build</option>
              <option value="race_car">Race Car</option>
              <option value="project">Project</option>
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="input">
              <option value="props">Most Props</option>
              <option value="newest">Newest</option>
              <option value="views">Most Viewed</option>
            </select>
            <div className="col-span-2 flex gap-2">
              <input
                type="text"
                value={partSearch}
                onChange={(e) => setPartSearch(e.target.value)}
                placeholder="Search by part (e.g. Pedders, Kooks, Magnuson)..."
                className="input flex-1"
              />
              <button type="button" onClick={searchByPart} className="btn-outline text-xs whitespace-nowrap">
                🔧 Find by Part
              </button>
            </div>
          </div>
        )}
      </form>

      {/* AI Search Teaser */}
      <div className="glass p-4 mb-8 border border-neon/20 flex items-center gap-4">
        <span className="text-2xl">🤖</span>
        <div className="flex-1">
          <p className="text-sm text-foreground font-semibold">AI Search Coming Soon</p>
          <p className="text-xs text-muted-light">
            &quot;Find me all red Corvettes within 50 miles of 75201&quot; -- natural language search is on our roadmap.
          </p>
        </div>
        <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded bg-neon/10 text-neon-light border border-neon/20">
          Soon
        </span>
      </div>

      {/* Results count */}
      {!loading && (
        <p className="text-sm text-muted mb-4">{vehicles.length} build{vehicles.length !== 1 ? 's' : ''} found</p>
      )}

      {/* Vehicle Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="glass overflow-hidden animate-pulse">
              <div className="h-48 bg-surface-light" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-surface-light rounded w-3/4" />
                <div className="h-3 bg-surface-light rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : vehicles.length === 0 ? (
        <div className="glass p-16 text-center">
          <span className="text-6xl block mb-4">🔍</span>
          <h2 className="text-xl font-bold mb-2">No builds found</h2>
          <p className="text-muted-light mb-6">Try adjusting your filters or be the first to add this type of build.</p>
          <Link href="/auth/register" className="btn-neon">Create Your Garage</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((vehicle) => (
            <Link
              key={vehicle.id}
              href={`/user/${vehicle.owner?.username}/${vehicle.slug}`}
              className="glass overflow-hidden card-hover group"
            >
              <div className="h-48 bg-surface-light relative overflow-hidden">
                {vehicle.primary_image_url ? (
                  <img
                    src={vehicle.primary_image_url}
                    alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-4xl">🚗</span>
                  </div>
                )}
                <span className="absolute top-3 right-3 text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded bg-background/80 text-purple-light border border-purple/30">
                  {vehicle.build_status?.replace('_', ' ')}
                </span>
              </div>

              <div className="p-4">
                <h3 className="font-bold text-foreground group-hover:text-purple-light transition-colors">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </h3>
                <p className="text-sm text-muted-light mt-1">
                  {vehicle.color}
                  {vehicle.horsepower && <span> · {vehicle.horsepower}</span>}
                </p>
                {vehicle.owner?.location && (
                  <p className="text-xs text-muted mt-1">📍 {vehicle.owner.location}</p>
                )}

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-surface-light overflow-hidden">
                      {vehicle.owner?.avatar_url ? (
                        <img src={vehicle.owner.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-muted">
                          {vehicle.owner?.username?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-muted-light">{vehicle.owner?.username}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted">
                    <span>🤙 {vehicle.props_count || 0}</span>
                    <span>👁 {vehicle.view_count || 0}</span>
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
