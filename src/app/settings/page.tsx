'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AddressAutocomplete from '@/components/AddressAutocomplete'
import type { ParsedAddress } from '@/lib/mapbox'
import { compressImage } from '@/lib/imageUpload'

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
  last_name: string
  bio: string
  location: string
  is_public: boolean
  avatar_url: string
  subscription_tier: string
  username_changed_at: string | null
  filter_clubs_nearby: boolean
  filter_events_nearby: boolean
  filter_people_nearby: boolean
  filter_marketplace_nearby: boolean
  tiktok_url: string | null
  twitch_url: string | null
  website_url: string | null
  forum_signature: string | null
}

// Keep this list in sync with migration 024's sanitize_social_url().
// We block it client-side too so we can show a friendly message instead
// of silently nulling the field on save.
const BLOCKED_LINK_HOSTS = [
  'beacons.ai',
  'linktr.ee',
  'linktree.com',
  'bio.link',
  'lnk.bio',
  'about.me',
  'snipfeed.co',
  'allmylinks.com',
  'carrd.co',
  'komi.io',
  'stan.store',
  'koji.to',
]

function isBlockedLink(url: string): boolean {
  if (!url) return false
  const lower = url.toLowerCase()
  return BLOCKED_LINK_HOSTS.some(h => lower.includes(h))
}

