'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  forumSlug: string
  subForumId: string
  userId: string
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
}

export default function NewThreadForm({ forumSlug, subForumId, userId }: Props) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [error, setError] = useState('')
  const [posting, setPosting] = useState(false)
  const router = useRouter()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const t = title.trim()
    const c = content.trim()
    if (t.length < 4) { setError('Title needs to be at least 4 characters.'); return }
    if (t.length > 140) { setError('Title is capped at 140 characters.'); return }
    if (c.length < 1) { setError('First post can\'t be empty.'); return }
    setPosting(true)
    const supabase = createClient()

    // Slug must be unique within the sub-forum. If the base slug collides,
    // append a short timestamp suffix.
    let slug = slugify(t)
    if (!slug) slug = 'thread'
    const { data: existing } = await supabase
      .from('forum_threads')
      .select('id')
      .eq('sub_forum_id', subForumId)
      .eq('slug', slug)
      .maybeSingle()
    if (existing) {
      slug = `${slug}-${Date.now().toString(36).slice(-4)}`
    }

    const { data: thread, error: threadErr } = await supabase
      .from('forum_threads')
      .insert({ sub_forum_id: subForumId, slug, title: t, author_id: userId })
      .select('id, slug')
      .single()
    if (threadErr || !thread) {
      setError(threadErr?.message || 'Could not create the thread.')
      setPosting(false)
      return
    }

    const { error: postErr } = await supabase.from('forum_posts').insert({
      thread_id: thread.id,
      author_id: userId,
      content: c,
    })
    if (postErr) {
      // Thread exists but opening post failed. Roll back by deleting the
      // thread so the sub-forum doesn't show a zombie.
      await supabase.from('forum_threads').delete().eq('id', thread.id)
      setError(postErr.message)
      setPosting(false)
      return
    }

    router.push(`/forums/${forumSlug}/${thread.slug}`)
  }

  return (
    <form onSubmit={submit}>
      <div style={{ marginBottom: '12px' }}>
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-light" style={{ display: 'block', marginBottom: '4px' }}>
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="input"
          placeholder="Keep it descriptive — what's the thread about?"
          maxLength={140}
          required
        />
        <p style={{ fontSize: '11px', color: '#666', marginTop: '3px' }}>{title.length} / 140</p>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-light" style={{ display: 'block', marginBottom: '4px' }}>
          First Post
        </label>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          className="input"
          rows={10}
          placeholder="Write out the details. Be specific — the thread title pulls people in, the first post keeps them."
          maxLength={20000}
          style={{ fontFamily: 'inherit', fontSize: '14px', lineHeight: '1.55' }}
          required
        />
        <p style={{ fontSize: '11px', color: '#666', marginTop: '3px' }}>{content.length.toLocaleString()} / 20,000</p>
      </div>

      {error && (
        <div style={{ background: '#fce9e9', border: '1px solid #c02b2b', padding: '8px 12px', color: '#7a1818', fontSize: '13px', marginBottom: '10px' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
        <button type="submit" className="btn-neon" disabled={posting} style={{ padding: '7px 20px' }}>
          {posting ? 'Posting...' : 'Post Thread'}
        </button>
      </div>
    </form>
  )
}
