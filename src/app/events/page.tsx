'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import SceneHeatmap from '@/components/SceneHeatmap'
import { getNearbyPrefs } from '@/lib/nearbyFilter'

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
      let q = supabase
        .from('events')
        .select(`*, organizer:profiles(username, display_name, avatar_url)`)
        .in('status', ['published', 'active'])
        .order('event_date', { ascending: true })
        .limit(30)
      if (prefs.filterEvents && prefs.state) {
        q = q.eq('state', prefs.state)
        setNearbyState(prefs.state)
      }
      const { data } = await q
      setEvents((data || []) as Event[])
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
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '80px 32px 40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="text-3xl font-bold">Events</h1>
          <p className="text-muted-light" style={{ marginTop: '4px', fontSize: '0.9rem' }}>
            Car shows, meets, track days, and cruises{nearbyState && <> · filtered to <span style={{ color: '#fb923c' }}>{nearbyState}</span></>}
          </p>
        </div>
        <Link href="/events/create" className="btn-primary text-xs">Create Event</Link>
      </div>

      {/* Search + date range */}
      <div className="glass" style={{ padding: '20px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input
          type="text"
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          placeholder="Filter by city, state, or zip code..."
          className="input"
          style={{ width: '100%' }}
        />
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: '#6b7280' }}>Date range</span>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input" style={{ flex: '1 1 140px', maxWidth: '200px' }} />
          <span style={{ fontSize: '12px', color: '#6b7280' }}>to</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input" style={{ flex: '1 1 140px', maxWidth: '200px' }} />
          {(dateFrom || dateTo) && (
            <button onClick={() => { setDateFrom(''); setDateTo('') }} style={{ padding: '8px 14px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Clear</button>
          )}
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <SceneHeatmap type="events" title="Where the Shows Are" />
      </div>

      {/* Results */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {[1,2,3].map(i => (
            <div key={i} className="glass overflow-hidden animate-pulse">
              <div style={{ height: '160px', background: 'rgba(26,26,46,0.5)' }} />
              <div style={{ padding: '16px' }}>
                <div style={{ height: '14px', background: 'rgba(26,26,46,0.5)', borderRadius: '4px', width: '75%', marginBottom: '8px' }} />
                <div style={{ height: '12px', background: 'rgba(26,26,46,0.5)', borderRadius: '4px', width: '50%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="glass text-center" style={{ padding: '48px 32px' }}>
          <h2 className="text-xl font-bold" style={{ marginBottom: '8px' }}>No upcoming events</h2>
          <p className="text-muted-light" style={{ marginBottom: '20px', fontSize: '0.9rem' }}>Be the first to list a car show or meet on The Scene.</p>
          <Link href="/events/create" className="btn-neon">Create an Event</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {filteredEvents.map((event) => {
            const eventDate = new Date(event.event_date)
            const month = eventDate.toLocaleDateString('en-US', { month: 'short' })
            const day = eventDate.getDate()

            return (
              <Link key={event.id} href={`/events/${event.slug}`} className="glass overflow-hidden card-hover group">
                <div style={{ height: '160px', position: 'relative', overflow: 'hidden', background: 'rgba(26,26,46,0.5)' }}>
                  {event.cover_image_url ? (
                    <img src={event.cover_image_url} alt={event.title} className="group-hover:scale-105 transition-transform duration-500" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(249,115,22,0.1))' }} />
                  )}
                  {/* Date badge */}
                  <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(12,12,20,0.9)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '6px 12px', textAlign: 'center' }}>
                    <div className="text-neon-light font-bold" style={{ fontSize: '10px', textTransform: 'uppercase' }}>{month}</div>
                    <div className="text-foreground font-bold" style={{ fontSize: '20px', lineHeight: 1 }}>{day}</div>
                  </div>
                  {/* Live badge */}
                  {event.status === 'active' && (
                    <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(249,115,22,0.9)', color: '#0c0c14', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', padding: '4px 10px', borderRadius: '4px' }}>
                      Live Now
                    </div>
                  )}
                </div>

                <div style={{ padding: '16px' }}>
                  <h3 className="font-bold text-foreground group-hover:text-purple-light transition-colors" style={{ fontSize: '0.95rem', marginBottom: '6px' }}>
                    {event.title}
                  </h3>
                  <p className="text-muted-light" style={{ fontSize: '13px', marginBottom: '4px' }}>
                    {event.location_name || event.location_address || 'TBD'}
                  </p>
                  <p className="text-muted" style={{ fontSize: '13px' }}>
                    {event.rsvp_count || 0} interested
                  </p>

                  {event.categories && event.categories.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                      {event.categories.slice(0, 3).map((cat: string) => (
                        <span key={cat} className="text-purple-light" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, padding: '3px 8px', borderRadius: '4px', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}>
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
