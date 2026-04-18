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

export default function OnboardingWizard() {
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // Step state
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
      setHasVehicle((v || []).length > 0)
      setProfile(p as Profile)
      setLocation(p.location || '')
      // Skip steps that are already done
      const startStep = !p.location ? 1 : !p.avatar_url ? 2 : (v && v.length > 0) ? null : 3
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

  const stepColor = '#f97316'

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="glass" style={{ width: '100%', maxWidth: '480px', padding: '28px', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: stepColor }}>Step {step} of 3</span>
          <button onClick={skip} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '12px', cursor: 'pointer' }}>Skip for now</button>
        </div>

        {step === 1 && (
          <>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#e2e4e9', marginBottom: '8px' }}>Where are you based?</h2>
            <p style={{ fontSize: '13px', color: '#8892a4', marginBottom: '18px' }}>So we can show you nearby events, clubs, and shops.</p>
            <AddressAutocomplete
              defaultValue={location}
              placeholder="Start typing your city..."
              mode="city"
              onChange={(a) => { const v = [a.city, a.state].filter(Boolean).join(', '); if (v) setLocation(v) }}
            />
            {error && <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '8px' }}>{error}</p>}
            <button onClick={submitLocation} disabled={busy} className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '16px', opacity: busy ? 0.5 : 1 }}>
              {busy ? 'Saving...' : 'Next →'}
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#e2e4e9', marginBottom: '8px' }}>Add a profile photo</h2>
            <p style={{ fontSize: '13px', color: '#8892a4', marginBottom: '18px' }}>Optional — you can always add one later from Settings.</p>
            <label style={{ display: 'block', padding: '32px', borderRadius: '8px', border: '2px dashed rgba(255,255,255,0.15)', textAlign: 'center', cursor: 'pointer', background: 'rgba(18,18,30,0.5)' }}>
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} style={{ display: 'none' }} />
              <span style={{ fontSize: '13px', color: avatarFile ? '#22c55e' : '#8892a4' }}>
                {avatarFile ? avatarFile.name : 'Tap to upload'}
              </span>
            </label>
            {error && <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '8px' }}>{error}</p>}
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button onClick={() => setStep(1)} className="btn-outline" style={{ flex: 1, justifyContent: 'center', padding: '10px' }}>Back</button>
              <button onClick={submitAvatar} disabled={busy} className="btn-primary" style={{ flex: 2, justifyContent: 'center', padding: '10px', opacity: busy ? 0.5 : 1 }}>
                {busy ? 'Uploading...' : avatarFile ? 'Next →' : 'Skip →'}
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#e2e4e9', marginBottom: '8px' }}>
              {hasVehicle ? 'You\'re all set!' : 'Add your first ride'}
            </h2>
            <p style={{ fontSize: '13px', color: '#8892a4', marginBottom: '18px' }}>
              {hasVehicle ? 'Welcome to The Scene. Start exploring.' : 'You can add more vehicles and mods later from your Garage.'}
            </p>
            {!hasVehicle && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="number" placeholder="Year" value={vehicle.year} onChange={(e) => setVehicle({ ...vehicle, year: e.target.value })} className="input" style={{ flex: 0.7 }} />
                  <input placeholder="Make" value={vehicle.make} onChange={(e) => setVehicle({ ...vehicle, make: e.target.value })} className="input" style={{ flex: 1 }} />
                  <input placeholder="Model" value={vehicle.model} onChange={(e) => setVehicle({ ...vehicle, model: e.target.value })} className="input" style={{ flex: 1 }} />
                </div>
                <input placeholder="Color (optional)" value={vehicle.color} onChange={(e) => setVehicle({ ...vehicle, color: e.target.value })} className="input" />
                <label style={{ display: 'block', padding: '16px', borderRadius: '8px', border: '2px dashed rgba(255,255,255,0.1)', textAlign: 'center', cursor: 'pointer', background: 'rgba(18,18,30,0.4)' }}>
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setVehicleFile(e.target.files?.[0] || null)} style={{ display: 'none' }} />
                  <span style={{ fontSize: '12px', color: vehicleFile ? '#22c55e' : '#8892a4' }}>
                    {vehicleFile ? vehicleFile.name : 'Cover photo (optional)'}
                  </span>
                </label>
              </div>
            )}
            {error && <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '8px' }}>{error}</p>}
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button onClick={() => setStep(2)} className="btn-outline" style={{ flex: 1, justifyContent: 'center', padding: '10px' }}>Back</button>
              <button onClick={submitVehicle} disabled={busy} className="btn-neon" style={{ flex: 2, justifyContent: 'center', padding: '10px', opacity: busy ? 0.5 : 1 }}>
                {busy ? 'Saving...' : hasVehicle ? 'Finish' : 'Add & Finish'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
