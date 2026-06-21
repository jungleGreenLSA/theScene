'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AvatarUpload({ userId, currentUrl, onUpdate }: { userId: string; currentUrl: string | null; onUpdate: (url: string) => void }) {
  const supabase = createClient()
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) { alert('Only JPEG, PNG, and WebP allowed'); return }
    if (file.size > 2 * 1024 * 1024) { alert('Max 2MB'); return }

    setUploading(true)
    const filename = `${userId}/${Date.now()}.${file.name.split('.').pop()}`

    const { error: uploadError } = await supabase.storage.from('avatars').upload(filename, file, { upsert: true })
    if (uploadError) { alert('Upload failed'); setUploading(false); return }

    const { data } = supabase.storage.from('avatars').getPublicUrl(filename)

    await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', userId)
    onUpdate(data.publicUrl)
    setUploading(false)
  }

  return (
    <label style={{ cursor: 'pointer', position: 'relative', display: 'inline-block' }}>
      <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', background: 'rgba(26,26,46,0.5)', border: '2px solid rgba(45,212,191,0.3)' }}>
        {currentUrl ? (
          <img src={currentUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#6b7280', letterSpacing: '1px' }}>ADD PHOTO</div>
        )}
      </div>
      <div style={{
        position: 'absolute', bottom: -2, right: -2, width: '24px', height: '24px', borderRadius: '50%',
        background: '#2dd4bf', border: '2px solid #0c0c14', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '10px', color: '#0c0c14',
      }}>
        {uploading ? '...' : '+'}
      </div>
      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleUpload} style={{ display: 'none' }} />
    </label>
  )
}
