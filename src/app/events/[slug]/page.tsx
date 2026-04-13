import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import EventPhotoUpload from '@/components/EventPhotoUpload'
import EventPhotoFeed from '@/components/EventPhotoFeed'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('events').select('title').eq('slug', slug).single()
  if (!data) return { title: 'Not Found' }
  return { title: data.title }
}

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: event } = await supabase
    .from('events')
    .select(`
      *,
      organizer:profiles(username, display_name, avatar_url)
    `)
    .eq('slug', slug)
    .single()

  if (!event) return notFound()

  const { data: rsvps } = await supabase
    .from('event_rsvps')
    .select(`
      *,
      user:profiles(username, display_name, avatar_url)
    `)
    .eq('event_id', event.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const { data: photoPosts } = await supabase
    .from('event_photo_posts')
    .select(`
      *,
      author:profiles(username, display_name, avatar_url),
      vehicle:vehicles(year, make, model, color, slug, owner_id)
    `)
    .eq('event_id', event.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const eventDate = new Date(event.event_date)
  const isCompleted = event.status === 'completed' || eventDate < new Date()
  const isActive = event.status === 'active'

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Back link */}
      <Link href="/events" className="text-sm text-muted-light hover:text-purple-light mb-6 block">&larr; Back to Events</Link>

      {/* Event Header */}
      <div className="glass overflow-hidden mb-8 glow-purple">
        <div className="h-64 md:h-80 bg-surface-light relative overflow-hidden">
          {event.cover_image_url ? (
            <img src={event.cover_image_url} alt={event.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple/15 to-neon/10">
              <span className="text-6xl">🏁</span>
            </div>
          )}

          {/* Status badge */}
          <div className="absolute top-4 right-4">
            {isCompleted ? (
              <span className="text-xs uppercase tracking-wider font-bold px-3 py-1.5 rounded-full bg-background/80 text-muted-light border border-border">
                Completed
              </span>
            ) : isActive ? (
              <span className="text-xs uppercase tracking-wider font-bold px-3 py-1.5 rounded-full bg-neon/90 text-background animate-pulse">
                Live Now
              </span>
            ) : (
              <span className="text-xs uppercase tracking-wider font-bold px-3 py-1.5 rounded-full bg-purple/80 text-white">
                Upcoming
              </span>
            )}
          </div>

          {/* Date badge */}
          <div className="absolute bottom-4 left-4 bg-background/90 border border-border rounded-lg px-4 py-3 text-center">
            <div className="text-xs text-neon-light font-bold uppercase">
              {eventDate.toLocaleDateString('en-US', { month: 'short' })}
            </div>
            <div className="text-2xl font-bold text-foreground leading-none">{eventDate.getDate()}</div>
            <div className="text-xs text-muted mt-0.5">{eventDate.getFullYear()}</div>
          </div>
        </div>

        <div className="p-6 md:p-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">{event.title}</h1>

          <div className="flex flex-wrap gap-4 text-sm text-muted-light mb-4">
            <span>📅 {eventDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} at {eventDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
            {event.location_name && <span>📍 {event.location_name}</span>}
            <span>👥 {event.rsvp_count || 0} interested</span>
          </div>

          {event.location_address && (
            <p className="text-sm text-muted-light mb-2">
              📮 {event.location_address}
              {event.map_url && (
                <a href={event.map_url} target="_blank" rel="noopener" className="ml-2 text-purple-light hover:text-neon-light">
                  View Map &rarr;
                </a>
              )}
            </p>
          )}

          {event.admission_info && (
            <p className="text-sm text-muted-light mb-4">🎟️ {event.admission_info}</p>
          )}

          {/* Organizer */}
          <div className="flex items-center gap-3 pt-4 border-t border-border">
            <div className="w-8 h-8 rounded-full bg-surface-light overflow-hidden flex items-center justify-center">
              {event.organizer?.avatar_url ? (
                <img src={event.organizer.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-muted">{event.organizer?.username?.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div>
              <p className="text-xs text-muted">Organized by</p>
              <Link href={`/user/${event.organizer?.username}`} className="text-sm font-semibold text-foreground hover:text-purple-light">
                {event.organizer?.display_name || event.organizer?.username}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {event.description && (
        <div className="glass p-6 mb-8">
          <h2 className="text-lg font-bold text-foreground mb-3">About This Event</h2>
          <p className="text-muted-light leading-relaxed whitespace-pre-wrap">{event.description}</p>
        </div>
      )}

      {/* Categories */}
      {event.categories && event.categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {event.categories.map((cat: string) => (
            <span key={cat} className="text-xs uppercase tracking-wider font-semibold px-3 py-1.5 rounded-full bg-purple/10 text-purple-light border border-purple/20">
              {cat}
            </span>
          ))}
        </div>
      )}

      {/* Attendees / RSVPs */}
      {rsvps && rsvps.length > 0 && (
        <div className="glass p-6 mb-8">
          <h2 className="text-lg font-bold text-foreground mb-4">👥 Who&apos;s Going</h2>
          <div className="flex flex-wrap gap-3">
            {rsvps.map((rsvp) => (
              <Link key={rsvp.id} href={`/user/${rsvp.user?.username}`} className="flex items-center gap-2 bg-surface rounded-full px-3 py-1.5 border border-border hover:border-purple/20 transition-colors">
                <div className="w-6 h-6 rounded-full bg-surface-light overflow-hidden">
                  {rsvp.user?.avatar_url ? (
                    <img src={rsvp.user.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-muted">
                      {rsvp.user?.username?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <span className="text-xs text-muted-light">{rsvp.user?.display_name || rsvp.user?.username}</span>
                {rsvp.status === 'checked_in' && <span className="text-[10px] text-neon-light font-bold">✓</span>}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Post-Event Photo Section */}
      {isCompleted && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-foreground">📸 Photos from {event.title}</h2>
              <p className="text-sm text-muted-light mt-1">Share your photos and relive the event with the community.</p>
            </div>
          </div>

          {/* Upload form */}
          <EventPhotoUpload eventId={event.id} eventTitle={event.title} />

          {/* Photo feed */}
          <EventPhotoFeed photoPosts={photoPosts || []} />
        </div>
      )}
    </div>
  )
}
