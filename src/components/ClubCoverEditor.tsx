'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  clubId: string
  currentCoverUrl: string | null
  currentLogoUrl: string | null
}

export default function ClubCoverEditor({ clubId, currentCoverUrl, currentLogoUrl }: Props) {
  const supabase = createClient()
  const [isAdmin, setIsAdmin] = useState(false)
  const [uploading, setUploading] = useState<'cover' | 'logo' | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('club_members').select('role').eq('club_id', clubId).eq('user_id', user.id).single()
      if (data && ['admin', 'founder'].includes(data.role)) setIsAdmin(true)
    }
    check()
  }, [clubId])

  const flash = (m: string) => { setMessage(m); setTimeout(() => setMessage(''), 4000) }

  const handleUpload = async (file: File, kind: 'cover' | 'logo') => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) { flash('Image must be JPEG, PNG, or WebP'); return }
    if (file.size > 5 * 1024 * 1024) { flash('Image must be under 5MB'); return }

    setUploading(kind)
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const filename = `clubs/${clubId}/${kind}_${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from('posts').upload(filename, file, { upsert: true })
    if (upErr) { flash('Upload failed: ' + upErr.message); setUploading(null); return }
    const { data: urlData } = supabase.storage.from('posts').getPublicUrl(filename)

    const column = kind === 'cover' ? 'cover_image_url' : 'logo_url'
    const { error: updErr } = await supabase.from('clubs').update({ [column]: urlData.publicUrl }).eq('id', clubId)
    if (updErr) { flash('Update failed: ' + updErr.message); setUploading(null); return }

    flash(`${kind === 'cover' ? 'Banner' : 'Logo'} updated!`)
    setUploading(null)
    setTimeout(() => window.location.reload(), 800)
  }

  if (!isAdmin) return null

  const btnStyle: React.CSSProperties = {
    padding: '6px 12px',
    borderRadius: '6px',
    background: 'rgba(12,12,20,0.85)',
    border: '1px solid rgba(255,255,255,0.15)',
    color: '#e2e4e9',
    fontSize: '11px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
  }

  return (
    <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '8px', zIndex: 2 }}>
      <label style={{ ...btnStyle, opacity: uploading === 'cover' ? 0.6 : 1 }}>
        📷 {currentCoverUrl ? 'Change banner' : 'Add banner'}
        <input type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} disabled={uploading !== null}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f, 'cover') }} />
      </label>
      <label style={{ ...btnStyle, opacity: uploading === 'logo' ? 0.6 : 1 }}>
        🎯 {currentLogoUrl ? 'Change logo' : 'Add logo'}
        <input type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} disabled={uploading !== null}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f, 'logo') }} />
      </label>
      {message && (
        <div style={{ position: 'absolute', top: '36px', left: 0, padding: '6px 10px', borderRadius: '6px', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e', fontSize: '11px', whiteSpace: 'nowrap' }}>{message}</div>
      )}
    </div>
  )
}
