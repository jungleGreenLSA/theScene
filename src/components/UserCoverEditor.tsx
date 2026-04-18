'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { compressImage } from '@/lib/imageUpload'

export default function UserCoverEditor({ userId, currentCoverUrl }: { userId: string; currentCoverUrl: string | null }) {
  const supabase = createClient()
  const [isOwner, setIsOwner] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => { if (user?.id === userId) setIsOwner(true) })
  }, [userId])

  const handleUpload = async (file: File) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) { setMessage('Image must be JPEG, PNG, or WebP'); return }
    if (file.size > 5 * 1024 * 1024) { setMessage('Image must be under 5MB'); return }

    setUploading(true)
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const filename = `covers/${userId}/${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from('posts').upload(filename, await compressImage(file), { upsert: true })
    if (upErr) { setMessage('Upload failed: ' + upErr.message); setUploading(false); return }
    const { data: urlData } = supabase.storage.from('posts').getPublicUrl(filename)

    const { error: updErr } = await supabase.from('profiles').update({ cover_image_url: urlData.publicUrl }).eq('id', userId)
    if (updErr) { setMessage('Update failed: ' + updErr.message); setUploading(false); return }

    setMessage('Cover updated!')
    setTimeout(() => window.location.reload(), 600)
  }

  if (!isOwner) return null

  if (!currentCoverUrl) {
    return (
      <label style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
        <span style={{ padding: '12px 22px', borderRadius: '10px', background: 'rgba(124,58,237,0.9)', border: '1px solid rgba(167,139,250,0.5)', color: 'white', fontSize: '13px', fontWeight: 700, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
          {uploading ? 'Uploading...' : 'Upload a Cover Photo'}
        </span>
        {message && <span style={{ fontSize: '11px', color: '#22c55e' }}>{message}</span>}
        <input type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} disabled={uploading}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f) }} />
      </label>
    )
  }

  return (
    <label style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 2, padding: '6px 12px', borderRadius: '6px', background: 'rgba(12,12,20,0.9)', border: '1px solid rgba(167,139,250,0.4)', color: '#e2e4e9', fontSize: '11px', fontWeight: 600, cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
      Change cover
      <input type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} disabled={uploading}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f) }} />
    </label>
  )
}
