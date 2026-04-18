'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { compressImage } from '@/lib/imageUpload'
import MentionTextarea from '@/components/MentionTextarea'

const HASHTAG_RE = /#([a-zA-Z0-9_]+)/g

export default function FeedComposer({ onPosted }: { onPosted: () => void }) {
  const supabase = createClient()
  const [content, setContent] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState('')

  const hashtags = Array.from(new Set(Array.from(content.matchAll(HASHTAG_RE), m => m[1].toLowerCase())))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = content.trim()
    if (!text && !file) return
    setPosting(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/auth/login'; return }

    let imageUrl: string | null = null
    if (file) {
      const compressed = await compressImage(file)
      const ext = compressed.name.split('.').pop()?.toLowerCase() || 'jpg'
      const filename = `feed/${user.id}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('posts').upload(filename, compressed)
      if (upErr) { setError('Upload failed: ' + upErr.message); setPosting(false); return }
      const { data: urlData } = supabase.storage.from('posts').getPublicUrl(filename)
      imageUrl = urlData.publicUrl
    }

    const { error: insErr } = await supabase.from('feed_posts').insert({
      author_id: user.id,
      content: text || null,
      image_url: imageUrl,
      hashtags,
    })
    if (insErr) { setError('Post failed: ' + insErr.message); setPosting(false); return }

    setContent('')
    setFile(null)
    setPosting(false)
    onPosted()
  }

  return (
    <form onSubmit={submit} className="glass" style={{ padding: '16px', marginBottom: '16px' }}>
      <div style={{ marginBottom: '10px' }}>
        <MentionTextarea
          value={content}
          onChange={setContent}
          placeholder="Say it in 120 chars. #hashtag, @mention, photo..."
          rows={2}
          maxLength={120}
          style={{ resize: 'none' }}
        />
      </div>
      {hashtags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
          {hashtags.map(tag => (
            <span key={tag} style={{ fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '4px', background: 'rgba(44, 121, 196, 0.12)', border: '1px solid rgba(44, 121, 196, 0.25)', color: '#5fa8dd' }}>#{tag}</span>
          ))}
        </div>
      )}
      {file && (
        <div style={{ marginBottom: '10px', position: 'relative', borderRadius: '8px', overflow: 'hidden', maxHeight: '240px' }}>
          <img src={URL.createObjectURL(file)} alt="" style={{ width: '100%', maxHeight: '240px', objectFit: 'cover' }} />
          <button type="button" onClick={() => setFile(null)} style={{ position: 'absolute', top: '8px', right: '8px', padding: '4px 10px', borderRadius: '6px', background: '#ffffff', border: 'none', color: '#1a1a1a', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>Remove</button>
        </div>
      )}
      {error && <p style={{ fontSize: '12px', color: '#ef4444', marginBottom: '10px' }}>{error}</p>}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <label style={{ cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#5fa8dd', padding: '6px 12px', borderRadius: '6px', background: 'rgba(44, 121, 196, 0.1)', border: '1px solid rgba(44, 121, 196, 0.25)' }}>
          Add Photo
          <input type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: content.length > 100 ? (content.length > 115 ? '#ef4444' : '#90caf9') : '#555555' }}>
            {120 - content.length}
          </span>
          <button type="submit" disabled={posting || (!content.trim() && !file)} className="btn-primary" style={{ fontSize: '12px', padding: '8px 18px', opacity: (posting || (!content.trim() && !file)) ? 0.4 : 1 }}>
            {posting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>
    </form>
  )
}
