'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface GuestbookItem {
  id: string
  content: string
  created_at: string
  vehicle: { slug: string; year: number; make: string; model: string; owner: { username: string } } | null
}

interface WwydVoteItem {
  id: string
  created_at: string
  option: { label: string } | null
  post: { id: string; title: string } | null
}

interface SightingItem {
  id: string
  image_url: string
  description: string
  location_name: string
  city: string
  state: string
  created_at: string
}

interface EventItem {
  id: string
  title: string
  slug: string
  event_date: string
  city: string
  state: string
  status: string
}

interface ClubItem {
  id: string
  name: string
  slug: string
  description: string
  created_at: string
}

interface WwydPostItem {
  id: string
  title: string
  budget: string
  created_at: string
}

interface ListingItem {
  id: string
  title: string
  listing_type: string
  price: number
  status: string
  created_at: string
}

export default function ActivityPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [guestbook, setGuestbook] = useState<GuestbookItem[]>([])
  const [votes, setVotes] = useState<WwydVoteItem[]>([])
  const [sightings, setSightings] = useState<SightingItem[]>([])
  const [events, setEvents] = useState<EventItem[]>([])
  const [clubs, setClubs] = useState<ClubItem[]>([])
  const [wwydPosts, setWwydPosts] = useState<WwydPostItem[]>([])
  const [listings, setListings] = useState<ListingItem[]>([])
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState<'events' | 'clubs' | 'listings' | 'wwydPosts' | 'guestbook' | 'wwyd' | 'sightings'>('events')

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const [g, v, s, e, c, wp, li] = await Promise.all([
        supabase
          .from('guestbook_entries')
          .select('id, content, created_at, vehicle:vehicles(slug, year, make, model, owner:profiles!owner_id(username))')
          .eq('author_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('wwyd_votes')
          .select('id, created_at, option:wwyd_options(label), post:wwyd_posts(id, title)')
          .eq('voter_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('sightings')
          .select('id, image_url, description, location_name, city, state, created_at')
          .eq('spotter_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('events')
          .select('id, title, slug, event_date, city, state, status')
          .eq('organizer_id', user.id)
          .order('event_date', { ascending: false }),
        supabase
          .from('clubs')
          .select('id, name, slug, description, created_at')
          .eq('created_by', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('wwyd_posts')
          .select('id, title, budget, created_at')
          .eq('author_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('listings')
          .select('id, title, listing_type, price, status, created_at')
          .eq('seller_id', user.id)
          .order('created_at', { ascending: false }),
      ])

      setGuestbook((g.data || []) as unknown as GuestbookItem[])
      setVotes((v.data || []) as unknown as WwydVoteItem[])
      setSightings((s.data || []) as unknown as SightingItem[])
      setEvents((e.data || []) as unknown as EventItem[])
      setClubs((c.data || []) as unknown as ClubItem[])
      setWwydPosts((wp.data || []) as unknown as WwydPostItem[])
      setListings((li.data || []) as unknown as ListingItem[])
      setLoading(false)
    }
    load()
  }, [])

  const runDelete = async <T extends { id: string }>(table: string, id: string, list: T[], setList: (rows: T[]) => void, label: string, migrationNote: string) => {
    const { error, count } = await supabase.from(table).delete({ count: 'exact' }).eq('id', id)
    if (error) { flash('Delete failed: ' + error.message); return false }
    if (count === 0) { flash(`Blocked by RLS. ${migrationNote}`); return false }
    setList(list.filter(x => x.id !== id))
    flash(`${label} removed.`)
    return true
  }

  const removeEvent = async (id: string) => {
    if (!window.confirm('Delete this event and all RSVPs? This cannot be undone.')) return
    await runDelete('events', id, events, setEvents, 'Event', 'Apply migration 013 in Supabase.')
  }

  const removeClub = async (id: string) => {
    if (!window.confirm('Delete this club and all chapters/members? This cannot be undone.')) return
    const typed = window.prompt('Type "delete" to confirm:')
    if (typed?.toLowerCase() !== 'delete') return
    await runDelete('clubs', id, clubs, setClubs, 'Club', 'Apply migration 013 in Supabase.')
  }

  const removeWwydPost = async (id: string) => {
    if (!window.confirm('Delete this WWYD post and all votes? This cannot be undone.')) return
    await runDelete('wwyd_posts', id, wwydPosts, setWwydPosts, 'Post', 'Apply migration 013 in Supabase.')
  }

  const removeListing = async (id: string) => {
    if (!window.confirm('Delete this listing? This cannot be undone.')) return
    await runDelete('listings', id, listings, setListings, 'Listing', 'Listings DELETE policy is in migration 010.')
  }

  const flash = (text: string) => {
    setMessage(text)
    setTimeout(() => setMessage(''), 3500)
  }

  const removeGuestbook = async (id: string) => {
    if (!window.confirm('Delete this guestbook comment?')) return
    await runDelete('guestbook_entries', id, guestbook, setGuestbook, 'Comment', 'Apply migration 012.')
  }

  const removeVote = async (id: string) => {
    if (!window.confirm('Remove this vote?')) return
    await runDelete('wwyd_votes', id, votes, setVotes, 'Vote', 'Apply migration 012.')
  }

  const removeSighting = async (id: string) => {
    if (!window.confirm('Delete this sighting?')) return
    await runDelete('sightings', id, sightings, setSightings, 'Sighting', 'Sightings DELETE policy is in migration 005.')
  }

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  const tabBtn = (key: typeof activeTab, label: string, count: number) => (
    <button
      onClick={() => setActiveTab(key)}
      style={{
        padding: '10px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
        background: activeTab === key ? 'rgba(45,212,191,0.12)' : 'rgba(18,18,30,0.5)',
        color: activeTab === key ? '#2dd4bf' : '#9ca3af',
        fontWeight: 600, fontSize: '13px',
        outline: activeTab === key ? '2px solid #2dd4bf' : '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', gap: '8px',
      }}
    >
      {label}
      <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: '10px' }}>{count}</span>
    </button>
  )

  const deleteBtn = (onClick: () => void) => (
    <button onClick={onClick} className="btn-danger-sm">Delete</button>
  )

  const emptyState = (text: string) => (
    <div className="glass" style={{ padding: '40px 24px', textAlign: 'center' }}>
      <p className="text-muted-light" style={{ fontSize: '13px' }}>{text}</p>
    </div>
  )

  if (loading) {
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '80px 32px 40px' }}>
        <div className="text-center text-muted-light">Loading your activity...</div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '80px 32px 40px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 className="text-3xl font-bold" style={{ marginBottom: '4px' }}>My Activity</h1>
        <p className="text-muted-light" style={{ fontSize: '0.9rem' }}>Manage comments, votes, and sightings you&apos;ve posted.</p>
      </div>

      {message && (
        <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', color: '#22c55e', fontSize: '13px' }}>
          {message}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {tabBtn('events', 'Events', events.length)}
        {tabBtn('clubs', 'Clubs', clubs.length)}
        {tabBtn('listings', 'Marketplace', listings.length)}
        {tabBtn('wwydPosts', 'WWYD Posts', wwydPosts.length)}
        {tabBtn('guestbook', 'Guestbook', guestbook.length)}
        {tabBtn('wwyd', 'WWYD Votes', votes.length)}
        {tabBtn('sightings', 'Sightings', sightings.length)}
      </div>

      {activeTab === 'listings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {listings.length === 0 ? emptyState("You haven't posted any marketplace listings yet.") : listings.map(l => (
            <div key={l.id} className="glass" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <Link href={`/marketplace/${l.id}`} className="text-foreground" style={{ fontSize: '14px', fontWeight: 600, display: 'block' }}>{l.title}</Link>
                <p className="text-muted-light" style={{ fontSize: '12px', marginTop: '4px' }}>
                  <span className="spec" style={{ color: '#2dd4bf', fontWeight: 600 }}>${l.price}</span>
                  <span className="text-muted" style={{ marginLeft: '8px' }}>· {l.listing_type}</span>
                  <span className="text-muted" style={{ marginLeft: '8px' }}>· {l.status}</span>
                  <span className="text-muted" style={{ marginLeft: '8px' }}>· {fmtDate(l.created_at)}</span>
                </p>
              </div>
              {deleteBtn(() => removeListing(l.id))}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'events' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {events.length === 0 ? emptyState("You haven't created any events yet.") : events.map(e => (
            <div key={e.id} className="glass" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <Link href={`/events/${e.slug}`} className="text-foreground" style={{ fontSize: '14px', fontWeight: 600, display: 'block' }}>{e.title}</Link>
                <p className="text-muted-light" style={{ fontSize: '12px', marginTop: '4px' }}>
                  {new Date(e.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  {e.city && <span> · {e.city}, {e.state}</span>}
                  <span className="text-muted" style={{ marginLeft: '8px' }}>· {e.status}</span>
                </p>
              </div>
              {deleteBtn(() => removeEvent(e.id))}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'clubs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {clubs.length === 0 ? emptyState("You haven't started any clubs yet.") : clubs.map(c => (
            <div key={c.id} className="glass" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <Link href={`/clubs/${c.slug}`} className="text-foreground" style={{ fontSize: '14px', fontWeight: 600, display: 'block' }}>{c.name}</Link>
                {c.description && <p className="text-muted-light" style={{ fontSize: '12px', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.description}</p>}
                <p className="text-muted" style={{ fontSize: '11px', marginTop: '2px' }}>Founded {fmtDate(c.created_at)}</p>
              </div>
              {deleteBtn(() => removeClub(c.id))}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'wwydPosts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {wwydPosts.length === 0 ? emptyState("You haven't posted any WWYD questions yet.") : wwydPosts.map(p => (
            <div key={p.id} className="glass" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <Link href={`/wwyd`} className="text-foreground" style={{ fontSize: '14px', fontWeight: 600, display: 'block' }}>{p.title}</Link>
                <p className="text-muted-light" style={{ fontSize: '12px', marginTop: '4px' }}>
                  {p.budget && <span style={{ color: '#22c55e' }}>{p.budget} · </span>}
                  <span className="text-muted">{fmtDate(p.created_at)}</span>
                </p>
              </div>
              {deleteBtn(() => removeWwydPost(p.id))}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'guestbook' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {guestbook.length === 0 ? emptyState("You haven't left any guestbook comments yet.") : guestbook.map(g => (
            <div key={g.id} className="glass" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  {g.vehicle ? (
                    <Link href={`/user/${g.vehicle.owner?.username}/${g.vehicle.slug}`} className="text-foreground" style={{ fontSize: '13px', fontWeight: 600 }}>
                      On {g.vehicle.year} {g.vehicle.make} {g.vehicle.model}
                    </Link>
                  ) : (
                    <span className="text-muted" style={{ fontSize: '13px' }}>Vehicle removed</span>
                  )}
                  <span className="text-muted" style={{ fontSize: '11px', marginLeft: '8px' }}>{fmtDate(g.created_at)}</span>
                </div>
                {deleteBtn(() => removeGuestbook(g.id))}
              </div>
              <p className="text-muted-light" style={{ fontSize: '13px', whiteSpace: 'pre-wrap' }}>{g.content}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'wwyd' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {votes.length === 0 ? emptyState("You haven't voted on any WWYD posts yet.") : votes.map(v => (
            <div key={v.id} className="glass" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                {v.post ? (
                  <Link href={`/wwyd`} className="text-foreground" style={{ fontSize: '13px', fontWeight: 600, display: 'block' }}>
                    {v.post.title}
                  </Link>
                ) : (
                  <span className="text-muted" style={{ fontSize: '13px' }}>Post removed</span>
                )}
                <p className="text-muted-light" style={{ fontSize: '12px', marginTop: '4px' }}>
                  You voted: <span style={{ color: '#2dd4bf', fontWeight: 600 }}>{v.option?.label || '—'}</span>
                  <span className="text-muted" style={{ marginLeft: '8px' }}>· {fmtDate(v.created_at)}</span>
                </p>
              </div>
              {deleteBtn(() => removeVote(v.id))}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'sightings' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
          {sightings.length === 0 ? <div style={{ gridColumn: '1/-1' }}>{emptyState("You haven't posted any sightings yet.")}</div> : sightings.map(s => (
            <div key={s.id} className="glass overflow-hidden">
              <div style={{ aspectRatio: '2 / 1', background: 'rgba(26,26,46,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                <img
                  src={s.image_url}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    const img = e.currentTarget
                    img.style.display = 'none'
                    const parent = img.parentElement
                    if (parent && !parent.querySelector('.img-fallback')) {
                      const fb = document.createElement('div')
                      fb.className = 'img-fallback'
                      fb.style.cssText = 'color:#6b7280;font-size:36px'
                      fb.textContent = ''
                      parent.appendChild(fb)
                    }
                  }}
                />
              </div>
              <div style={{ padding: '14px' }}>
                {s.description && <p className="text-foreground" style={{ fontSize: '13px', marginBottom: '6px' }}>{s.description}</p>}
                <p className="text-muted-light" style={{ fontSize: '11px' }}>{s.location_name}{s.city && `, ${s.city}`}{s.state && `, ${s.state}`}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="text-muted" style={{ fontSize: '11px' }}>{fmtDate(s.created_at)}</span>
                  {deleteBtn(() => removeSighting(s.id))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
