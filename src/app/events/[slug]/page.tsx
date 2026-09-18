import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import EventPhotoUpload from '@/components/EventPhotoUpload'
import EventPhotoFeed from '@/components/EventPhotoFeed'
import EventCheckIn from '@/components/EventCheckIn'
import EventOrganizerActions from '@/components/EventOrganizerActions'
import EventRSVP from '@/components/EventRSVP'
import PropsButton from '@/components/PropsButton'
import ShareButton from '@/components/ShareButton'
import EventComments from '@/components/EventComments'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('events').select('title, city, state, description').eq('slug', slug).single()
  if (!data) return { title: 'Not Found' }
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thescene.fyi'
  const ogUrl = `${siteUrl}/api/og/event/${slug}`
  const description = data.description || `${data.title}${data.city ? ` · ${data.city}, ${data.state}` : ''}`
  return {
    title: data.title,
    description,
    openGraph: { title: data.title, description, images: [ogUrl], type: 'website' },
    twitter: { card: 'summary_large_image', title: data.title, description, images: [ogUrl] },
  }
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
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '80px 16px 40px' }}>
      <Link href="/events" style={{ fontSize: '13px', color: 'var(--color-accent)', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '20px', textDecoration: 'none' }}>&larr; Back to Events</Link>

      {/* Event Header */}
      <div className="panel glow-teal" style={{ overflow: 'hidden', marginBottom: '24px' }}>
        <div style={{ height: '280px', background: 'var(--color-surface-light)', position: 'relative', overflow: 'hidden' }}>
          {event.cover_image_url ? (
            <img src={event.cover_image_url} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover', maxWidth: '100%' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(242,169,0,0.1), rgba(142,163,184,0.1))' }} />
          )}

          {/* Status badge */}
          <div style={{ position: 'absolute', top: '14px', right: '14px' }}>
            {isCompleted ? (
              <span className="chip" style={{ borderRadius: '20px', background: 'rgba(15,16,18,0.8)', color: 'var(--color-muted-light)', borderColor: 'var(--color-border)' }}>Completed</span>
            ) : isActive || isToday ? (
              <span className="chip chip-neon" style={{ borderRadius: '20px' }}>Live Now</span>
            ) : (
              <span className="chip chip-purple" style={{ borderRadius: '20px' }}>Upcoming</span>
            )}
          </div>

          {/* Date badge */}
          <div style={{ position: 'absolute', bottom: '14px', left: '14px', background: 'rgba(15,16,18,0.9)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '10px 16px', textAlign: 'center' }}>
            <div className="spec" style={{ fontSize: '10px', color: 'var(--color-accent)' }}>
              {eventDate.toLocaleDateString('en-US', { month: 'short' })}
            </div>
            <div className="spec" style={{ fontSize: '28px', color: 'var(--color-foreground)', lineHeight: 1 }}>{eventDate.getDate()}</div>
            <div className="spec" style={{ fontSize: '11px', color: 'var(--color-muted)', marginTop: '2px' }}>{eventDate.getFullYear()}</div>
          </div>
        </div>

        <div style={{ padding: '24px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-foreground)', marginBottom: '8px' }}>{event.title}</h1>

          {/* Countdown */}
          {isUpcoming && diff > 0 && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '8px', background: 'rgba(242,169,0,0.08)', border: '1px solid rgba(242,169,0,0.2)', marginBottom: '14px' }}>
              <span className="spec" style={{ fontSize: '13px', color: 'var(--color-accent)' }}>
                {daysLeft > 0 ? `${daysLeft} day${daysLeft !== 1 ? 's' : ''} ${hoursLeft}h` : `${hoursLeft} hours`} until showtime
              </span>
            </div>
          )}
          {isToday && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '8px', background: 'rgba(86,194,113,0.1)', border: '1px solid rgba(86,194,113,0.2)', marginBottom: '14px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-success)' }}>Happening today!</span>
            </div>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '14px', color: 'var(--color-muted-light)', marginBottom: '14px', alignItems: 'center' }}>
            <span className="spec" style={{ fontSize: '14px', color: 'var(--color-muted-light)' }}>{eventDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} at {eventDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
            {event.location_name && <span>{event.location_name}</span>}
            <span><span className="spec">{event.rsvp_count || 0}</span> interested</span>
            <PropsButton targetType="event" targetId={event.id} size="sm" />
            <ShareButton url={`/events/${slug}`} title={event.title} text={`${event.title} on The Scene`} small />
          </div>

          {/* RSVP buttons */}
          {!isCompleted && (
            <div style={{ marginBottom: '14px' }}>
              <EventRSVP eventId={event.id} />
            </div>
          )}

          {event.location_address && (
            <p style={{ fontSize: '14px', color: 'var(--color-muted-light)', marginBottom: '8px' }}>
              {event.location_address}
              {event.map_url && (
                <a href={event.map_url} target="_blank" rel="noopener" style={{ marginLeft: '8px', color: 'var(--color-accent)' }}>View Map &rarr;</a>
              )}
            </p>
          )}

          {event.admission_info && (
            <p style={{ fontSize: '14px', color: 'var(--color-muted-light)', marginBottom: '14px' }}>{event.admission_info}</p>
          )}

          {/* Organizer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '14px', borderTop: '1px solid var(--color-border)' }}>
            <div style={{ width: '36px', height: '36px', minWidth: '36px', borderRadius: '50%', overflow: 'hidden', background: 'var(--color-surface-light)', backgroundImage: event.organizer?.avatar_url ? `url(${event.organizer.avatar_url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--color-border)' }}>
              {!event.organizer?.avatar_url && <span style={{ fontSize: '12px', color: 'var(--color-muted-light)' }}>{event.organizer?.username?.charAt(0).toUpperCase()}</span>}
            </div>
            <div>
              <p className="eyebrow" style={{ marginBottom: '2px', fontSize: '9px' }}>Organized by</p>
              <Link href={`/user/${event.organizer?.username}`} style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-foreground)', textDecoration: 'none' }}>
                {event.organizer?.display_name || event.organizer?.username}
              </Link>
            </div>
          </div>
          {/* Organizer actions */}
          <EventOrganizerActions eventId={event.id} organizerId={event.organizer_id} eventSlug={event.slug} />
        </div>
      </div>

      {/* Description */}
      {event.description && (
        <div className="panel" style={{ padding: '24px', marginBottom: '20px' }}>
          <p className="eyebrow" style={{ marginBottom: '10px' }}>About This Event</p>
          <p style={{ fontSize: '14px', color: 'var(--color-muted-light)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{event.description}</p>
        </div>
      )}

      {/* Categories */}
      {event.categories && event.categories.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
          {event.categories.map((cat: string) => (
            <span key={cat} className="chip chip-purple" style={{ borderRadius: '20px', padding: '5px 14px' }}>
              {cat}
            </span>
          ))}
        </div>
      )}

      {/* Attendees / RSVPs */}
      {rsvps && rsvps.length > 0 && (
        <div className="panel" style={{ padding: '24px', marginBottom: '20px' }}>
          <p className="eyebrow" style={{ marginBottom: '12px' }}>Who&apos;s Going</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {rsvps.map((rsvp) => (
              <Link key={rsvp.id} href={`/user/${rsvp.user?.username}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 12px 5px 5px', borderRadius: '20px', background: 'var(--color-surface-lowest)', border: '1px solid var(--color-border)', textDecoration: 'none', minHeight: '36px' }}>
                <div style={{ width: '26px', height: '26px', minWidth: '26px', borderRadius: '50%', overflow: 'hidden', background: 'var(--color-surface-light)', backgroundImage: rsvp.user?.avatar_url ? `url(${rsvp.user.avatar_url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {!rsvp.user?.avatar_url && <span style={{ fontSize: '9px', color: 'var(--color-muted-light)' }}>{rsvp.user?.username?.charAt(0).toUpperCase()}</span>}
                </div>
                <span style={{ fontSize: '12px', color: 'var(--color-muted-light)' }}>{rsvp.user?.display_name || rsvp.user?.username}</span>
                {rsvp.status === 'checked_in' && <span className="spec" style={{ fontSize: '9px', color: 'var(--color-success)', fontWeight: 700, letterSpacing: '0.5px' }}>HERE</span>}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Check-In - only day of event */}
      {(isToday || isActive) && (
        <EventCheckIn eventId={event.id} eventTitle={event.title} />
      )}

      {/* Comments */}
      <EventComments eventId={event.id} organizerId={event.organizer_id} />

      {/* Post-Event Photo Section */}
      {isCompleted && (
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <p className="eyebrow" style={{ marginBottom: '4px' }}>Event Gallery</p>
              <h2 className="text-xl font-bold text-foreground">Photos from {event.title}</h2>
              <p className="text-muted-light" style={{ fontSize: '13px', marginTop: '4px' }}>Share your photos and relive the event with the community.</p>
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
