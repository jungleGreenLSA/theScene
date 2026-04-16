'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Vehicle {
  id: string
  year: number
  make: string
  model: string
  color: string
  is_public: boolean
  slug: string
}

interface Profile {
  id: string
  username: string
  display_name: string
  first_name: string
  bio: string
  location: string
  is_public: boolean
  avatar_url: string
  subscription_tier: string
}

export default function SettingsPage() {
  const supabase = createClient()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      setUserEmail(user.email || '')

      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      const { data: v } = await supabase.from('vehicles').select('id, year, make, model, color, is_public, slug').eq('owner_id', user.id)

      setProfile(p)
      setVehicles(v || [])
      setLoading(false)
    }
    loadData()
  }, [])

  const updateProfileVisibility = async (isPublic: boolean) => {
    if (!profile) return
    setSaving(true)
    await supabase.from('profiles').update({ is_public: isPublic }).eq('id', profile.id)
    setProfile({ ...profile, is_public: isPublic })
    setMessage('Profile visibility updated.')
    setSaving(false)
    setTimeout(() => setMessage(''), 3000)
  }

  const updateVehicleVisibility = async (vehicleId: string, isPublic: boolean) => {
    setSaving(true)
    await supabase.from('vehicles').update({ is_public: isPublic }).eq('id', vehicleId)
    setVehicles(vehicles.map(v => v.id === vehicleId ? { ...v, is_public: isPublic } : v))
    setMessage('Vehicle visibility updated.')
    setSaving(false)
    setTimeout(() => setMessage(''), 3000)
  }

  const updateProfile = async (field: string, value: string) => {
    if (!profile) return
    setSaving(true)
    await supabase.from('profiles').update({ [field]: value }).eq('id', profile.id)
    setProfile({ ...profile, [field]: value })
    setMessage('Profile updated.')
    setSaving(false)
    setTimeout(() => setMessage(''), 3000)
  }

  if (loading) {
    return (
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '80px 32px 40px' }}>
        <div className="text-center text-muted-light">Loading settings...</div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '80px 32px 40px' }}>
      <h1 className="text-3xl font-bold" style={{ marginBottom: '8px' }}>
        Settings
      </h1>
      <p className="text-muted-light" style={{ fontSize: '0.9rem', marginBottom: '32px' }}>Manage your profile and privacy</p>

      {message && (
        <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', color: '#22c55e', fontSize: '0.85rem' }}>
          {message}
        </div>
      )}

      {/* Profile Settings */}
      <div className="glass" style={{ padding: '28px', marginBottom: '20px' }}>
        <h2 className="text-lg font-bold text-foreground" style={{ marginBottom: '20px' }}>👤 Profile</h2>

        {/* Avatar */}
        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <label style={{ cursor: 'pointer', position: 'relative' }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%', flexShrink: 0,
              border: '2px solid rgba(124,58,237,0.3)',
              backgroundImage: profile?.avatar_url ? `url(${profile.avatar_url})` : 'none',
              backgroundSize: 'cover', backgroundPosition: 'center',
              backgroundColor: 'rgba(26,26,46,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {!profile?.avatar_url && <span style={{ color: '#6b7280' }}>📷</span>}
            </div>
            <div style={{ position: 'absolute', bottom: -2, right: -2, width: '22px', height: '22px', borderRadius: '50%', background: '#7c3aed', border: '2px solid #12121e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: 'white' }}>✏</div>
            <input type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file || !profile) return

              const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
              const filename = `avatars/${profile.id}/${Date.now()}.${ext}`

              // Upload to posts bucket (reliable, already configured)
              const { error: uploadError } = await supabase.storage.from('posts').upload(filename, file, { upsert: true })
              if (uploadError) {
                setMessage('Upload failed: ' + uploadError.message)
                setTimeout(() => setMessage(''), 5000)
                return
              }

              const { data: urlData } = supabase.storage.from('posts').getPublicUrl(filename)
              const { error: updateError } = await supabase.from('profiles').update({ avatar_url: urlData.publicUrl }).eq('id', profile.id)
              if (updateError) {
                setMessage('Profile update failed: ' + updateError.message)
                setTimeout(() => setMessage(''), 5000)
                return
              }

              setProfile({ ...profile, avatar_url: urlData.publicUrl })
              setMessage('Avatar updated!')
              setTimeout(() => setMessage(''), 3000)
            }} />
          </label>
          <div>
            <p className="text-foreground font-semibold" style={{ fontSize: '14px' }}>Profile Photo</p>
            <p className="text-muted" style={{ fontSize: '11px' }}>Click to upload (JPEG, PNG, WebP, max 2MB)</p>
          </div>
        </div>

        {/* Email */}
        <div style={{ marginBottom: '16px' }}>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-light" style={{ display: 'block', marginBottom: '6px' }}>Email</label>
          <input
            type="email"
            defaultValue={userEmail}
            onBlur={async (e) => {
              const newEmail = e.target.value.trim()
              if (newEmail && newEmail !== userEmail) {
                const { error } = await supabase.auth.updateUser({ email: newEmail })
                if (error) { setMessage('Email update failed: ' + error.message) }
                else { setMessage('Confirmation email sent to ' + newEmail); setUserEmail(newEmail) }
                setTimeout(() => setMessage(''), 5000)
              }
            }}
            className="input"
            placeholder="you@example.com"
            maxLength={128}
          />
          <p className="text-muted" style={{ fontSize: '11px', marginTop: '4px' }}>Changing email requires confirmation via the new address</p>
        </div>

        {/* Name */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-light" style={{ display: 'block', marginBottom: '6px' }}>First Name</label>
            <input
              type="text"
              defaultValue={profile?.first_name || ''}
              onBlur={(e) => updateProfile('first_name', e.target.value)}
              className="input"
              placeholder="Jeff"
              maxLength={64}
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-light" style={{ display: 'block', marginBottom: '6px' }}>Display Name</label>
            <input
              type="text"
              defaultValue={profile?.display_name || ''}
              onBlur={(e) => updateProfile('display_name', e.target.value)}
              className="input"
              placeholder="Jeff S."
              maxLength={128}
            />
          </div>
        </div>

        {/* Bio */}
        <div style={{ marginBottom: '16px' }}>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-light" style={{ display: 'block', marginBottom: '6px' }}>Bio</label>
          <textarea
            defaultValue={profile?.bio || ''}
            onBlur={(e) => updateProfile('bio', e.target.value)}
            className="input"
            rows={3}
            placeholder="Tell people about yourself..."
            maxLength={500}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-light" style={{ display: 'block', marginBottom: '6px' }}>Location</label>
          <input
            type="text"
            defaultValue={profile?.location || ''}
            onBlur={(e) => updateProfile('location', e.target.value)}
            className="input"
            placeholder="City, State"
            maxLength={128}
          />
        </div>
      </div>

      {/* Profile Visibility */}
      <div className="glass" style={{ padding: '28px', marginBottom: '20px' }}>
        <h2 className="text-lg font-bold text-foreground" style={{ marginBottom: '8px' }}>🔒 Profile Visibility</h2>
        <p className="text-muted-light text-sm" style={{ marginBottom: '16px' }}>Control whether your profile appears in search and explore.</p>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => updateProfileVisibility(true)}
            disabled={saving}
            style={{
              flex: 1, padding: '14px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              background: profile?.is_public ? 'rgba(124,58,237,0.2)' : 'rgba(18,18,30,0.5)',
              color: profile?.is_public ? '#a78bfa' : '#6b7280',
              fontWeight: 600, fontSize: '0.85rem',
              outline: profile?.is_public ? '2px solid #7c3aed' : '1px solid rgba(255,255,255,0.06)',
            }}
          >
            🌎 Public
          </button>
          <button
            onClick={() => updateProfileVisibility(false)}
            disabled={saving}
            style={{
              flex: 1, padding: '14px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              background: !profile?.is_public ? 'rgba(124,58,237,0.2)' : 'rgba(18,18,30,0.5)',
              color: !profile?.is_public ? '#a78bfa' : '#6b7280',
              fontWeight: 600, fontSize: '0.85rem',
              outline: !profile?.is_public ? '2px solid #7c3aed' : '1px solid rgba(255,255,255,0.06)',
            }}
          >
            🔒 Private
          </button>
        </div>
      </div>

      {/* Vehicle Visibility */}
      {vehicles.length > 0 && (
        <div className="glass" style={{ padding: '28px', marginBottom: '20px' }}>
          <h2 className="text-lg font-bold text-foreground" style={{ marginBottom: '8px' }}>🚗 Vehicle Visibility</h2>
          <p className="text-muted-light text-sm" style={{ marginBottom: '16px' }}>Control whether each vehicle is visible to others. Private vehicles can still be shared via direct link.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {vehicles.map((v) => (
              <div key={v.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: '8px', background: 'rgba(18,18,30,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <span className="text-foreground font-semibold" style={{ fontSize: '0.9rem' }}>{v.year} {v.make} {v.model}</span>
                  <span className="text-muted-light" style={{ fontSize: '0.8rem', marginLeft: '8px' }}>{v.color}</span>
                </div>
                <button
                  onClick={() => updateVehicleVisibility(v.id, !v.is_public)}
                  disabled={saving}
                  style={{
                    padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                    background: v.is_public ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                    color: v.is_public ? '#22c55e' : '#ef4444',
                    fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px',
                  }}
                >
                  {v.is_public ? '🌎 Public' : '🔒 Private'}
                </button>
              </div>
            ))}
          </div>

          <p className="text-muted" style={{ fontSize: '11px', marginTop: '12px' }}>
            Tip: Private vehicles are hidden from Explore and search but can still be shared via the direct URL with friends.
          </p>
        </div>
      )}

      {/* Account */}
      <div className="glass" style={{ padding: '28px' }}>
        <h2 className="text-lg font-bold text-foreground" style={{ marginBottom: '8px' }}>⚙️ Account</h2>
        <p className="text-muted-light text-sm" style={{ marginBottom: '16px' }}>Username: <span className="text-foreground font-semibold">@{profile?.username}</span></p>
        <p className="text-muted" style={{ fontSize: '12px' }}>
          Need to change your email or delete your account? Contact <a href="mailto:support@thescene.fyi" className="text-purple-light hover:text-neon-light">support@thescene.fyi</a>.
        </p>
      </div>
    </div>
  )
}
