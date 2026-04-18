'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { stateFullName } from '@/lib/mapbox'

interface Activity {
  kind: 'activity'
  id: string
  created_at: string
  action: string
  target_type: string
  target_id: string
  metadata: Record<string, string>
  actor_id: string
  actor: { username: string; display_name: string; avatar_url: string; location: string } | null
  primary_vehicle?: { year: number; make: string; model: string; color: string; slug: string; image_url: string | null } | null
}

interface Post {
  kind: 'post'
  id: string
  created_at: string
  author_id: string
  content: string | null
  image_url: string | null
  hashtags: string[]
  love_count: number
  author: { username: string; display_name: string; avatar_url: string } | null
}

type Row = Activity | Post

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Renders #hashtags and @mentions as purple links inline in post content.
const TOKEN_RE = /(#[a-zA-Z0-9_]+|@[a-zA-Z0-9_]{3,30})/g
function renderPostContent(text: string | null) {
  if (!text) return null
  const out: (string | React.ReactElement)[] = []
  let last = 0
  let i = 0
  for (const m of text.matchAll(TOKEN_RE)) {
    const start = m.index ?? 0
    if (start > last) out.push(text.slice(last, start))
    const tok = m[0]
    if (tok.startsWith('#')) {
      const tag = tok.slice(1).toLowerCase()
      out.push(<Link key={i++} href={`/feed?tag=${tag}`} style={{ color: '#a78bfa', fontWeight: 600 }}>#{tok.slice(1)}</Link>)
    } else {
      const uname = tok.slice(1)
      out.push(<Link key={i++} href={`/user/${uname}`} style={{ color: '#a78bfa', fontWeight: 600 }}>@{uname}</Link>)
    }
    last = start + tok.length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
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
          <p style={{ fontSize: '14px', color: '#e2e4e9' }}>
            <Link href={`/user/${username}`} style={{ fontWeight: 600, color: '#e2e4e9' }}>{name}</Link>
            {locationText ? ` from ${locationText}` : ''} joined The Scene
          </p>
          {v && (
            <Link href={`/user/${username}/${v.slug}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px', padding: '8px', borderRadius: '8px', background: 'rgba(18,18,30,0.5)', border: '1px solid rgba(255,255,255,0.06)', maxWidth: '340px' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '6px', overflow: 'hidden', background: 'rgba(26,26,46,0.5)', flexShrink: 0 }}>
                {v.image_url && <img src={v.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: '12px', color: '#a78bfa', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.year} {v.make} {v.model}</p>
                {v.color && <p style={{ fontSize: '11px', color: '#6b7280' }}>{v.color}</p>}
              </div>
            </Link>
          )}
        </div>
      )
    }
    case 'added_vehicle':
      return (
        <p style={{ fontSize: '14px', color: '#e2e4e9' }}>
          <Link href={`/user/${username}`} style={{ fontWeight: 600, color: '#e2e4e9' }}>{name}</Link>
          {' added their '}<span style={{ color: '#a78bfa', fontWeight: 600 }}>{m.year} {m.make} {m.model}</span>
          {m.color && <span style={{ color: '#9ca3af' }}> in {m.color}</span>}
        </p>
      )
    case 'added_photo':
      return (
        <div>
          <p style={{ fontSize: '14px', color: '#e2e4e9', marginBottom: m.image_url ? '12px' : 0 }}>
            <Link href={`/user/${username}`} style={{ fontWeight: 600, color: '#e2e4e9' }}>{name}</Link>
            {' added a photo of their '}<span style={{ color: '#a78bfa', fontWeight: 600 }}>{m.year} {m.make} {m.model}</span>
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
        <p style={{ fontSize: '14px', color: '#e2e4e9' }}>
          <Link href={`/user/${username}`} style={{ fontWeight: 600, color: '#e2e4e9' }}>{name}</Link>
          {' updated their '}<span style={{ color: '#a78bfa', fontWeight: 600 }}>{m.year} {m.make} {m.model}</span>
        </p>
      )
    case 'followed_user':
      return (
        <p style={{ fontSize: '14px', color: '#e2e4e9' }}>
          <Link href={`/user/${username}`} style={{ fontWeight: 600, color: '#e2e4e9' }}>{name}</Link>
          {' started following '}
          <Link href={`/user/${m.following_username}`} style={{ fontWeight: 600, color: '#a78bfa' }}>@{m.following_username}</Link>
        </p>
      )
    case 'created_event':
    case 'posted_car_show':
      return (
        <p style={{ fontSize: '14px', color: '#e2e4e9' }}>
          <Link href={`/user/${username}`} style={{ fontWeight: 600, color: '#e2e4e9' }}>{name}</Link>
          {' posted a car show: '}<span style={{ fontWeight: 600 }}>{m.title}</span>
          {m.city && m.state && <span style={{ color: '#6b7280' }}> · {m.city}, {m.state}</span>}
        </p>
      )
    default:
      return (
        <p style={{ fontSize: '14px', color: '#e2e4e9' }}>
          <Link href={`/user/${username}`} style={{ fontWeight: 600, color: '#e2e4e9' }}>{name}</Link>
          {' was active on The Scene'}
        </p>
      )
  }
}

interface Props {
  refreshKey: number
  filterTag?: string | null
}

export default function Timeline({ refreshKey, filterTag }: Props) {
  const supabase = createClient()
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<'following' | 'all'>('following')
  const [followingCount, setFollowingCount] = useState(0)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loved, setLoved] = useState<Set<string>>(new Set())
  const [heartedActivities, setHeartedActivities] = useState<Set<string>>(new Set())
  const [activityHeartCounts, setActivityHeartCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)

      let allowedIds: string[] | null = null
      if (mode === 'following' && user) {
        const { data: following } = await supabase.from('follows').select('following_id').eq('follower_id', user.id)
        const ids = (following || []).map(f => f.following_id as string)
        setFollowingCount(ids.length)
        allowedIds = [...ids, user.id]
      }

      // Feed posts
      let postQ = supabase
        .from('feed_posts')
        .select('id, author_id, content, image_url, hashtags, love_count, created_at, author:profiles!author_id(username, display_name, avatar_url)')
        .order('created_at', { ascending: false })
        .limit(30)
      if (filterTag) postQ = postQ.contains('hashtags', [filterTag.toLowerCase()])
      if (allowedIds) {
        if (allowedIds.length === 0) { setRows([]); setLoading(false); return }
        postQ = postQ.in('author_id', allowedIds)
      }

      // Activity (only when not filtering by tag — activities don't have hashtags)
      const activityPromise = filterTag
        ? Promise.resolve({ data: [] })
        : (async () => {
            let q = supabase
              .from('activity_feed')
              .select('id, action, target_type, target_id, metadata, actor_id, created_at, actor:profiles!activity_feed_actor_id_fkey(username, display_name, avatar_url, location)')
              .eq('is_public', true)
              .order('created_at', { ascending: false })
              .limit(30)
            if (allowedIds) q = q.in('actor_id', allowedIds)
            return q
          })()

      const [postsRes, actsRes] = await Promise.all([postQ, activityPromise])
      const posts = (postsRes.data || []) as unknown as (Omit<Post, 'kind'>)[]
      const activities = (actsRes.data || []) as unknown as (Omit<Activity, 'kind' | 'primary_vehicle'>)[]

      // Enrich "joined" activities with primary vehicle
      const joinedActors = activities.filter(a => a.action === 'joined').map(a => a.actor_id)
      const vMap: Record<string, any> = {}
      if (joinedActors.length > 0) {
        const { data: vehicles } = await supabase
          .from('vehicles')
          .select('owner_id, year, make, model, color, slug, primary_image_url')
          .in('owner_id', joinedActors)
          .eq('is_primary', true)
          .eq('is_public', true)
        vehicles?.forEach(v => { vMap[v.owner_id] = { year: v.year, make: v.make, model: v.model, color: v.color, slug: v.slug, image_url: v.primary_image_url } })
      }

      const merged: Row[] = [
        ...posts.map(p => ({ ...p, kind: 'post' as const })),
        ...activities.map(a => ({ ...a, kind: 'activity' as const, primary_vehicle: vMap[a.actor_id] || null })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 40)

      setRows(merged)

      // Loved posts (for highlighting)
      if (user && posts.length > 0) {
        const { data: myLoves } = await supabase.from('feed_post_loves').select('post_id').eq('user_id', user.id).in('post_id', posts.map(p => p.id))
        setLoved(new Set((myLoves || []).map(l => l.post_id as string)))
      }

      // Heart reactions on activity rows (shared feed_reactions table)
      if (activities.length > 0) {
        const activityIds = activities.map(a => a.id)
        const { data: reactions } = await supabase
          .from('feed_reactions')
          .select('activity_id, user_id')
          .in('activity_id', activityIds)
          .eq('reaction', 'heart')
        const counts: Record<string, number> = {}
        const mine = new Set<string>()
        ;(reactions || []).forEach((r: any) => {
          counts[r.activity_id] = (counts[r.activity_id] || 0) + 1
          if (user && r.user_id === user.id) mine.add(r.activity_id)
        })
        setActivityHeartCounts(counts)
        setHeartedActivities(mine)
      }

      setLoading(false)
    }
    load()

    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, refreshKey, filterTag])

  const toggleLove = async (post: Post) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/auth/login'; return }
    const wasLoved = loved.has(post.id)
    if (wasLoved) {
      await supabase.from('feed_post_loves').delete().eq('post_id', post.id).eq('user_id', user.id)
      setLoved(s => { const n = new Set(s); n.delete(post.id); return n })
      setRows(rs => rs.map(r => r.kind === 'post' && r.id === post.id ? { ...r, love_count: Math.max(0, r.love_count - 1) } : r))
    } else {
      await supabase.from('feed_post_loves').insert({ post_id: post.id, user_id: user.id })
      setLoved(s => new Set(s).add(post.id))
      setRows(rs => rs.map(r => r.kind === 'post' && r.id === post.id ? { ...r, love_count: r.love_count + 1 } : r))
    }
  }

  const toggleActivityHeart = async (activityId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/auth/login'; return }
    const wasHearted = heartedActivities.has(activityId)
    if (wasHearted) {
      await supabase.from('feed_reactions').delete().eq('activity_id', activityId).eq('user_id', user.id).eq('reaction', 'heart')
      setHeartedActivities(s => { const n = new Set(s); n.delete(activityId); return n })
      setActivityHeartCounts(c => ({ ...c, [activityId]: Math.max(0, (c[activityId] || 1) - 1) }))
    } else {
      await supabase.from('feed_reactions').insert({ activity_id: activityId, user_id: user.id, reaction: 'heart' })
      setHeartedActivities(s => new Set(s).add(activityId))
      setActivityHeartCounts(c => ({ ...c, [activityId]: (c[activityId] || 0) + 1 }))
    }
  }

  const removePost = async (postId: string) => {
    if (!window.confirm('Delete this post?')) return
    const { error } = await supabase.from('feed_posts').delete().eq('id', postId)
    if (error) { alert('Delete failed: ' + error.message); return }
    setRows(rs => rs.filter(r => !(r.kind === 'post' && r.id === postId)))
  }

  const toggle = !filterTag && (
    <div style={{ display: 'inline-flex', background: 'rgba(18,18,30,0.5)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '3px', marginBottom: '16px' }}>
      <button onClick={() => setMode('following')} style={{ padding: '6px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, background: mode === 'following' ? 'rgba(124,58,237,0.2)' : 'transparent', color: mode === 'following' ? '#a78bfa' : '#6b7280' }}>
        Following {mode === 'following' && followingCount > 0 && `(${followingCount})`}
      </button>
      <button onClick={() => setMode('all')} style={{ padding: '6px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, background: mode === 'all' ? 'rgba(124,58,237,0.2)' : 'transparent', color: mode === 'all' ? '#a78bfa' : '#6b7280' }}>
        All
      </button>
    </div>
  )

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {[1, 2, 3].map(i => (
          <div key={i} className="glass animate-pulse" style={{ padding: '20px', height: '100px' }} />
        ))}
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div>
        {toggle}
        <div className="glass" style={{ padding: '48px 32px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#e2e4e9', marginBottom: '8px' }}>
            {filterTag ? `No posts tagged #${filterTag} yet` : mode === 'following' ? 'Quiet on your side of the scene' : 'No activity yet'}
          </h2>
          <p style={{ fontSize: '13px', color: '#8892a4' }}>
            {filterTag ? 'Be the first to post with this hashtag.'
              : mode === 'following' ? (followingCount === 0 ? "You're not following anyone yet. Hit Explore to find people to follow." : "The people you follow haven't posted anything recently. Switch to All to see the wider scene.")
              : 'Share a photo of your build or a mod you just finished.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {toggle}
      {filterTag && (
        <div className="glass" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: '13px', color: '#e2e4e9' }}>Showing posts tagged <span style={{ color: '#a78bfa', fontWeight: 700 }}>#{filterTag}</span></p>
          <Link href="/feed" style={{ fontSize: '12px', color: '#6b7280' }}>Clear filter</Link>
        </div>
      )}

      {rows.map(r => {
        if (r.kind === 'post') {
          return (
            <div key={`p-${r.id}`} className="glass" style={{ padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <Link href={`/user/${r.author?.username}`} style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', background: 'rgba(26,26,46,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {r.author?.avatar_url ? (
                      <img src={r.author.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '14px', color: '#6b7280' }}>{r.author?.username?.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                </Link>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link href={`/user/${r.author?.username}`} style={{ fontSize: '14px', fontWeight: 600, color: '#e2e4e9' }}>
                    {r.author?.display_name || r.author?.username}
                  </Link>
                  <p style={{ fontSize: '11px', color: '#6b7280' }}>{timeAgo(r.created_at)}</p>
                </div>
                {currentUserId === r.author_id && (
                  <button onClick={() => removePost(r.id)} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '11px', cursor: 'pointer' }}>Delete</button>
                )}
              </div>

              {r.content && (
                <p style={{ fontSize: '14px', color: '#d1d5db', whiteSpace: 'pre-wrap', lineHeight: 1.5, marginBottom: r.image_url ? '10px' : '6px' }}>
                  {renderPostContent(r.content)}
                </p>
              )}
              {r.image_url && (
                <div style={{ borderRadius: '8px', overflow: 'hidden', background: 'rgba(26,26,46,0.5)', marginBottom: '8px', maxHeight: '500px' }}>
                  <img src={r.image_url} alt="" style={{ width: '100%', maxHeight: '500px', objectFit: 'cover' }} />
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', paddingTop: '6px' }}>
                <button
                  onClick={() => toggleLove(r)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', padding: 0, fontSize: '13px', fontWeight: 600, color: loved.has(r.id) ? '#ef4444' : '#8892a4' }}
                >
                  {loved.has(r.id) ? '❤️' : '🤍'} <span>{r.love_count || 0}</span>
                </button>
              </div>
            </div>
          )
        }

        // activity row
        const a = r
        return (
          <div key={`a-${a.id}`} className="glass" style={{ padding: '16px 20px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <Link href={`/user/${a.actor?.username}`} style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', background: 'rgba(26,26,46,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {a.actor?.avatar_url ? (
                  <img src={a.actor.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>{a.actor?.username?.charAt(0).toUpperCase() || '?'}</span>
                )}
              </div>
            </Link>
            <div style={{ flex: 1, minWidth: 0 }}>
              {renderActivity(a)}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '8px' }}>
                <button
                  onClick={() => toggleActivityHeart(a.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', padding: 0, fontSize: '12px', fontWeight: 600, color: heartedActivities.has(a.id) ? '#ef4444' : '#8892a4' }}
                >
                  {heartedActivities.has(a.id) ? '❤️' : '🤍'} <span>{activityHeartCounts[a.id] || 0}</span>
                </button>
                <span style={{ fontSize: '11px', color: '#6b7280' }}>{timeAgo(a.created_at)}</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
