'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Props {
  threadId: string
  forumSlug: string
  threadSlug: string
}

export default function ReplyComposer({ threadId, forumSlug, threadSlug }: Props) {
  const [content, setContent] = useState('')
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const submit = async () => {
    const trimmed = content.trim()
    if (trimmed.length < 1) { setError('Write something before posting.'); return }
    if (trimmed.length > 20000) { setError('That reply is too long (20k char limit).'); return }
    setPosting(true)
    setError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('You must be signed in to post.'); setPosting(false); return }
    const { error: insertErr } = await supabase.from('forum_posts').insert({
      thread_id: threadId,
      author_id: user.id,
      content: trimmed,
    })
    if (insertErr) {
      setError(insertErr.message)
      setPosting(false)
      return
    }
    setContent('')
    setPosting(false)
    // Revalidate and scroll to the newly posted reply
    router.refresh()
  }

  return (
    <section className="section-block" style={{ marginTop: '10px' }}>
      <div className="section-head">
        <h2>Post a Reply</h2>
      </div>
      <div style={{ padding: '14px' }}>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          className="input"
          rows={6}
          placeholder="Share your take. Plain text for now — markup will come later."
          maxLength={20000}
          style={{ fontFamily: 'inherit', fontSize: '14px', lineHeight: '1.55' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: '#666' }}>{content.length.toLocaleString()} / 20,000</span>
          {error && <span style={{ fontSize: '12px', color: '#c02b2b', fontWeight: 600 }}>{error}</span>}
          <button
            onClick={submit}
            disabled={posting || content.trim().length === 0}
            className="btn-neon"
            style={{ opacity: posting || content.trim().length === 0 ? 0.5 : 1, padding: '7px 18px' }}
          >
            {posting ? 'Posting...' : 'Post Reply'}
          </button>
        </div>
      </div>
    </section>
  )
}
