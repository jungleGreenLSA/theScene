import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import EventPhotoUpload from '@/components/EventPhotoUpload'
import EventPhotoFeed from '@/components/EventPhotoFeed'
import EventCheckIn from '@/components/EventCheckIn'

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
  const isUpcoming = !isCompleted && !isActive

  // Countdown calculation
  const now = new Date()
  const diff = eventDate.getTime() - now.getTime()
  const daysLeft = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hoursLeft = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const isToday = daysLeft === 0 && diff > 0

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '80px 32px 40px' }}>
      <Link href="/events" style={{ fontSize: '13px', color: '#8892a4', display: 'block', marginBottom: '20px' }}>&larr; Back to Events</Link>

      {/* Event Header */}
      <div className="glass glow-purple" style={{ overflow: 'hidden', marginBottom: '24px' }}>
        <div style={{ height: '280px', background: 'rgba(26,26,46,0.5)', position: 'relative', overflow: 'hidden' }}>
          {event.cover_image_url ? (
            <img src={event.cover_image_url} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(249,115,22,0.1))' }}>
              <span style={{ fontSize: '64px' }}>🏁</span>
            </div>
          )}

          {/* Status badge */}
          <div style={{ position: 'absolute', top: '14px', right: '14px' }}>
            {isCompleted ? (
              <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, padding: '6px 14px', borderRadius: '20px', background: 'rgba(12,12,20,0.8)', color: '#8892a4', border: '1px solid rgba(255,255,255,0.06)' }}>Completed</span>
            ) : isActive || isToday ? (
              <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, padding: '6px 14px', borderRadius: '20px', background: 'rgba(249,115,22,0.9)', color: '#0c0c14' }}>Live Now</span>
            ) : (
              <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, padding: '6px 14px', borderRadius: '20px', background: 'rgba(124,58,237,0.8)', color: 'white' }}>Upcoming</span>
            )}
          </div>

          {/* Date badge */}
          <div style={{ position: 'absolute', bottom: '14px', left: '14px', background: 'rgba(12,12,20,0.9)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '10px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: '#fb923c', fontWeight: 700, textTransform: 'uppercase' }}>
              {eventDate.toLocaleDateString('en-US', { month: 'short' })}
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#e2e4e9', lineHeight: 1 }}>{eventDate.getDate()}</div>
            <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>{eventDate.getFullYear()}</div>
          </div>
        </div>

        <div style={{ padding: '24px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#e2e4e9', marginBottom: '8px' }}>{event.title}</h1>

          {/* Countdown */}
          {isUpcoming && diff > 0 && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '8px', background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)', marginBottom: '14px' }}>
              <span style={{ fontSize: '13px' }}>⏳</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#fb923c' }}>
                {daysLeft > 0 ? `${daysLeft} day${daysLeft !== 1 ? 's' : ''} ${hoursLeft}h` : `${hoursLeft} hours`} until showtime
              </span>
            </div>
          )}
          {isToday && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '8px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', marginBottom: '14px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#22c55e' }}>🏁 Happening today!</span>
            </div>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '14px', color: '#8892a4', marginBottom: '14px' }}>
            <span>📅 {eventDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} at {eventDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
            {event.location_name && <span>📍 {event.location_name}</span>}
            <span>👥 {event.rsvp_count || 0} interested</span>
          </div>

          {/* RSVP buttons */}
          {!isCompleted && (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
              <button style={{ padding: '8px 18px', borderRadius: '20px', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>✅ I&apos;m Going</button>
              <button style={{ padding: '8px 18px', borderRadius: '20px', background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)', color: '#fb923c', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>🤔 Might Go</button>
              <button style={{ padding: '8px 18px', borderRadius: '20px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#6b7280', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>❌ Can&apos;t Make It</button>
            </div>
          )}

          {event.location_address && (
            <p style={{ fontSize: '14px', color: '#8892a4', marginBottom: '8px' }}>
              📮 {event.location_address}
              {event.map_url && (
                <a href={event.map_url} target="_blank" rel="noopener" style={{ marginLeft: '8px', color: '#a78bfa' }}>View Map &rarr;</a>
              )}
            </p>
          )}

          {event.admission_info && (
            <p style={{ fontSize: '14px', color: '#8892a4', marginBottom: '14px' }}>🎟️ {event.admission_info}</p>
          )}

          {/* Organizer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', background: 'rgba(26,26,46,0.5)', backgroundImage: event.organizer?.avatar_url ? `url(${event.organizer.avatar_url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {!event.organizer?.avatar_url && <span style={{ fontSize: '11px', color: '#6b7280' }}>{event.organizer?.username?.charAt(0).toUpperCase()}</span>}
            </div>
            <div>
              <p style={{ fontSize: '11px', color: '#6b7280' }}>Organized by</p>
              <Link href={`/user/${event.organizer?.username}`} style={{ fontSize: '14px', fontWeight: 600, color: '#e2e4e9' }}>
                {event.organizer?.display_name || event.organizer?.username}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {event.description && (
        <div className="glass" style={{ padding: '24px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#e2e4e9', marginBottom: '12px' }}>About This Event</h2>
          <p style={{ fontSize: '14px', color: '#9ca3af', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{event.description}</p>
        </div>
      )}

      {/* Categories */}
      {event.categories && event.categories.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
          {event.categories.map((cat: string) => (
            <span key={cat} style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, padding: '5px 14px', borderRadius: '20px', background: 'rgba(124,58,237,0.1)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.2)' }}>
              {cat}
            </span>
          ))}
        </div>
      )}

      {/* Attendees / RSVPs */}
      {rsvps && rsvps.length > 0 && (
        <div className="glass" style={{ padding: '24px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#e2e4e9', marginBottom: '14px' }}>👥 Who&apos;s Going</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {rsvps.map((rsvp) => (
              <Link key={rsvp.id} href={`/user/${rsvp.user?.username}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 12px 5px 5px', borderRadius: '20px', background: 'rgba(18,18,30,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', overflow: 'hidden', background: 'rgba(26,26,46,0.5)', backgroundImage: rsvp.user?.avatar_url ? `url(${rsvp.user.avatar_url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {!rsvp.user?.avatar_url && <span style={{ fontSize: '9px', color: '#6b7280' }}>{rsvp.user?.username?.charAt(0).toUpperCase()}</span>}
                </div>
                <span style={{ fontSize: '12px', color: '#8892a4' }}>{rsvp.user?.display_name || rsvp.user?.username}</span>
                {rsvp.status === 'checked_in' && <span style={{ fontSize: '10px', color: '#22c55e', fontWeight: 700 }}>✓</span>}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Check-In - only day of event */}
      {(isToday || isActive) && (
        <EventCheckIn eventId={event.id} eventTitle={event.title} />
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
