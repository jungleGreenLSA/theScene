'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { stateFullName } from '@/lib/googleMaps'

interface Activity {
  id: string
  action: string
  target_type: string
  target_id: string
  metadata: Record<string, string>
  created_at: string
  actor_id: string
  actor: {
    username: string
    display_name: string
    avatar_url: string
    is_online: boolean
    first_name: string
    location: string
  }
  primary_vehicle?: { year: number; make: string; model: string; color: string; slug: string; image_url: string | null } | null
}

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function renderActivity(a: Activity) {
  const name = a.actor?.display_name || a.actor?.username || 'Someone'
  const username = a.actor?.username
  const m = a.metadata || {}

  switch (a.action) {
    case 'joined': {
      const v = a.primary_vehicle
      const parts = (m.location || '').split(',').map(s => s.trim()).filter(Boolean)
      const city = parts[0] || ''
      const stateFull = stateFullName(parts[1])
      const locationText = city && stateFull ? `${city}, ${stateFull}` : city
      return (
        <div>
          <p className="text-foreground" style={{ fontSize: '14px' }}>
            <Link href={`/user/${username}`} className="font-semibold hover:text-purple-light">{name}</Link>
            {locationText ? ` from ${locationText}` : ''} joined The Scene
          </p>
          {v && (
            <Link href={`/user/${username}/${v.slug}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px', padding: '8px', borderRadius: '8px', background: 'rgba(18,18,30,0.5)', border: '1px solid rgba(255,255,255,0.06)', maxWidth: '340px' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '6px', overflow: 'hidden', background: 'rgba(26,26,46,0.5)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {v.image_url ? (
                  <img src={v.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '22px' }}>🏁</span>
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: '12px', color: '#a78bfa', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.year} {v.make} {v.model}</p>
                {v.color && <p style={{ fontSize: '11px', color: '#6b7280' }}>{v.color}</p>}
              </div>
            </Link>
          )}
          <span style={{ fontSize: '11px', color: '#fb923c', fontWeight: 600, display: 'inline-block', marginTop: '8px' }}>Welcome! 🎉</span>
        </div>
      )
    }

    case 'added_vehicle':
      return (
        <p className="text-foreground" style={{ fontSize: '14px' }}>
          <Link href={`/user/${username}`} className="font-semibold hover:text-purple-light">{name}</Link>
          {' added their '}
          <span className="text-purple-light font-semibold">{m.year} {m.make} {m.model}</span>
          {m.color && <span className="text-muted-light"> in {m.color}</span>}
        </p>
      )

    case 'added_photo':
      return (
        <div>
          <p className="text-foreground" style={{ fontSize: '14px', marginBottom: m.image_url ? '12px' : 0 }}>
            <Link href={`/user/${username}`} className="font-semibold hover:text-purple-light">{name}</Link>
            {' added a photo of their '}
            <span className="text-purple-light font-semibold">{m.year} {m.make} {m.model}</span>
          </p>
          {m.image_url && (
            <div style={{ borderRadius: '8px', overflow: 'hidden', maxHeight: '300px', background: 'rgba(26,26,46,0.5)' }}>
              <img src={m.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', maxHeight: '300px' }} />
            </div>
          )}
        </div>
      )

    case 'updated_vehicle':
      return (
        <p className="text-foreground" style={{ fontSize: '14px' }}>
          <Link href={`/user/${username}`} className="font-semibold hover:text-purple-light">{name}</Link>
          {' updated their '}
          <span className="text-purple-light font-semibold">{m.year} {m.make} {m.model}</span>
        </p>
      )

    case 'followed_user':
      return (
        <p className="text-foreground" style={{ fontSize: '14px' }}>
          <Link href={`/user/${username}`} className="font-semibold hover:text-purple-light">{name}</Link>
          {' started following '}
          <Link href={`/user/${m.following_username}`} className="font-semibold text-purple-light hover:text-neon-light">@{m.following_username}</Link>
        </p>
      )

    case 'club_added_member':
      return (
        <p className="text-foreground" style={{ fontSize: '14px' }}>
          <span className="font-semibold text-neon-light">{m.club_name}</span>
          {' added '}
          <Link href={`/user/${m.member_username}`} className="font-semibold hover:text-purple-light">@{m.member_username}</Link>
          {' as a member'}
        </p>
      )

    case 'created_event':
    case 'posted_car_show':
      return (
        <div>
          <p className="text-foreground" style={{ fontSize: '14px' }}>
            <Link href={`/user/${username}`} className="font-semibold hover:text-purple-light">{name}</Link>
            {m.club_name ? (
              <> posted a car show for <span className="text-neon-light font-semibold">{m.club_name}</span></>
            ) : (
              <> posted a car show</>
            )}
            {': '}
            <span className="font-semibold">{m.title}</span>
          </p>
          {m.city && m.state && (
            <span className="text-muted" style={{ fontSize: '12px' }}>📍 {m.city}, {m.state}</span>
          )}
        </div>
      )

    case 'posted_flyer':
      return (
        <div>
          <p className="text-foreground" style={{ fontSize: '14px', marginBottom: '8px' }}>
            <Link href={`/user/${username}`} className="font-semibold hover:text-purple-light">{name}</Link>
            {' posted a car show flyer: '}
            <span className="font-semibold">{m.title}</span>
          </p>
          {m.city && m.state && (
            <span style={{ display: 'inline-block', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', padding: '3px 10px', borderRadius: '4px', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', color: '#a78bfa', marginBottom: '8px' }}>
              📍 {m.city}, {m.state}
            </span>
          )}
        </div>
      )

    default:
      return (
        <p className="text-foreground" style={{ fontSize: '14px' }}>
          <Link href={`/user/${username}`} className="font-semibold hover:text-purple-light">{name}</Link>
          {' was active on The Scene'}
        </p>
      )
  }
}

export default function ActivityFeed() {
  const supabase = createClient()
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [hearts, setHearts] = useState<Set<string>>(new Set())
  const [heartCounts, setHeartCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('activity_feed')
        .select(`
          *,
          actor:profiles!activity_feed_actor_id_fkey(username, display_name, avatar_url, is_online, first_name, location)
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(30)

      const acts = (data || []) as unknown as Activity[]

      // For 'joined' activities, fetch primary vehicle + its main photo
      const joinedActorIds = acts.filter(a => a.action === 'joined').map(a => a.actor_id).filter(Boolean)
      if (joinedActorIds.length > 0) {
        const { data: vehicles } = await supabase
          .from('vehicles')
          .select('owner_id, year, make, model, color, slug, primary_image_url')
          .in('owner_id', joinedActorIds)
          .eq('is_primary', true)
          .eq('is_public', true)
        const vMap: Record<string, any> = {}
        vehicles?.forEach(v => {
          vMap[v.owner_id] = { year: v.year, make: v.make, model: v.model, color: v.color, slug: v.slug, image_url: v.primary_image_url }
        })
        acts.forEach(a => { if (a.action === 'joined' && vMap[a.actor_id]) a.primary_vehicle = vMap[a.actor_id] })
      }

      setActivities(acts)
      setLoading(false)
    }
    fetch()

    // Poll for new activity every 30 seconds
    const interval = setInterval(fetch, 30000)
    return () => clearInterval(interval)
  }, [])

  // Update user's last_active timestamp
  useEffect(() => {
    const ping = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('profiles').update({ last_active_at: new Date().toISOString(), is_online: true }).eq('id', user.id)
      }
    }
    ping()
    const interval = setInterval(ping, 60000) // every minute
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {[1,2,3,4,5].map(i => (
          <div key={i} className="glass animate-pulse" style={{ padding: '20px', display: 'flex', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(26,26,46,0.5)', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ height: '14px', background: 'rgba(26,26,46,0.5)', borderRadius: '4px', width: '70%', marginBottom: '8px' }} />
              <div style={{ height: '12px', background: 'rgba(26,26,46,0.5)', borderRadius: '4px', width: '40%' }} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="glass" style={{ padding: '48px 32px', textAlign: 'center' }}>
        <span style={{ fontSize: '48px', display: 'block', marginBottom: '12px' }}>📡</span>
        <h2 className="text-xl font-bold" style={{ marginBottom: '8px' }}>No activity yet</h2>
        <p className="text-muted-light" style={{ fontSize: '0.9rem' }}>When people join and share their builds, it&apos;ll show up here.</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {activities.map((a) => (
        <div key={a.id} className="glass card-hover" style={{ padding: '16px 20px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
          {/* Avatar with online indicator */}
          <Link href={`/user/${a.actor?.username}`} style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', background: 'rgba(26,26,46,0.5)' }}>
              {a.actor?.avatar_url ? (
                <img src={a.actor.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: '#6b7280' }}>
                  {a.actor?.username?.charAt(0).toUpperCase() || '?'}
                </div>
              )}
            </div>
            {a.actor?.is_online && (
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: '12px', height: '12px', borderRadius: '50%', background: '#22c55e', border: '2px solid #0c0c14', boxShadow: '0 0 6px rgba(34,197,94,0.5)' }} />
            )}
          </Link>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {renderActivity(a)}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
              <button
                onClick={async () => {
                  const { data: { user } } = await supabase.auth.getUser()
                  if (!user) { window.location.href = '/auth/login'; return }
                  const isHearted = hearts.has(a.id)
                  if (isHearted) {
                    await supabase.from('feed_reactions').delete().eq('activity_id', a.id).eq('user_id', user.id)
                    const next = new Set(hearts); next.delete(a.id); setHearts(next)
                    setHeartCounts(prev => ({ ...prev, [a.id]: (prev[a.id] || 1) - 1 }))
                  } else {
                    await supabase.from('feed_reactions').insert({ activity_id: a.id, user_id: user.id, reaction: 'heart' })
                    setHearts(new Set([...hearts, a.id]))
                    setHeartCounts(prev => ({ ...prev, [a.id]: (prev[a.id] || 0) + 1 }))
                  }
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: hearts.has(a.id) ? '#ef4444' : '#6b7280', transition: 'color 0.2s', padding: 0 }}
              >
                {hearts.has(a.id) ? '❤️' : '🤍'} {heartCounts[a.id] || ''}
              </button>
              <span style={{ fontSize: '11px', color: '#6b7280' }}>{timeAgo(a.created_at)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
