'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { compressImage } from '@/lib/imageUpload'

interface WYDPost {
  id: string
  title: string
  description: string
  budget: string
  image_url: string
  is_active: boolean
  created_at: string
  author: { id: string; username: string; display_name: string; avatar_url: string }
  options: { id: string; label: string; vote_count: number }[]
}

export default function WWYDPage() {
  const supabase = createClient()
  const [posts, setPosts] = useState<WYDPost[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [votedPosts, setVotedPosts] = useState<Set<string>>(new Set())
  const [form, setForm] = useState({ title: '', description: '', budget: '', options: ['', '', ''] })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)
      const { data } = await supabase
        .from('wwyd_posts')
        .select('*, author:profiles!wwyd_posts_author_id_fkey(id, username, display_name, avatar_url), options:wwyd_options(*)')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(20)
      setPosts((data || []) as unknown as WYDPost[])

      // Hydrate which posts this user has already voted on so we lock them
      if (user && data && data.length > 0) {
        const { data: myVotes } = await supabase
          .from('wwyd_votes')
          .select('post_id')
          .eq('voter_id', user.id)
          .in('post_id', data.map(p => p.id))
        if (myVotes) setVotedPosts(new Set(myVotes.map(v => v.post_id)))
      }

      setLoading(false)
    }
    fetch()
  }, [])

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Delete this question and all votes on it? This cannot be undone.')) return
    const { error } = await supabase.from('wwyd_posts').delete().eq('id', postId)
    if (error) { alert('Delete failed: ' + error.message); return }
    setPosts(posts.filter(p => p.id !== postId))
  }

  const handleVote = async (postId: string, optionId: string) => {
    if (votedPosts.has(postId)) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/auth/login'; return }

    // Optimistic: lock the post + bump the option count locally before the DB call.
    // Trigger (migration 023) keeps vote_count in sync server-side.
    setVotedPosts(prev => new Set([...prev, postId]))
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p
      return { ...p, options: p.options.map(o => o.id === optionId ? { ...o, vote_count: o.vote_count + 1 } : o) }
    }))

    const { error } = await supabase.from('wwyd_votes').insert({ post_id: postId, option_id: optionId, voter_id: user.id })
    if (error) {
      // Rollback
      setVotedPosts(prev => { const s = new Set(prev); s.delete(postId); return s })
      setPosts(prev => prev.map(p => {
        if (p.id !== postId) return p
        return { ...p, options: p.options.map(o => o.id === optionId ? { ...o, vote_count: Math.max(0, o.vote_count - 1) } : o) }
      }))
      alert('Vote failed: ' + error.message)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/auth/login'; return }

    let imageUrl: string | null = null
    if (imageFile) {
      const ext = imageFile.name.split('.').pop()?.toLowerCase() || 'jpg'
      const filename = `wwyd/${user.id}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('posts').upload(filename, await compressImage(imageFile))
      if (!upErr) {
        const { data: urlData } = supabase.storage.from('posts').getPublicUrl(filename)
        imageUrl = urlData.publicUrl
      }
    }

    const { data: post } = await supabase.from('wwyd_posts').insert({
      author_id: user.id, title: form.title, description: form.description, budget: form.budget, image_url: imageUrl,
    }).select().single()

    if (post) {
      const options = form.options.filter(o => o.trim()).map((label, i) => ({
        post_id: post.id, label, sort_order: i,
      }))
      await supabase.from('wwyd_options').insert(options)
    }

    setShowForm(false)
    setForm({ title: '', description: '', budget: '', options: ['', '', ''] })
    setImageFile(null)
    setSubmitting(false)
    window.location.reload()
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '80px 32px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="text-3xl font-bold">What Would <span className="text-neon-light">You Do?</span></h1>
          <p className="text-muted-light" style={{ marginTop: '4px', fontSize: '0.85rem' }}>Got a budget? Ask the community what to do next.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-neon" style={{ fontSize: '12px' }}>
          {showForm ? 'Cancel' : 'Ask the Community'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="glass" style={{ padding: '24px', marginBottom: '20px' }}>
          <div style={{ marginBottom: '12px' }}>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-light" style={{ display: 'block', marginBottom: '6px' }}>Question</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input" placeholder='e.g. "I have $3,000 to spend, what should I do next?"' required />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-light" style={{ display: 'block', marginBottom: '6px' }}>Budget</label>
            <input value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} className="input" placeholder="$3,000" />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-light" style={{ display: 'block', marginBottom: '6px' }}>Details (optional)</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input" rows={2} placeholder="Tell the community about your car and what you're thinking..." />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-light" style={{ display: 'block', marginBottom: '6px' }}>Photo of your car (optional)</label>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="input" style={{ fontSize: '13px' }} />
            {imageFile && <p style={{ fontSize: '11px', color: '#22c55e', marginTop: '4px' }}>{imageFile.name}</p>}
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-light" style={{ display: 'block', marginBottom: '6px' }}>Options to Vote On <span style={{ color: '#6b7280', fontWeight: 400, textTransform: 'none' }}>(2–4 choices)</span></label>
            {form.options.map((opt, i) => (
              <div key={i} style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                <input value={opt} onChange={(e) => { const o = [...form.options]; o[i] = e.target.value; setForm({ ...form, options: o }) }} className="input" placeholder={`Option ${i + 1}`} style={{ flex: 1 }} required={i < 2} />
                {form.options.length > 2 && (
                  <button type="button" onClick={() => setForm({ ...form, options: form.options.filter((_, idx) => idx !== i) })} style={{ padding: '0 12px', borderRadius: '6px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Remove</button>
                )}
              </div>
            ))}
            {form.options.length < 4 && (
              <button type="button" onClick={() => setForm({ ...form, options: [...form.options, ''] })} style={{ background: 'none', border: 'none', color: '#a78bfa', fontSize: '13px', cursor: 'pointer' }}>+ Add option ({4 - form.options.length} more)</button>
            )}
          </div>
          <button type="submit" disabled={submitting} className="btn-neon" style={{ opacity: submitting ? 0.5 : 1, fontSize: '12px' }}>
            {submitting ? 'Posting...' : 'Post Question'}
          </button>
        </form>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[1,2].map(i => <div key={i} className="glass animate-pulse" style={{ height: '200px' }} />)}
        </div>
      ) : posts.length === 0 ? (
        <div className="glass" style={{ padding: '48px 32px', textAlign: 'center' }}>
          <h2 className="text-xl font-bold" style={{ marginBottom: '8px' }}>No questions yet</h2>
          <p className="text-muted-light" style={{ fontSize: '0.9rem' }}>Be the first to ask the community for advice!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {posts.map((post) => {
            const totalVotes = post.options.reduce((sum, o) => sum + o.vote_count, 0)
            const hasVoted = votedPosts.has(post.id)
            return (
              <div key={post.id} className="glass" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                  <Link href={`/user/${post.author?.username}`} style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', background: 'rgba(26,26,46,0.5)', flexShrink: 0, display: 'block' }}>
                    {post.author?.avatar_url ? <img src={post.author.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#6b7280' }}>{post.author?.username?.charAt(0).toUpperCase()}</div>}
                  </Link>
                  <div style={{ flex: 1 }}>
                    <Link href={`/user/${post.author?.username}`} className="font-semibold text-foreground hover:text-purple-light" style={{ fontSize: '14px' }}>{post.author?.display_name || post.author?.username}</Link>
                    <p className="text-muted" style={{ fontSize: '11px' }}>{new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                  </div>
                  {currentUserId === post.author?.id && (
                    <button onClick={() => handleDeletePost(post.id)} className="btn-danger-sm">Delete</button>
                  )}
                </div>

                <h3 className="font-bold text-foreground" style={{ fontSize: '1.1rem', marginBottom: '6px' }}>{post.title}</h3>
                {post.image_url && (
                  <div style={{ borderRadius: '8px', overflow: 'hidden', marginBottom: '12px', maxHeight: '360px', background: 'rgba(26,26,46,0.5)' }}>
                    <img src={post.image_url} alt="" style={{ width: '100%', maxHeight: '360px', objectFit: 'cover' }} />
                  </div>
                )}
                {post.budget && <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '4px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e', fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>Budget: {post.budget}</span>}
                {post.description && <p className="text-muted-light" style={{ fontSize: '13px', marginBottom: '14px', lineHeight: 1.5 }}>{post.description}</p>}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {post.options.map((opt) => {
                    const pct = totalVotes > 0 ? (opt.vote_count / totalVotes) * 100 : 0
                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleVote(post.id, opt.id)}
                        disabled={hasVoted}
                        style={{
                          position: 'relative', width: '100%', textAlign: 'left', padding: '12px 16px',
                          borderRadius: '8px', border: 'none', cursor: hasVoted ? 'default' : 'pointer',
                          background: 'rgba(18,18,30,0.5)', outline: '1px solid rgba(255,255,255,0.06)',
                          overflow: 'hidden', transition: 'all 0.2s',
                        }}
                      >
                        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, background: 'rgba(124,58,237,0.15)', transition: 'width 0.5s ease', borderRadius: '8px' }} />
                        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="text-foreground" style={{ fontSize: '14px', fontWeight: 500 }}>{opt.label}</span>
                          <span className="text-muted-light" style={{ fontSize: '12px', fontWeight: 600 }}>{opt.vote_count} vote{opt.vote_count !== 1 ? 's' : ''} {totalVotes > 0 && `(${Math.round(pct)}%)`}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
                <p className="text-muted" style={{ fontSize: '11px', marginTop: '8px' }}>{totalVotes} total vote{totalVotes !== 1 ? 's' : ''}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
