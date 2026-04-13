'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

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

  useEffect(() => {
    fetchClubs()
  }, [])

  const fetchClubs = async () => {
    setLoading(true)

    const { data } = await supabase
      .from('clubs')
      .select(`
        *,
        locations:club_locations(city, state, label),
        members:club_members(id)
      `)
      .eq('is_public', true)
      .order('name')

    const mapped = (data || []).map((c: any) => ({
      ...c,
      member_count: c.members?.length || 0,
    }))

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
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Car <span className="text-purple-light">Clubs</span></h1>
          <p className="text-muted-light mt-1">Find your crew. Join your local scene.</p>
        </div>
        <Link href="/clubs/create" className="btn-primary text-xs">
          Start a Club
        </Link>
      </div>

      {/* Search */}
      <div className="glass p-4 mb-8">
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            value={locationSearch}
            onChange={(e) => setLocationSearch(e.target.value)}
            placeholder="Search clubs by name, city, or state... (e.g. &quot;Scranton PA&quot;, &quot;Texas&quot;, &quot;Lone Star&quot;)"
            className="input flex-1"
          />
        </div>
        <p className="text-xs text-muted mt-2">
          Try: &quot;car clubs near Scranton PA&quot;, &quot;car clubs in Texas&quot;, or search by club name
        </p>
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <div key={i} className="glass overflow-hidden animate-pulse">
              <div className="h-36 bg-surface-light" />
              <div className="p-5 space-y-3">
                <div className="h-4 bg-surface-light rounded w-3/4" />
                <div className="h-3 bg-surface-light rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredClubs.length === 0 ? (
        <div className="glass p-16 text-center">
          <span className="text-6xl block mb-4">🏁</span>
          <h2 className="text-xl font-bold mb-2">No clubs found</h2>
          <p className="text-muted-light mb-6">
            {locationSearch ? `No clubs match "${locationSearch}". Start one!` : 'Be the first to start a car club on The Scene.'}
          </p>
          <Link href="/clubs/create" className="btn-neon">Start a Club</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClubs.map((club) => (
            <Link key={club.id} href={`/clubs/${club.slug}`} className="glass overflow-hidden card-hover group">
              <div className="h-36 bg-surface-light relative overflow-hidden">
                {club.cover_image_url ? (
                  <img src={club.cover_image_url} alt={club.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple/10 to-neon/10">
                    <span className="text-4xl">🏁</span>
                  </div>
                )}
                {club.logo_url && (
                  <div className="absolute bottom-3 left-3 w-12 h-12 rounded-full bg-background border-2 border-border overflow-hidden">
                    <img src={club.logo_url} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="p-5">
                <h3 className="font-bold text-foreground group-hover:text-purple-light transition-colors">{club.name}</h3>

                {club.locations && club.locations.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {club.locations.slice(0, 3).map((loc, i) => (
                      <span key={i} className="text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded bg-purple/10 text-purple-light border border-purple/20">
                        📍 {loc.city}, {loc.state}
                      </span>
                    ))}
                    {club.locations.length > 3 && (
                      <span className="text-[10px] text-muted px-2 py-1">+{club.locations.length - 3} more</span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                  <span className="text-sm text-muted">👥 {club.member_count} member{club.member_count !== 1 ? 's' : ''}</span>
                </div>

                {club.description && (
                  <p className="text-xs text-muted-light mt-2 line-clamp-2">{club.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
