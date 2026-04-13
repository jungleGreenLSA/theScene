'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Event {
  id: string
  title: string
  slug: string
  description: string
  cover_image_url: string
  event_date: string
  end_date: string
  location_name: string
  location_address: string
  admission_info: string
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
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')

  useEffect(() => {
    const fetchEvents = async () => {
      const { data } = await supabase
        .from('events')
        .select(`
          *,
          organizer:profiles(username, display_name, avatar_url)
        `)
        .in('status', ['published', 'active'])
        .order('event_date', { ascending: true })
        .limit(30)

      setEvents((data || []) as Event[])
      setLoading(false)
    }
    fetchEvents()
  }, [])

  const filteredEvents = locationFilter
    ? events.filter(e =>
        e.location_name?.toLowerCase().includes(locationFilter.toLowerCase()) ||
        e.location_address?.toLowerCase().includes(locationFilter.toLowerCase())
      )
    : events

  // Group by month for calendar-ish view
  const eventsByMonth: Record<string, Event[]> = {}
  filteredEvents.forEach(event => {
    const month = new Date(event.event_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    if (!eventsByMonth[month]) eventsByMonth[month] = []
    eventsByMonth[month].push(event)
  })

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Events</h1>
          <p className="text-muted-light mt-1">Car shows, meets, track days, and cruises</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex glass overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 text-xs font-semibold transition-colors ${viewMode === 'list' ? 'bg-purple/20 text-purple-light' : 'text-muted'}`}
            >
              ☰ List
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-2 text-xs font-semibold transition-colors ${viewMode === 'calendar' ? 'bg-purple/20 text-purple-light' : 'text-muted'}`}
            >
              📅 Calendar
            </button>
          </div>
          <Link href="/events/new" className="btn-primary text-xs">
            Create Event
          </Link>
        </div>
      </div>

      {/* Search / Filter */}
      <div className="glass p-4 mb-8">
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            placeholder="Filter by city, state, or zip code..."
            className="input flex-1"
          />
          <select className="input md:w-48">
            <option value="">All Categories</option>
            <option>Car Show</option>
            <option>Car Meet</option>
            <option>Track Day</option>
            <option>Cruise</option>
            <option>Swap Meet</option>
            <option>Drag Race</option>
            <option>Autocross</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <div key={i} className="glass overflow-hidden animate-pulse">
              <div className="h-44 bg-surface-light" />
              <div className="p-5 space-y-3">
                <div className="h-4 bg-surface-light rounded w-3/4" />
                <div className="h-3 bg-surface-light rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="glass p-16 text-center">
          <span className="text-6xl block mb-4">📅</span>
          <h2 className="text-xl font-bold mb-2">No upcoming events</h2>
          <p className="text-muted-light mb-6">Be the first to list a car show or meet on The Scene.</p>
          <Link href="/events/new" className="btn-neon">Create an Event</Link>
        </div>
      ) : viewMode === 'calendar' ? (
        /* ===== CALENDAR VIEW (grouped by month) ===== */
        <div className="space-y-10">
          {Object.entries(eventsByMonth).map(([month, monthEvents]) => (
            <div key={month}>
              <h2 className="text-xl font-bold text-purple-light mb-4 flex items-center gap-2">
                📅 {month}
              </h2>
              <div className="space-y-3">
                {monthEvents.map((event) => {
                  const d = new Date(event.event_date)
                  return (
                    <Link key={event.id} href={`/events/${event.slug}`} className="glass p-4 flex items-center gap-5 card-hover group">
                      <div className="flex-shrink-0 w-16 text-center">
                        <div className="text-xs text-neon-light font-bold uppercase">{d.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                        <div className="text-2xl font-bold text-foreground">{d.getDate()}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-foreground group-hover:text-purple-light transition-colors truncate">{event.title}</h3>
                        <p className="text-sm text-muted-light truncate">📍 {event.location_name || event.location_address || 'TBD'}</p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <span className="text-sm text-muted">👥 {event.rsvp_count || 0}</span>
                        {event.categories && event.categories.length > 0 && (
                          <span className="block text-[10px] uppercase tracking-wider text-purple-light mt-1">{event.categories[0]}</span>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ===== LIST/CARD VIEW ===== */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => {
            const eventDate = new Date(event.event_date)
            const month = eventDate.toLocaleDateString('en-US', { month: 'short' })
            const day = eventDate.getDate()

            return (
              <Link key={event.id} href={`/events/${event.slug}`} className="glass overflow-hidden card-hover group">
                <div className="h-44 bg-surface-light relative overflow-hidden">
                  {event.cover_image_url ? (
                    <img src={event.cover_image_url} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple/10 to-neon/10">
                      <span className="text-4xl">🏁</span>
                    </div>
                  )}
                  <div className="absolute top-3 left-3 bg-background/90 border border-border rounded-lg px-3 py-2 text-center">
                    <div className="text-xs text-neon-light font-bold uppercase">{month}</div>
                    <div className="text-xl font-bold text-foreground leading-none">{day}</div>
                  </div>
                  {/* Check-in badge for active events */}
                  {event.status === 'active' && (
                    <div className="absolute top-3 right-3 bg-neon/90 text-background text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded animate-pulse">
                      Live Now
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <h3 className="font-bold text-foreground group-hover:text-purple-light transition-colors mb-2">
                    {event.title}
                  </h3>
                  <p className="text-sm text-muted-light flex items-center gap-2 mb-1">
                    📍 {event.location_name || event.location_address || 'TBD'}
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-sm text-muted">👥 {event.rsvp_count || 0} interested</span>
                    {event.status === 'active' && (
                      <span className="btn-neon text-[10px] py-1 px-3">Check In</span>
                    )}
                  </div>

                  {event.categories && event.categories.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {event.categories.slice(0, 3).map((cat: string) => (
                        <span key={cat} className="text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded bg-purple/10 text-purple-light border border-purple/20">
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