const USERNAME_COOLDOWN_DAYS = 60
const USERNAME_PATTERN = /^[a-z0-9_]{3,30}$/

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

      const { data: p, error: profileError } = await supabase.from('profiles').select('*').eq('id', user.id).single()

      // If no profile exists (trigger failed), create one
      if (profileError || !p) {
        const username = user.user_metadata?.username || user.user_metadata?.full_name?.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'user_' + user.id.slice(0, 8)
        const fullName = user.user_metadata?.full_name || user.user_metadata?.name || ''
        const nameParts = fullName.split(' ')
        await supabase.from('profiles').insert({
          id: user.id,
          username: username + '_' + user.id.slice(0, 4),
          display_name: fullName,
          avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
          first_name: user.user_metadata?.first_name || nameParts[0] || '',
          last_name: user.user_metadata?.last_name || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : ''),
        })
        const { data: newP } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        setProfile(newP)
      } else {
        setProfile(p)
      }

      const { data: v } = await supabase.from('vehicles').select('id, year, make, model, color, is_public, slug').eq('owner_id', user.id)
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

  const updateProfile = async (field: string, value: string | null) => {
    if (!profile) return
    setSaving(true)
    await supabase.from('profiles').update({ [field]: value }).eq('id', profile.id)
    setProfile({ ...profile, [field]: value } as Profile)
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

      {/* My Activity */}
      <Link href="/activity" className="glass" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', marginBottom: '20px', textDecoration: 'none' }}>
        <div>
          <h2 className="text-foreground font-bold" style={{ fontSize: '15px', marginBottom: '2px' }}>My Activity</h2>
          <p className="text-muted-light" style={{ fontSize: '12px' }}>Manage your guestbook comments, WWYD votes, and sightings</p>
        </div>
        <span className="text-muted" style={{ fontSize: '18px' }}>›</span>
      </Link>

      {/* Profile Settings */}
      <div className="glass" style={{ padding: '28px', marginBottom: '20px' }}>
        <h2 className="text-lg font-bold text-foreground" style={{ marginBottom: '20px' }}>Profile</h2>

        {/* Avatar */}
        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <label style={{ cursor: 'pointer', position: 'relative' }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%', flexShrink: 0,
              border: '2px solid rgba(44, 121, 196, 0.3)',
              backgroundImage: profile?.avatar_url ? `url(${profile.avatar_url})` : 'none',
              backgroundSize: 'cover', backgroundPosition: 'center',
              backgroundColor: '#e4e4e4',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {!profile?.avatar_url && <span style={{ fontSize: '10px', fontWeight: 700, color: '#555555', letterSpacing: '1px' }}>ADD</span>}
            </div>
            <div style={{ position: 'absolute', bottom: -2, right: -2, width: '22px', height: '22px', borderRadius: '50%', background: '#2c79c4', border: '2px solid #12121e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: 'white' }}>+</div>
            <input type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file || !profile) return

              const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
              const filename = `avatars/${profile.id}/${Date.now()}.${ext}`

              // Upload to posts bucket (reliable, already configured)
              const { error: uploadError } = await supabase.storage.from('posts').upload(filename, await compressImage(file), { upsert: true })
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
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-light" style={{ display: 'block', marginBottom: '6px' }}>Last Name <span style={{ color: '#555555', fontWeight: 400, textTransform: 'none' }}>(optional)</span></label>
            <input
              type="text"
              defaultValue={profile?.last_name || ''}
              onBlur={(e) => updateProfile('last_name', e.target.value)}
              className="input"
              placeholder="Squier"
              maxLength={64}
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
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-light" style={{ display: 'block', marginBottom: '6px' }}>
            Location <span style={{ color: '#555555', fontWeight: 400, textTransform: 'none' }}>(city autocompletes — your state powers the heatmaps)</span>
          </label>
          <AddressAutocomplete
            defaultValue={profile?.location || ''}
            placeholder="Start typing a city — e.g. &quot;Omaha, NE&quot;"
            mode="city"
            onChange={(a: ParsedAddress) => {
              const value = [a.city, a.state].filter(Boolean).join(', ')
              if (value) updateProfile('location', value)
            }}
          />
        </div>

        {/* Forum signature — rendered at the bottom of each forum post. */}
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e4e4e4' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '10px', color: '#1a1a1a' }}>Forum Signature</h3>
          <p style={{ fontSize: '12px', color: 'var(--color-muted)', marginBottom: '10px' }}>
            Appears under every forum post. Up to 200 characters. Good for your ride, Instagram handle, or a tagline.
          </p>
          <textarea
            defaultValue={profile?.forum_signature || ''}
            onBlur={(e) => updateProfile('forum_signature', e.target.value.trim() || null)}
            className="input"
            rows={3}
            maxLength={200}
            placeholder={`2010 Chevy SS — cold air + cam\nIG: @yourhandle`}
            style={{ fontFamily: 'inherit', fontSize: '13px', lineHeight: 1.5 }}
          />
        </div>

        {/* Social Links — TikTok / Twitch / Website. We reject any URL
            pointing to a link-in-bio aggregator so the platform stays
            focused on enthusiast content, not paid promo funnels. */}
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e4e4e4' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '10px', color: '#1a1a1a' }}>Social Links</h3>
          <p style={{ fontSize: '12px', color: 'var(--color-muted)', marginBottom: '14px' }}>
            Share where you post. Aggregator links (linktree, beacons, bio.link, etc.) are not allowed.
          </p>

          {(['tiktok_url', 'twitch_url', 'website_url'] as const).map((field) => {
            const labelMap = { tiktok_url: 'TikTok', twitch_url: 'Twitch', website_url: 'Personal Website' }
            const placeholderMap = {
              tiktok_url: 'https://tiktok.com/@yourhandle',
              twitch_url: 'https://twitch.tv/yourhandle',
              website_url: 'https://yourdomain.com',
            }
            return (
              <div key={field} style={{ marginBottom: '10px' }}>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-light" style={{ display: 'block', marginBottom: '4px' }}>
                  {labelMap[field]}
                </label>
                <input
                  type="url"
                  defaultValue={profile?.[field] || ''}
                  onBlur={(e) => {
                    const val = e.target.value.trim()
                    if (val && isBlockedLink(val)) {
                      setMessage(`${labelMap[field]}: link-in-bio aggregators are not allowed.`)
                      setTimeout(() => setMessage(''), 4000)
                      e.target.value = profile?.[field] || ''
                      return
                    }
                    updateProfile(field, val || null)
                  }}
                  className="input"
                  placeholder={placeholderMap[field]}
                  maxLength={256}
                />
              </div>
            )
          })}
        </div>

        <div style={{ textAlign: 'right', marginTop: '8px' }}>
          <button onClick={() => { setMessage('Profile saved!'); setTimeout(() => setMessage(''), 3000) }} style={{ padding: '10px 24px', borderRadius: '8px', background: '#2c79c4', border: '1px solid #5fa8dd', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            Save Changes
          </button>
        </div>
      </div>

      {/* Nearby Filters */}
      {profile && (() => {
        const userState = (profile.location || '').split(',').map(s => s.trim())[1]?.toUpperCase().slice(0, 2) || null
        const toggleRow = (key: 'filter_clubs_nearby' | 'filter_events_nearby' | 'filter_people_nearby' | 'filter_marketplace_nearby', label: string, desc: string) => {
          const on = !!profile[key]
          return (
            <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderTop: '1px solid #f5f5f5' }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a1a' }}>{label}</p>
                <p style={{ fontSize: '11px', color: '#555555', marginTop: '2px' }}>{desc}</p>
              </div>
              <button
                onClick={async () => {
                  await supabase.from('profiles').update({ [key]: !on }).eq('id', profile.id)
                  setProfile({ ...profile, [key]: !on })
                }}
                style={{
                  width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                  background: on ? '#2c79c4' : '#d4d4d4',
                  position: 'relative', transition: 'background 0.2s',
                  flexShrink: 0, marginLeft: '16px',
                }}
              >
                <span style={{
                  position: 'absolute', top: '3px', left: on ? '23px' : '3px',
                  width: '18px', height: '18px', borderRadius: '50%', background: 'white',
                  transition: 'left 0.2s',
                }} />
              </button>
            </div>
          )
        }
        return (
          <div className="glass" style={{ padding: '28px', marginBottom: '20px' }}>
            <h2 className="text-lg font-bold text-foreground" style={{ marginBottom: '4px' }}>Only Show Me What&apos;s Nearby</h2>
            <p className="text-muted-light text-sm" style={{ marginBottom: '8px' }}>
              Scope listings to within <span style={{ color: '#5fa8dd', fontWeight: 600 }}>100 miles</span> of your city{userState ? ` (${userState})` : ''}. Crosses state lines — being in Sanger TX still catches Oklahoma if it&apos;s close enough.
              {!userState && ' Set your Location above to enable these.'}
            </p>
            <div style={{ opacity: userState ? 1 : 0.5, pointerEvents: userState ? 'auto' : 'none' }}>
              {toggleRow('filter_events_nearby', 'Events only near me', 'Only shows events within 100 mi of your city on /events')}
              {toggleRow('filter_clubs_nearby', 'Clubs only near me', 'Only shows clubs with a chapter within 100 mi of you')}
              {toggleRow('filter_people_nearby', 'People only near me', 'Filters Explore to members within 100 mi of you')}
              {toggleRow('filter_marketplace_nearby', 'Marketplace only near me', 'Only shows listings/shops within 100 mi of your city')}
            </div>
          </div>
        )
      })()}

      {/* Profile Visibility */}
      <div className="glass" style={{ padding: '28px', marginBottom: '20px' }}>
        <h2 className="text-lg font-bold text-foreground" style={{ marginBottom: '8px' }}>Profile Visibility</h2>
        <p className="text-muted-light text-sm" style={{ marginBottom: '16px' }}>Control whether your profile appears in search and explore.</p>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => updateProfileVisibility(true)}
            disabled={saving}
            style={{
              flex: 1, padding: '14px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              background: profile?.is_public ? 'rgba(44, 121, 196, 0.2)' : '#f0f0f0',
              color: profile?.is_public ? '#5fa8dd' : '#555555',
              fontWeight: 600, fontSize: '0.85rem',
              outline: profile?.is_public ? '2px solid #2c79c4' : '1px solid #e4e4e4',
            }}
          >
            Public
          </button>
          <button
            onClick={() => updateProfileVisibility(false)}
            disabled={saving}
            style={{
              flex: 1, padding: '14px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              background: !profile?.is_public ? 'rgba(44, 121, 196, 0.2)' : '#f0f0f0',
              color: !profile?.is_public ? '#5fa8dd' : '#555555',
              fontWeight: 600, fontSize: '0.85rem',
              outline: !profile?.is_public ? '2px solid #2c79c4' : '1px solid #e4e4e4',
            }}
          >
            Private
          </button>
        </div>
      </div>

      {/* Vehicle Visibility */}
      {vehicles.length > 0 && (
        <div className="glass" style={{ padding: '28px', marginBottom: '20px' }}>
          <h2 className="text-lg font-bold text-foreground" style={{ marginBottom: '8px' }}>Vehicle Visibility</h2>
          <p className="text-muted-light text-sm" style={{ marginBottom: '16px' }}>Control whether each vehicle is visible to others. Private vehicles can still be shared via direct link.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {vehicles.map((v) => (
              <div key={v.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: '8px', background: '#f0f0f0', border: '1px solid #e4e4e4' }}>
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
                  {v.is_public ? 'Public' : 'Private'}
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
      <div className="glass" style={{ padding: '28px', marginBottom: '20px' }}>
        <h2 className="text-lg font-bold text-foreground" style={{ marginBottom: '16px' }}>Account</h2>

        {/* Username */}
        {profile && (() => {
          const lastChanged = profile.username_changed_at ? new Date(profile.username_changed_at) : null
          const cooldownEnds = lastChanged ? new Date(lastChanged.getTime() + USERNAME_COOLDOWN_DAYS * 86400000) : null
          const now = new Date()
          const canChange = !cooldownEnds || cooldownEnds <= now
          const daysLeft = cooldownEnds && cooldownEnds > now ? Math.ceil((cooldownEnds.getTime() - now.getTime()) / 86400000) : 0
          return (
            <div style={{ marginBottom: '20px' }}>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-light" style={{ display: 'block', marginBottom: '6px' }}>
                Username {!canChange && <span style={{ color: '#555555', fontWeight: 400, textTransform: 'none' }}>(locked for {daysLeft} more day{daysLeft !== 1 ? 's' : ''})</span>}
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ display: 'flex', alignItems: 'center', padding: '0 12px', color: '#555555', fontSize: '13px' }}>@</span>
                <input
                  type="text"
                  defaultValue={profile.username}
                  disabled={!canChange}
                  onBlur={async (e) => {
                    const newUsername = e.target.value.trim().toLowerCase()
                    if (!newUsername || newUsername === profile.username) return
                    if (!USERNAME_PATTERN.test(newUsername)) {
                      setMessage('Username must be 3–30 characters, lowercase letters, numbers, or underscores only.')
                      e.target.value = profile.username
                      setTimeout(() => setMessage(''), 5000)
                      return
                    }
                    const { data: existing } = await supabase.from('profiles').select('id').ilike('username', newUsername).neq('id', profile.id).limit(1)
                    if (existing && existing.length > 0) {
                      setMessage(`@${newUsername} is already taken.`)
                      e.target.value = profile.username
                      setTimeout(() => setMessage(''), 5000)
                      return
                    }
                    const { error } = await supabase.from('profiles').update({ username: newUsername, username_changed_at: new Date().toISOString() }).eq('id', profile.id)
                    if (error) {
                      setMessage('Username update failed: ' + error.message)
                      e.target.value = profile.username
                      setTimeout(() => setMessage(''), 5000)
                      return
                    }
                    setProfile({ ...profile, username: newUsername, username_changed_at: new Date().toISOString() })
                    setMessage(`Username changed to @${newUsername}. Next change available in ${USERNAME_COOLDOWN_DAYS} days.`)
                    setTimeout(() => setMessage(''), 5000)
                  }}
                  className="input"
                  style={{ flex: 1, opacity: canChange ? 1 : 0.6 }}
                  placeholder="your_username"
                  maxLength={30}
                />
              </div>
              <p className="text-muted" style={{ fontSize: '11px', marginTop: '4px' }}>
                {canChange
                  ? 'Lowercase letters, numbers, and underscores. 3–30 characters. Changeable once every 60 days.'
                  : `Next change available ${cooldownEnds!.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.`}
              </p>
            </div>
          )
        })()}

        {/* Reset Password */}
        <button
          onClick={async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user?.email) return
            const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
              redirectTo: `${window.location.origin}/auth/callback?next=/settings`,
            })
            if (error) setMessage('Error: ' + error.message)
            else setMessage('Password reset link sent to ' + user.email)
            setTimeout(() => setMessage(''), 5000)
          }}
          style={{ display: 'block', width: '100%', padding: '12px', borderRadius: '8px', background: '#f5f5f5', border: '1px solid #d4d4d4', color: '#555555', fontSize: '13px', fontWeight: 600, cursor: 'pointer', marginBottom: '10px', textAlign: 'left' }}
        >
          Reset Password
        </button>

        {/* Delete Account */}
        <button
          onClick={async () => {
            const confirmed = window.confirm('Are you sure you want to delete your account? This will permanently remove your garage, vehicles, posts, and all data. This cannot be undone.')
            if (!confirmed) return
            const doubleConfirm = window.confirm('This is permanent. Type "delete" in the next prompt to confirm.')
            if (!doubleConfirm) return
            const typed = window.prompt('Type "delete" to permanently delete your account:')
            if (typed?.toLowerCase() !== 'delete') { setMessage('Account deletion cancelled.'); return }

            // Sign out and show goodbye message
            await supabase.auth.signOut()
            window.location.href = '/auth/login?message=account_deleted'
          }}
          style={{ display: 'block', width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', color: '#ef4444', fontSize: '13px', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
        >
          Delete My Account
        </button>
        <p style={{ fontSize: '11px', color: '#555555', marginTop: '8px' }}>
          Account deletion is permanent. To complete deletion, contact <a href="mailto:support@thescene.fyi" style={{ color: '#5fa8dd' }}>support@thescene.fyi</a> and we will process your request and send a confirmation.
        </p>
      </div>
    </div>
  )
}
