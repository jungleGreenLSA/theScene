'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Post {
  id: string
  author_id: string
  content: string | null
  image_url: string | null
  hashtags: string[]
  love_count: number
  created_at: string
  author: { username: string; display_name: string; avatar_url: string } | null
}

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  if (s < 604800) return `${Math.floor(s / 86400)}d`
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const HASHTAG_RE = /#([a-zA-Z0-9_]+)/g
function renderContent(text: string | null) {
  if (!text) return null
  const parts: (string | React.ReactElement)[] = []
  let last = 0
  let i = 0
  for (const m of text.matchAll(HASHTAG_RE)) {
    const start = m.index ?? 0
    if (start > last) parts.push(text.slice(last, start))
    parts.push(<span key={i++} style={{ color: '#a78bfa', fontWeight: 600 }}>#{m[1]}</span>)
    last = start + m[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts
}

export default function FeedPosts({ refreshKey }: { refreshKey: number }) {
  const supabase = createClient()
  const [posts, setPosts] = useState<Post[]>([])
  const [loved, setLoved] = useState<Set<string>>(new Set())
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)

      const { data } = await supabase
        .from('feed_posts')
        .select('id, author_id, content, image_url, hashtags, love_count, created_at, author:profiles!author_id(username, display_name, avatar_url)')
        .order('created_at', { ascending: false })
        .limit(30)
      setPosts((data || []) as unknown as Post[])

      if (user) {
        const { data: myLoves } = await supabase.from('feed_post_loves').select('post_id').eq('user_id', user.id)
        setLoved(new Set((myLoves || []).map(l => l.post_id as string)))
      }
      setLoading(false)
    }
    load()
  }, [refreshKey])

  const toggleLove = async (post: Post) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/auth/login'; return }
    const wasLoved = loved.has(post.id)
    if (wasLoved) {
      await supabase.from('feed_post_loves').delete().eq('post_id', post.id).eq('user_id', user.id)
      setLoved(s => { const n = new Set(s); n.delete(post.id); return n })
      setPosts(ps => ps.map(p => p.id === post.id ? { ...p, love_count: Math.max(0, p.love_count - 1) } : p))
    } else {
      await supabase.from('feed_post_loves').insert({ post_id: post.id, user_id: user.id })
      setLoved(s => new Set(s).add(post.id))
      setPosts(ps => ps.map(p => p.id === post.id ? { ...p, love_count: p.love_count + 1 } : p))
    }
  }

  const remove = async (postId: string) => {
    if (!window.confirm('Delete this post?')) return
    const { error } = await supabase.from('feed_posts').delete().eq('id', postId)
    if (error) { alert('Delete failed: ' + error.message); return }
    setPosts(ps => ps.filter(p => p.id !== postId))
  }

  if (loading) return null
  if (posts.length === 0) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
      {posts.map(p => (
        <div key={p.id} className="glass" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <Link href={`/user/${p.author?.username}`} style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', background: 'rgba(26,26,46,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {p.author?.avatar_url ? (
                <img src={p.author.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '12px', color: '#6b7280' }}>{p.author?.username?.charAt(0).toUpperCase()}</span>
              )}
            </Link>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Link href={`/user/${p.author?.username}`} style={{ fontSize: '14px', fontWeight: 600, color: '#e2e4e9' }}>
                {p.author?.display_name || p.author?.username}
              </Link>
              <p style={{ fontSize: '11px', color: '#6b7280' }}>{timeAgo(p.created_at)}</p>
            </div>
            {currentUserId === p.author_id && (
              <button onClick={() => remove(p.id)} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '11px', cursor: 'pointer' }}>Delete</button>
            )}
          </div>

          {p.content && (
            <p style={{ fontSize: '14px', color: '#d1d5db', whiteSpace: 'pre-wrap', lineHeight: 1.5, marginBottom: p.image_url ? '10px' : '8px' }}>
              {renderContent(p.content)}
            </p>
          )}
          {p.image_url && (
            <div style={{ borderRadius: '8px', overflow: 'hidden', background: 'rgba(26,26,46,0.5)', marginBottom: '8px', maxHeight: '500px' }}>
              <img src={p.image_url} alt="" style={{ width: '100%', maxHeight: '500px', objectFit: 'cover' }} />
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', paddingTop: '6px' }}>
            <button
              onClick={() => toggleLove(p)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', padding: 0, fontSize: '13px', fontWeight: 600, color: loved.has(p.id) ? '#ef4444' : '#8892a4' }}
            >
              {loved.has(p.id) ? '❤️' : '🤍'} <span>{p.love_count || 0}</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
