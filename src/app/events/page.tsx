'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import SceneHeatmap from '@/components/SceneHeatmap'
import { getNearbyPrefs, filterByRadius } from '@/lib/nearbyFilter'

interface Event {
  id: string
  title: string
  slug: string
  description: string
  cover_image_url: string
  event_date: string
  location_name: string
  location_address: string
  categories: string[]
  status: string
  rsvp_count: number
  organizer: {
    username: string
    display_name: string
    avatar_url: string
  }
}

export default function EventsPage() {
  const supabase = createClient()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [locationFilter, setLocationFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const [nearbyState, setNearbyState] = useState<string | null>(null)

  useEffect(() => {
    const fetchEvents = async () => {
      const prefs = await getNearbyPrefs(supabase)
      const q = supabase
        .from('events')
        .select(`*, organizer:profiles(username, display_name, avatar_url)`)
        .in('status', ['published', 'active'])
        .order('event_date', { ascending: true })
        .limit(60)
      const { data } = await q
      let results = (data || []) as (Event & { city?: string; state?: string; lat?: number | null; lng?: number | null })[]
      if (prefs.filterEvents && prefs.userCoords) {
        results = await filterByRadius(results, prefs, e => ({ lat: e.lat ?? null, lng: e.lng ?? null, city: e.city ?? null, state: e.state ?? null }))
        setNearbyState(`${prefs.radius} mi of ${prefs.state}`)
      }
      setEvents(results as Event[])
      setLoading(false)
    }
    fetchEvents()
  }, [])

  const filteredEvents = events.filter(e => {
    if (locationFilter) {
      const hay = `${e.location_name || ''} ${e.location_address || ''}`.toLowerCase()
      if (!hay.includes(locationFilter.toLowerCase())) return false
    }
    if (dateFrom && new Date(e.event_date) < new Date(dateFrom)) return false
    if (dateTo) {
      const end = new Date(dateTo)
      end.setHours(23, 59, 59, 999)
      if (new Date(e.event_date) > end) return false
    }
    return true
  })

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '80px 16px 40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <p className="eyebrow" style={{ marginBottom: '4px' }}>The Scene</p>
          <h1 className="text-3xl font-bold">Events</h1>
          <p className="text-muted-light" style={{ marginTop: '4px', fontSize: '0.9rem' }}>
            Car shows, meets, track days, and cruises{nearbyState && <> · filtered to <span className="text-glow-teal">{nearbyState}</span></>}
          </p>
        </div>
        <Link href="/events/create" className="btn-primary" style={{ fontSize: '13px', minHeight: '44px' }}>Create Event</Link>
      </div>

      {/* Search + date range */}
      <div className="panel" style={{ padding: '20px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input
          type="text"
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          placeholder="Filter by city, state, or zip code..."
          className="input"
          style={{ width: '100%' }}
        />
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="eyebrow">Date range</span>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input" style={{ flex: '1 1 140px', maxWidth: '200px', minHeight: '44px' }} />
          <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>to</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input" style={{ flex: '1 1 140px', maxWidth: '200px', minHeight: '44px' }} />
          {(dateFrom || dateTo) && (
            <button onClick={() => { setDateFrom(''); setDateTo('') }} className="btn-outline" style={{ padding: '8px 14px', fontSize: '12px', minHeight: '44px' }}>Clear</button>
          )}
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <SceneHeatmap type="events" title="Where the Shows Are" />
      </div>

      {/* Results */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '16px' }}>
          {[1,2,3].map(i => (
            <div key={i} className="panel overflow-hidden animate-pulse">
              <div style={{ height: '160px', background: 'var(--color-surface-light)' }} />
              <div style={{ padding: '16px' }}>
                <div style={{ height: '14px', background: 'var(--color-surface-light)', borderRadius: '4px', width: '75%', marginBottom: '8px' }} />
                <div style={{ height: '12px', background: 'var(--color-surface-light)', borderRadius: '4px', width: '50%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="panel text-center" style={{ padding: '48px 32px' }}>
          <h2 className="text-xl font-bold" style={{ marginBottom: '8px' }}>No upcoming events</h2>
          <p className="text-muted-light" style={{ marginBottom: '20px', fontSize: '0.9rem' }}>Be the first to list a car show or meet on The Scene.</p>
          <Link href="/events/create" className="btn-primary">Create an Event</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '16px' }}>
          {filteredEvents.map((event) => {
            const eventDate = new Date(event.event_date)
            const month = eventDate.toLocaleDateString('en-US', { month: 'short' })
            const day = eventDate.getDate()

            return (
              <Link key={event.id} href={`/events/${event.slug}`} className="panel overflow-hidden card-hover group">
                <div style={{ height: '160px', position: 'relative', overflow: 'hidden', background: 'var(--color-surface-light)' }}>
                  {event.cover_image_url ? (
                    <img src={event.cover_image_url} alt={event.title} className="group-hover:scale-105 transition-transform duration-500" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(242,169,0,0.08), rgba(142,163,184,0.08))' }} />
                  )}
                  {/* Date badge */}
                  <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(15,16,18,0.9)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '6px 12px', textAlign: 'center' }}>
                    <div className="spec" style={{ fontSize: '10px', color: 'var(--color-accent)' }}>{month}</div>
                    <div className="spec" style={{ fontSize: '20px', lineHeight: 1, color: 'var(--color-foreground)' }}>{day}</div>
                  </div>
                  {/* Live badge */}
                  {event.status === 'active' && (
                    <div className="chip-neon" style={{ position: 'absolute', top: '10px', right: '10px', borderRadius: '4px' }}>
                      Live Now
                    </div>
                  )}
                </div>

                <div style={{ padding: '16px' }}>
                  <h3 className="font-bold text-foreground" style={{ fontSize: '0.95rem', marginBottom: '6px', transition: 'color 0.2s' }}>
                    {event.title}
                  </h3>
                  <p className="text-muted-light" style={{ fontSize: '13px', marginBottom: '4px' }}>
                    {event.location_name || event.location_address || 'TBD'}
                  </p>
                  <p className="text-muted" style={{ fontSize: '13px' }}>
                    <span className="spec">{event.rsvp_count || 0}</span> interested
                  </p>

                  {event.categories && event.categories.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                      {event.categories.slice(0, 3).map((cat: string) => (
                        <span key={cat} className="chip chip-purple" style={{ borderRadius: '4px' }}>
                          {cat}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
