'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { compressImage } from '@/lib/imageUpload'

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
      const { data: member } = await supabase.from('club_members').select('role').eq('club_id', clubId).eq('user_id', user.id).maybeSingle()
      if (member && ['admin', 'founder'].includes(member.role)) { setIsAdmin(true); return }
      // Fallback: founder-by-creator in case club_members row is missing
      const { data: club } = await supabase.from('clubs').select('created_by').eq('id', clubId).maybeSingle()
      const { data: { user: u2 } } = await supabase.auth.getUser()
      if (club?.created_by && u2 && club.created_by === u2.id) setIsAdmin(true)
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
    const { error: upErr } = await supabase.storage.from('posts').upload(filename, await compressImage(file), { upsert: true })
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

  // Big centered CTA when no banner exists yet — unmistakable for new clubs.
  const noCover = !currentCoverUrl
  const noLogo = !currentLogoUrl

  return (
    <>
      {noCover && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', pointerEvents: 'none' }}>
          <label style={{ pointerEvents: 'auto', cursor: 'pointer', padding: '14px 28px', borderRadius: '10px', background: 'rgba(44, 121, 196, 0.9)', border: '1px solid rgba(95, 168, 221, 0.5)', color: 'white', fontSize: '14px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', opacity: uploading === 'cover' ? 0.6 : 1 }}>
            {uploading === 'cover' ? 'Uploading...' : 'Upload a Banner Image'}
            <input type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} disabled={uploading !== null}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f, 'cover') }} />
          </label>
          <p style={{ fontSize: '11px', color: '#2c3e50' }}>JPEG, PNG, or WebP · up to 5 MB</p>
        </div>
      )}

      {/* Compact top-left controls when the cover already exists */}
      {!noCover && (
        <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '8px', zIndex: 2 }}>
          <label style={{ cursor: 'pointer', padding: '8px 14px', borderRadius: '6px', background: '#ffffff', border: '1px solid rgba(95, 168, 221, 0.4)', color: '#1a1a1a', fontSize: '12px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px', backdropFilter: 'blur(8px)', opacity: uploading === 'cover' ? 0.6 : 1 }}>
            Change Banner
            <input type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} disabled={uploading !== null}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f, 'cover') }} />
          </label>
          <label style={{ cursor: 'pointer', padding: '8px 14px', borderRadius: '6px', background: '#ffffff', border: '1px solid rgba(95, 168, 221, 0.4)', color: '#1a1a1a', fontSize: '12px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px', backdropFilter: 'blur(8px)', opacity: uploading === 'logo' ? 0.6 : 1 }}>
            {noLogo ? 'Add Logo' : 'Change Logo'}
            <input type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} disabled={uploading !== null}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f, 'logo') }} />
          </label>
        </div>
      )}

      {/* Logo-specific CTA when banner exists but logo doesn't — shows in cover bottom-right */}
      {!noCover && noLogo && (
        <div style={{ position: 'absolute', bottom: '12px', right: '12px', zIndex: 2 }}>
          <label style={{ cursor: 'pointer', padding: '8px 14px', borderRadius: '6px', background: 'rgba(44, 121, 196, 0.9)', border: '1px solid rgba(95, 168, 221, 0.5)', color: 'white', fontSize: '12px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 16px rgba(0,0,0,0.4)', opacity: uploading === 'logo' ? 0.6 : 1 }}>
            {uploading === 'logo' ? 'Uploading...' : 'Upload a Logo'}
            <input type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} disabled={uploading !== null}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f, 'logo') }} />
          </label>
        </div>
      )}

      {message && (
        <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 3, padding: '8px 14px', borderRadius: '6px', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e', fontSize: '12px', fontWeight: 600 }}>
          {message}
        </div>
      )}
    </>
  )
}
