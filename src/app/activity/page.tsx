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

export default function ActivityPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [guestbook, setGuestbook] = useState<GuestbookItem[]>([])
  const [votes, setVotes] = useState<WwydVoteItem[]>([])
  const [sightings, setSightings] = useState<SightingItem[]>([])
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState<'guestbook' | 'wwyd' | 'sightings'>('guestbook')

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const [g, v, s] = await Promise.all([
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
      ])

      setGuestbook((g.data || []) as unknown as GuestbookItem[])
      setVotes((v.data || []) as unknown as WwydVoteItem[])
      setSightings((s.data || []) as unknown as SightingItem[])
      setLoading(false)
    }
    load()
  }, [])

  const flash = (text: string) => {
    setMessage(text)
    setTimeout(() => setMessage(''), 3500)
  }

  const removeGuestbook = async (id: string) => {
    if (!window.confirm('Delete this guestbook comment?')) return
    const { error } = await supabase.from('guestbook_entries').delete().eq('id', id)
    if (error) { flash('Delete failed: ' + error.message); return }
    setGuestbook(guestbook.filter(g => g.id !== id))
    flash('Comment removed.')
  }

  const removeVote = async (id: string) => {
    if (!window.confirm('Remove this vote?')) return
    const { error } = await supabase.from('wwyd_votes').delete().eq('id', id)
    if (error) { flash('Delete failed: ' + error.message); return }
    setVotes(votes.filter(v => v.id !== id))
    flash('Vote removed.')
  }

  const removeSighting = async (id: string) => {
    if (!window.confirm('Delete this sighting?')) return
    const { error } = await supabase.from('sightings').delete().eq('id', id)
    if (error) { flash('Delete failed: ' + error.message); return }
    setSightings(sightings.filter(s => s.id !== id))
    flash('Sighting removed.')
  }

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  const tabBtn = (key: typeof activeTab, label: string, count: number) => (
    <button
      onClick={() => setActiveTab(key)}
      style={{
        padding: '10px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
        background: activeTab === key ? 'rgba(124,58,237,0.2)' : 'rgba(18,18,30,0.5)',
        color: activeTab === key ? '#a78bfa' : '#9ca3af',
        fontWeight: 600, fontSize: '13px',
        outline: activeTab === key ? '2px solid #7c3aed' : '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', gap: '8px',
      }}
    >
      {label}
      <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: '10px' }}>{count}</span>
    </button>
  )

  const deleteBtn = (onClick: () => void) => (
    <button
      onClick={onClick}
      style={{ padding: '6px 12px', borderRadius: '6px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
    >
      🗑 Delete
    </button>
  )

  const emptyState = (icon: string, text: string) => (
    <div className="glass" style={{ padding: '40px 24px', textAlign: 'center' }}>
      <span style={{ fontSize: '40px', display: 'block', marginBottom: '12px' }}>{icon}</span>
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
        {tabBtn('guestbook', '📝 Guestbook', guestbook.length)}
        {tabBtn('wwyd', '🗳 WWYD Votes', votes.length)}
        {tabBtn('sightings', '📸 Sightings', sightings.length)}
      </div>

      {activeTab === 'guestbook' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {guestbook.length === 0 ? emptyState('📝', "You haven't left any guestbook comments yet.") : guestbook.map(g => (
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
          {votes.length === 0 ? emptyState('🗳', "You haven't voted on any WWYD posts yet.") : votes.map(v => (
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
                  You voted: <span style={{ color: '#a78bfa', fontWeight: 600 }}>{v.option?.label || '—'}</span>
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
          {sightings.length === 0 ? <div style={{ gridColumn: '1/-1' }}>{emptyState('📸', "You haven't posted any sightings yet.")}</div> : sightings.map(s => (
            <div key={s.id} className="glass overflow-hidden">
              <div style={{ height: '180px', background: 'rgba(26,26,46,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                      fb.textContent = '📸'
                      parent.appendChild(fb)
                    }
                  }}
                />
              </div>
              <div style={{ padding: '14px' }}>
                {s.description && <p className="text-foreground" style={{ fontSize: '13px', marginBottom: '6px' }}>{s.description}</p>}
                <p className="text-muted-light" style={{ fontSize: '11px' }}>📍 {s.location_name}{s.city && `, ${s.city}`}{s.state && `, ${s.state}`}</p>
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
