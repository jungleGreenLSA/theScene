'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AddressAutocomplete from '@/components/AddressAutocomplete'
import { compressImage } from '@/lib/imageUpload'

interface Profile {
  id: string
  username: string
  location: string | null
  avatar_url: string | null
  onboarded_at: string | null
}

// Google sign-ups arrive with a placeholder handle from the DB trigger
// (user_ + first 8 chars of the uuid). Those members pick a real one first.
const PLACEHOLDER_HANDLE = /^user_[0-9a-f]{8}$/i

// 0 = handle (OAuth only), 1 = location, 2 = avatar, 3 = first ride
type Step = 0 | 1 | 2 | 3

export default function OnboardingWizard() {
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [needsHandle, setNeedsHandle] = useState(false)
  const [step, setStep] = useState<Step>(1)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // Step state
  const [handle, setHandle] = useState('')
  const [location, setLocation] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [vehicle, setVehicle] = useState({ year: '', make: '', model: '', color: '' })
  const [vehicleFile, setVehicleFile] = useState<File | null>(null)
  const [hasVehicle, setHasVehicle] = useState<boolean | null>(null)

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: p } = await supabase.from('profiles').select('id, username, location, avatar_url, onboarded_at').eq('id', user.id).maybeSingle()
      if (!p || p.onboarded_at) return
      const { data: v } = await supabase.from('vehicles').select('id').eq('owner_id', user.id).limit(1)
      const owns = (v || []).length > 0
      const placeholder = PLACEHOLDER_HANDLE.test(p.username || '')
      setHasVehicle(owns)
      setNeedsHandle(placeholder)
      setProfile(p as Profile)
      setLocation(p.location || '')
      // Skip steps that are already done
      const startStep: Step | null = placeholder ? 0 : !p.location ? 1 : !p.avatar_url ? 2 : owns ? null : 3
      if (startStep === null) { finish(p.id); return }
      setStep(startStep)
      setOpen(true)
    }
    check()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const finish = async (id: string) => {
    await supabase.from('profiles').update({ onboarded_at: new Date().toISOString() }).eq('id', id)
    setOpen(false)
  }

  const submitHandle = async () => {
    if (!profile) return
    const h = handle.trim().toLowerCase()
    if (h.length < 3) { setError('At least 3 characters'); return }
    if (!/^[a-z0-9_]+$/.test(h)) { setError('Letters, numbers and underscores only'); return }
    if (PLACEHOLDER_HANDLE.test(h)) { setError('Pick something a little more you'); return }
    setBusy(true)
    const { error: upErr } = await supabase.from('profiles').update({ username: h }).eq('id', profile.id)
    setBusy(false)
    if (upErr) {
      setError(upErr.code === '23505' ? 'That handle is taken — try another' : upErr.message)
      return
    }
    setProfile({ ...profile, username: h })
    setError('')
    setStep(profile.location ? (profile.avatar_url ? 3 : 2) : 1)
  }

  const submitLocation = async () => {
    if (!profile) return
    if (!location.trim()) { setError('Pick your city'); return }
    setBusy(true)
    await supabase.from('profiles').update({ location: location.trim() }).eq('id', profile.id)
    setBusy(false)
    setError('')
    setStep(2)
  }

  const submitAvatar = async () => {
    if (!profile) return
    if (!avatarFile) { setStep(3); return }
    setBusy(true)
    const ext = avatarFile.name.split('.').pop()?.toLowerCase() || 'jpg'
    const filename = `avatars/${profile.id}/${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from('posts').upload(filename, await compressImage(avatarFile), { upsert: true })
    if (upErr) { setError('Avatar upload failed: ' + upErr.message); setBusy(false); return }
    const { data: urlData } = supabase.storage.from('posts').getPublicUrl(filename)
    await supabase.from('profiles').update({ avatar_url: urlData.publicUrl }).eq('id', profile.id)
    setBusy(false)
    setError('')
    setStep(3)
  }

  const submitVehicle = async () => {
    if (!profile) return
    if (hasVehicle) { finish(profile.id); return }
    if (!vehicle.year || !vehicle.make || !vehicle.model) { setError('Year, make, and model are required'); return }
    setBusy(true)
    const slug = `${vehicle.year}-${vehicle.make}-${vehicle.model}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36)
    let imageUrl: string | null = null
    if (vehicleFile) {
      const ext = vehicleFile.name.split('.').pop()?.toLowerCase() || 'jpg'
      const filename = `vehicles/${profile.id}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('posts').upload(filename, await compressImage(vehicleFile), { upsert: true })
      if (!upErr) {
        const { data: urlData } = supabase.storage.from('posts').getPublicUrl(filename)
        imageUrl = urlData.publicUrl
      }
    }
    const { error: insErr } = await supabase.from('vehicles').insert({
      owner_id: profile.id,
      slug,
      year: parseInt(vehicle.year),
      make: vehicle.make,
      model: vehicle.model,
      color: vehicle.color || null,
      primary_image_url: imageUrl,
      is_primary: true,
      is_public: true,
    })
    setBusy(false)
    if (insErr) { setError('Vehicle create failed: ' + insErr.message); return }
    finish(profile.id)
  }

  const skip = async () => {
    if (profile) await finish(profile.id)
  }

  if (!open || !profile) return null

  const total = needsHandle ? 4 : 3
  const current = needsHandle ? step + 1 : step

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.78)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div role="dialog" aria-modal="true" aria-labelledby="onboarding-title" className="panel panel-accent" style={{ width: '100%', maxWidth: '480px', padding: '26px', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <span className="eyebrow">Step {current} of {total}</span>
          {/* The handle step can't be skipped — everything else can. */}
          {step !== 0 && (
            <button type="button" onClick={skip} style={{ background: 'none', border: 'none', color: 'var(--color-muted)', fontSize: '12px', cursor: 'pointer' }}>Skip for now</button>
          )}
        </div>

        {step === 0 && (
          <>
            <h2 id="onboarding-title" style={{ fontSize: '30px', marginBottom: '6px' }}>Pick your handle</h2>
            <p className="text-muted-light" style={{ fontSize: '13px', marginBottom: '16px' }}>This is your garage&apos;s address. You can change it later from Settings.</p>
            <input
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submitHandle() }}
              className="input"
              placeholder="ex: chevyguy95"
              autoFocus
              autoComplete="username"
              minLength={3}
            />
            <p className="spec" style={{ fontSize: '11px', marginTop: '6px' }}>thescene.fyi/user/<span style={{ color: 'var(--color-foreground)' }}>{handle.trim().toLowerCase() || 'yourname'}</span></p>
            {error && <p style={{ fontSize: '12px', color: 'var(--color-danger)', marginTop: '8px' }}>{error}</p>}
            <button type="button" onClick={submitHandle} disabled={busy} className="btn-primary" style={{ width: '100%', marginTop: '16px' }}>
              {busy ? 'Saving…' : 'Claim it →'}
            </button>
          </>
        )}

        {step === 1 && (
          <>
            <h2 id="onboarding-title" style={{ fontSize: '30px', marginBottom: '6px' }}>Where are you based?</h2>
            <p className="text-muted-light" style={{ fontSize: '13px', marginBottom: '16px' }}>So we can show you nearby events, clubs, and shops.</p>
            <AddressAutocomplete
              defaultValue={location}
              placeholder="Start typing your city..."
              mode="city"
              onChange={(a) => { const v = [a.city, a.state].filter(Boolean).join(', '); if (v) setLocation(v) }}
            />
            {error && <p style={{ fontSize: '12px', color: 'var(--color-danger)', marginTop: '8px' }}>{error}</p>}
            <button type="button" onClick={submitLocation} disabled={busy} className="btn-primary" style={{ width: '100%', marginTop: '16px' }}>
              {busy ? 'Saving…' : 'Next →'}
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <h2 id="onboarding-title" style={{ fontSize: '30px', marginBottom: '6px' }}>Add a profile photo</h2>
            <p className="text-muted-light" style={{ fontSize: '13px', marginBottom: '16px' }}>Optional — you can always add one later from Settings.</p>
            <label className="panel-inset" style={{ display: 'block', padding: '30px', borderStyle: 'dashed', borderColor: 'var(--color-border-hover)', textAlign: 'center', cursor: 'pointer' }}>
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} style={{ display: 'none' }} />
              <span style={{ fontSize: '13px', color: avatarFile ? 'var(--color-success)' : 'var(--color-muted-light)' }}>
                {avatarFile ? avatarFile.name : 'Tap to upload'}
              </span>
            </label>
            {error && <p style={{ fontSize: '12px', color: 'var(--color-danger)', marginTop: '8px' }}>{error}</p>}
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button type="button" onClick={() => setStep(1)} className="btn-outline" style={{ flex: 1 }}>Back</button>
              <button type="button" onClick={submitAvatar} disabled={busy} className="btn-primary" style={{ flex: 2 }}>
                {busy ? 'Uploading…' : avatarFile ? 'Next →' : 'Skip →'}
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 id="onboarding-title" style={{ fontSize: '30px', marginBottom: '6px' }}>
              {hasVehicle ? 'You\'re all set' : 'Park your first ride'}
            </h2>
            <p className="text-muted-light" style={{ fontSize: '13px', marginBottom: '16px' }}>
              {hasVehicle ? 'Welcome to The Scene. Go find your people.' : 'You can add more cars, photos and mods later from your Garage.'}
            </p>
            {!hasVehicle && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="number" placeholder="Year" value={vehicle.year} onChange={(e) => setVehicle({ ...vehicle, year: e.target.value })} className="input" style={{ flex: 0.7 }} />
                  <input placeholder="Make" value={vehicle.make} onChange={(e) => setVehicle({ ...vehicle, make: e.target.value })} className="input" style={{ flex: 1 }} />
                  <input placeholder="Model" value={vehicle.model} onChange={(e) => setVehicle({ ...vehicle, model: e.target.value })} className="input" style={{ flex: 1 }} />
                </div>
                <input placeholder="Color (optional)" value={vehicle.color} onChange={(e) => setVehicle({ ...vehicle, color: e.target.value })} className="input" />
                <label className="panel-inset" style={{ display: 'block', padding: '16px', borderStyle: 'dashed', borderColor: 'var(--color-border-hover)', textAlign: 'center', cursor: 'pointer' }}>
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setVehicleFile(e.target.files?.[0] || null)} style={{ display: 'none' }} />
                  <span style={{ fontSize: '12px', color: vehicleFile ? 'var(--color-success)' : 'var(--color-muted-light)' }}>
                    {vehicleFile ? vehicleFile.name : 'Cover photo (optional)'}
                  </span>
                </label>
              </div>
            )}
            {error && <p style={{ fontSize: '12px', color: 'var(--color-danger)', marginTop: '8px' }}>{error}</p>}
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button type="button" onClick={() => setStep(2)} className="btn-outline" style={{ flex: 1 }}>Back</button>
              <button type="button" onClick={submitVehicle} disabled={busy} className="btn-primary" style={{ flex: 2 }}>
                {busy ? 'Saving…' : hasVehicle ? 'Finish' : 'Add & finish'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
