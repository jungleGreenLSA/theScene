'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Comment {
  id: string
  content: string
  created_at: string
  author_id: string
  author: { username: string; display_name: string; avatar_url: string } | null
}

export default function EventComments({ eventId, organizerId }: { eventId: string; organizerId: string }) {
  const supabase = createClient()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  const flash = (m: string) => { setMessage(m); setTimeout(() => setMessage(''), 4000) }

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUserId(user?.id || null)
    const { data } = await supabase
      .from('event_comments')
      .select('id, content, created_at, author_id, author:profiles!author_id(username, display_name, avatar_url)')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true })
    setComments((data || []) as unknown as Comment[])
    setLoading(false)
  }

  useEffect(() => { load() /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [eventId])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const body = draft.trim()
    if (!body) return
    setSubmitting(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/auth/login'; return }
    const { error } = await supabase.from('event_comments').insert({ event_id: eventId, author_id: user.id, content: body })
    setSubmitting(false)
    if (error) { flash('Post failed: ' + error.message); return }
    setDraft('')
    load()
  }

  const remove = async (id: string) => {
    if (!window.confirm('Delete this comment?')) return
    const { error, count } = await supabase.from('event_comments').delete({ count: 'exact' }).eq('id', id)
    if (error) { flash('Delete failed: ' + error.message); return }
    if (count === 0) { flash('Apply migration 020 in Supabase to enable comments.'); return }
    setComments(comments.filter(c => c.id !== id))
  }

  const timeAgo = (d: string) => {
    const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
    if (s < 60) return 'just now'
    if (s < 3600) return `${Math.floor(s / 60)}m`
    if (s < 86400) return `${Math.floor(s / 3600)}h`
    if (s < 604800) return `${Math.floor(s / 86400)}d`
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="glass" style={{ padding: '24px', marginBottom: '20px' }}>
      <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a1a', marginBottom: '14px' }}>Comments ({comments.length})</h2>

      {message && (
        <div style={{ fontSize: '12px', color: '#ef4444', marginBottom: '10px' }}>{message}</div>
      )}

      {loading ? (
        <p style={{ fontSize: '13px', color: '#555555' }}>Loading...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: currentUserId ? '16px' : 0 }}>
          {comments.length === 0 && <p style={{ fontSize: '13px', color: '#555555' }}>No comments yet. Kick it off.</p>}
          {comments.map(c => {
            const canRemove = currentUserId && (currentUserId === c.author_id || currentUserId === organizerId)
            return (
              <div key={c.id} style={{ display: 'flex', gap: '12px' }}>
                <Link href={`/user/${c.author?.username}`} style={{ flexShrink: 0 }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', background: '#e4e4e4', backgroundImage: c.author?.avatar_url ? `url(${c.author.avatar_url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {!c.author?.avatar_url && <span style={{ fontSize: '12px', color: '#555555' }}>{c.author?.username?.charAt(0).toUpperCase()}</span>}
                  </div>
                </Link>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px', flexWrap: 'wrap' }}>
                    <Link href={`/user/${c.author?.username}`} style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a1a' }}>
                      {c.author?.display_name || c.author?.username}
                    </Link>
                    <span style={{ fontSize: '11px', color: '#555555' }}>{timeAgo(c.created_at)}</span>
                    {canRemove && (
                      <button onClick={() => remove(c.id)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#555555', fontSize: '11px', cursor: 'pointer', padding: '2px 6px' }}>Delete</button>
                    )}
                  </div>
                  <p style={{ fontSize: '14px', color: '#333333', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{c.content}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {currentUserId && (
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: comments.length > 0 ? '16px' : '4px', marginTop: comments.length > 0 ? '2px' : 0, borderTop: comments.length > 0 ? '1px solid #e4e4e4' : 'none' }}>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Share your thoughts on this event..."
            className="input"
            rows={2}
            maxLength={500}
            style={{ resize: 'vertical', minHeight: '60px' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: draft.length > 450 ? '#fb923c' : '#555555' }}>{500 - draft.length}</span>
            <button type="submit" disabled={submitting || !draft.trim()} className="btn-primary" style={{ fontSize: '12px', padding: '8px 20px', opacity: (submitting || !draft.trim()) ? 0.5 : 1 }}>
              {submitting ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
