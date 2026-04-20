'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { stateFullName } from '@/lib/mapbox'
import { formatMemberSince, avatarColorForUsername } from '@/lib/forumStyle'

interface AuthorMeta {
  username: string
  display_name: string | null
  avatar_url: string | null
  location: string | null
  created_at: string | null
  bio: string | null
}

interface Activity {
  kind: 'activity'
  id: string
  created_at: string
  action: string
  target_type: string
  target_id: string
  metadata: Record<string, string>
  actor_id: string
  actor: AuthorMeta | null
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
  author: AuthorMeta | null
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

// Renders #hashtags and @mentions as sky-blue links inline in post content.
// Each link gets an aria-label so screen readers hear "View posts tagged
// foo" or "View username profile" instead of just "hashtag foo".
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
      const tag = tok.slice(1)
      out.push(
        <Link
          key={i++}
          href={`/feed?tag=${tag.toLowerCase()}`}
          aria-label={`View posts tagged ${tag}`}
          style={{ color: '#1c58b8', fontWeight: 700, textDecoration: 'underline' }}
        >
          #{tag}
        </Link>
      )
    } else {
      const uname = tok.slice(1)
      out.push(
        <Link
          key={i++}
          href={`/user/${uname}`}
          aria-label={`View ${uname}'s profile`}
          style={{ color: '#1c58b8', fontWeight: 700, textDecoration: 'underline' }}
        >
          @{uname}
        </Link>
      )
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
          <p>
            <Link href={`/user/${username}`} style={{ fontWeight: 700, color: '#1a1a1a' }}>{name}</Link>
            {locationText ? ` from ${locationText}` : ''} joined The Scene
          </p>
          {v && (
            <Link href={`/user/${username}/${v.slug}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px', padding: '8px', background: '#f0f0f0', border: '1px solid #c4c4c4', maxWidth: '340px' }}>
              <div style={{ width: '52px', height: '52px', overflow: 'hidden', background: '#e4e4e4', flexShrink: 0, border: '1px solid #888' }}>
                {v.image_url && <img src={v.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: '13px', color: '#2c79c4', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.year} {v.make} {v.model}</p>
                {v.color && <p style={{ fontSize: '11px', color: '#2c3e50' }}>{v.color}</p>}
              </div>
            </Link>
          )}
        </div>
      )
    }
    case 'added_vehicle':
      return (
        <p>
          <Link href={`/user/${username}`} style={{ fontWeight: 700, color: '#1a1a1a' }}>{name}</Link>
          {' added their '}<span style={{ color: '#2c79c4', fontWeight: 700 }}>{m.year} {m.make} {m.model}</span>
          {m.color && <span style={{ color: '#2c3e50' }}> in {m.color}</span>}
        </p>
      )
    case 'added_photo':
      return (
        <div>
          <p style={{ marginBottom: m.image_url ? '10px' : 0 }}>
            <Link href={`/user/${username}`} style={{ fontWeight: 700, color: '#1a1a1a' }}>{name}</Link>
            {' added a photo of their '}<span style={{ color: '#2c79c4', fontWeight: 700 }}>{m.year} {m.make} {m.model}</span>
          </p>
          {m.image_url && (
            <div style={{ overflow: 'hidden', maxHeight: '320px', background: '#e4e4e4', border: '1px solid #888' }}>
              <img src={m.image_url} alt="" style={{ width: '100%', maxHeight: '320px', objectFit: 'cover' }} />
            </div>
          )}
        </div>
      )
    case 'updated_vehicle':
      return (
        <p>
          <Link href={`/user/${username}`} style={{ fontWeight: 700, color: '#1a1a1a' }}>{name}</Link>
          {' updated their '}<span style={{ color: '#2c79c4', fontWeight: 700 }}>{m.year} {m.make} {m.model}</span>
        </p>
      )
    case 'followed_user':
      return (
        <p>
          <Link href={`/user/${username}`} style={{ fontWeight: 700, color: '#1a1a1a' }}>{name}</Link>
          {' started following '}
          <Link href={`/user/${m.following_username}`} style={{ fontWeight: 700, color: '#2c79c4' }}>@{m.following_username}</Link>
        </p>
      )
    case 'created_event':
    case 'posted_car_show':
      return (
        <p>
          <Link href={`/user/${username}`} style={{ fontWeight: 700, color: '#1a1a1a' }}>{name}</Link>
          {' posted a car show: '}<span style={{ fontWeight: 700 }}>{m.title}</span>
          {m.city && m.state && <span style={{ color: '#2c3e50' }}> · {m.city}, {m.state}</span>}
        </p>
      )
    default:
      return (
        <p>
          <Link href={`/user/${username}`} style={{ fontWeight: 700, color: '#1a1a1a' }}>{name}</Link>
          {' was active on The Scene'}
        </p>
      )
  }
}

// One vBulletin-style post row: avatar + member stats on the left,
// content body on the right. Used for both feed_posts and activity_feed
// rows so the whole feed reads as a single forum thread.
function ForumRow({
  author,
  dateISO,
  postNumber,
  children,
  signature,
  actions,
}: {
  author: AuthorMeta | null
  dateISO: string
  postNumber: number
  children: React.ReactNode
  signature?: string | null
  actions?: React.ReactNode
}) {
  const username = author?.username || null
  const avatarUrl = author?.avatar_url
  const avatarStyle: React.CSSProperties = avatarUrl
    ? { backgroundImage: `url(${avatarUrl})` }
    : { backgroundColor: avatarColorForUsername(username) }

  return (
    <article className="forum-post">
      <aside className="forum-post-meta">
        <div className="forum-post-avatar" style={avatarStyle} aria-label={`${username || 'user'} avatar`} />
        {username ? (
          <Link href={`/user/${username}`} className="forum-post-username">
            {author?.display_name || username}
          </Link>
        ) : (
          <span className="forum-post-username">(deleted)</span>
        )}
        <span className="forum-post-rank">Member</span>
        <div>
          <div className="forum-post-stat">
            <span>Member since</span>
            <strong>{formatMemberSince(author?.created_at || null)}</strong>
          </div>
          {author?.location && (
            <div className="forum-post-stat">
              <span>Location</span>
              <strong>{author.location}</strong>
            </div>
          )}
        </div>
      </aside>

      <div className="forum-post-body">
        <div className="forum-post-date">
          <span>
            <strong>#{postNumber}</strong> · Posted {timeAgo(dateISO)}
          </span>
          {actions && <span>{actions}</span>}
        </div>
        <div className="forum-post-content">{children}</div>
        {signature && (
          <div className="forum-sig">
            {signature.split('\n').slice(0, 3).map((line, i) => (
              <div key={i}>{line.slice(0, 120)}</div>
            ))}
          </div>
        )}
      </div>
    </article>
  )
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

      // Feed posts with author meta (adds location, created_at, bio so
      // the forum-style meta sidebar can render full stats).
      let postQ = supabase
        .from('feed_posts')
        .select('id, author_id, content, image_url, hashtags, love_count, created_at, author:profiles!author_id(username, display_name, avatar_url, location, created_at, bio)')
        .order('created_at', { ascending: false })
        .limit(30)
      if (filterTag) postQ = postQ.contains('hashtags', [filterTag.toLowerCase()])
      if (allowedIds) {
        if (allowedIds.length === 0) { setRows([]); setLoading(false); return }
        postQ = postQ.in('author_id', allowedIds)
      }

      const activityPromise = filterTag
        ? Promise.resolve({ data: [] })
        : (async () => {
            let q = supabase
              .from('activity_feed')
              .select('id, action, target_type, target_id, metadata, actor_id, created_at, actor:profiles!activity_feed_actor_id_fkey(username, display_name, avatar_url, location, created_at, bio)')
              .eq('is_public', true)
              .order('created_at', { ascending: false })
              .limit(30)
            if (allowedIds) q = q.in('actor_id', allowedIds)
            return q
          })()

      const [postsRes, actsRes] = await Promise.all([postQ, activityPromise])
      const posts = (postsRes.data || []) as unknown as (Omit<Post, 'kind'>)[]
      const activities = (actsRes.data || []) as unknown as (Omit<Activity, 'kind' | 'primary_vehicle'>)[]

      const joinedActors = activities.filter(a => a.action === 'joined').map(a => a.actor_id)
      const vMap: Record<string, { year: number; make: string; model: string; color: string; slug: string; image_url: string | null }> = {}
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

      if (user && posts.length > 0) {
        const { data: myLoves } = await supabase.from('feed_post_loves').select('post_id').eq('user_id', user.id).in('post_id', posts.map(p => p.id))
        setLoved(new Set((myLoves || []).map(l => l.post_id as string)))
      }

      if (activities.length > 0) {
        const activityIds = activities.map(a => a.id)
        const { data: reactions } = await supabase
          .from('feed_reactions')
          .select('activity_id, user_id')
          .in('activity_id', activityIds)
          .eq('reaction', 'heart')
        const counts: Record<string, number> = {}
        const mine = new Set<string>()
        ;(reactions || []).forEach((r: { activity_id: string; user_id: string }) => {
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
    <div style={{ display: 'inline-flex', background: '#ebebeb', border: '1px solid #c4c4c4', padding: '3px', marginBottom: '12px' }}>
      <button onClick={() => setMode('following')} style={{ padding: '5px 14px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700, background: mode === 'following' ? '#2c79c4' : 'transparent', color: mode === 'following' ? '#fff' : '#333' }}>
        Following {mode === 'following' && followingCount > 0 && `(${followingCount})`}
      </button>
      <button onClick={() => setMode('all')} style={{ padding: '5px 14px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700, background: mode === 'all' ? '#2c79c4' : 'transparent', color: mode === 'all' ? '#fff' : '#333' }}>
        All
      </button>
    </div>
  )

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {[1, 2, 3].map(i => (
          <div key={i} className="glass" style={{ height: '140px', opacity: 0.5 }} />
        ))}
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div>
        {toggle}
        <div className="section-block" style={{ padding: '40px 24px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a1a', marginBottom: '6px' }}>
            {filterTag ? `No posts tagged #${filterTag} yet` : mode === 'following' ? 'Quiet on your side of the scene' : 'No activity yet'}
          </h2>
          <p style={{ fontSize: '13px', color: '#2c3e50' }}>
            {filterTag ? 'Be the first to post with this hashtag.'
              : mode === 'following' ? (followingCount === 0 ? "You're not following anyone yet. Hit Explore to find people to follow." : "The people you follow haven't posted anything recently. Switch to All to see the wider scene.")
              : 'Share a photo of your build or a mod you just finished.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {toggle}
      {filterTag && (
        <div className="section-block" style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <p style={{ fontSize: '13px', color: '#1a1a1a' }}>Showing posts tagged <span style={{ color: '#2c79c4', fontWeight: 700 }}>#{filterTag}</span></p>
          <Link href="/feed" style={{ fontSize: '12px', color: '#1c58b8', fontWeight: 600 }}>Clear filter</Link>
        </div>
      )}

      {rows.map((r, idx) => {
        if (r.kind === 'post') {
          const heartBtn = (
            <span style={{ fontSize: '11px' }}>
              <button
                onClick={() => toggleLove(r)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '11px', fontWeight: 700, color: loved.has(r.id) ? '#c02b2b' : '#1c58b8' }}
              >
                {loved.has(r.id) ? '♥' : '♡'} {r.love_count || 0}
              </button>
              {currentUserId === r.author_id && (
                <>
                  <span style={{ margin: '0 6px', color: '#c4c4c4' }}>|</span>
                  <button onClick={() => removePost(r.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '11px', color: '#c02b2b', fontWeight: 600 }}>Delete</button>
                </>
              )}
            </span>
          )
          return (
            <ForumRow
              key={`p-${r.id}`}
              author={r.author}
              dateISO={r.created_at}
              postNumber={idx + 1}
              signature={r.author?.bio || null}
              actions={heartBtn}
            >
              {r.content && (
                <p style={{ whiteSpace: 'pre-wrap' }}>{renderPostContent(r.content)}</p>
              )}
              {r.image_url && (
                <div style={{ overflow: 'hidden', background: '#e4e4e4', border: '1px solid #888', maxHeight: '500px', marginTop: r.content ? '10px' : 0 }}>
                  <img src={r.image_url} alt="" style={{ width: '100%', maxHeight: '500px', objectFit: 'cover', display: 'block' }} />
                </div>
              )}
            </ForumRow>
          )
        }

        // activity row
        const a = r
        const heartBtn = (
          <button
            onClick={() => toggleActivityHeart(a.id)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '11px', fontWeight: 700, color: heartedActivities.has(a.id) ? '#c02b2b' : '#1c58b8' }}
          >
            {heartedActivities.has(a.id) ? '♥' : '♡'} {activityHeartCounts[a.id] || 0}
          </button>
        )
        return (
          <ForumRow
            key={`a-${a.id}`}
            author={a.actor}
            dateISO={a.created_at}
            postNumber={idx + 1}
            signature={a.actor?.bio || null}
            actions={heartBtn}
          >
            {renderActivity(a)}
          </ForumRow>
        )
      })}
    </div>
  )
}
