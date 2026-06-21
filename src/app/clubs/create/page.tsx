'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AddressAutocomplete from '@/components/AddressAutocomplete'
import { geocodeCityState, type ParsedAddress } from '@/lib/mapbox'
import { compressImage } from '@/lib/imageUpload'

export default function CreateClubPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    description: '',
    website: '',
    instagram_handle: '',
    facebook_url: '',
  })

  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)

  const [locations, setLocations] = useState([{ city: '', state: '', label: '', address: '', zip_code: '', lat: null as number | null, lng: null as number | null, is_primary: true }])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const updateLocation = (index: number, field: string, value: string) => {
    const updated = [...locations]
    updated[index] = { ...updated[index], [field]: value }
    setLocations(updated)
  }

  const applyAddress = (index: number, a: ParsedAddress) => {
    const updated = [...locations]
    updated[index] = {
      ...updated[index],
      address: a.street || a.formatted,
      city: a.city || updated[index].city,
      state: a.state || updated[index].state,
      zip_code: a.zip,
      lat: a.lat,
      lng: a.lng,
    }
    setLocations(updated)
  }

  const addLocation = () => {
    setLocations([...locations, { city: '', state: '', label: '', address: '', zip_code: '', lat: null, lng: null, is_primary: false }])
  }

  const removeLocation = (index: number) => {
    if (locations.length <= 1) return
    setLocations(locations.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('You must be signed in'); setLoading(false); return }

    if (!locations[0].city || !locations[0].state) { setError('Pick a city from the dropdown for the primary chapter'); setLoading(false); return }

    const slug = form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')

    // Create the club
    const { data: club, error: clubError } = await supabase.from('clubs').insert({
      name: form.name,
      slug: slug + '-' + Date.now().toString(36),
      description: form.description,
      website: form.website,
      instagram_handle: form.instagram_handle,
      facebook_url: form.facebook_url,
      created_by: user.id,
    }).select().single()

    if (clubError) { setError(clubError.message); setLoading(false); return }

    // Insert the founder row FIRST so subsequent RLS checks (which
    // expect the creator to be a founder) pass even on schemas that
    // haven't had migration 021 applied yet.
    const { error: memberErr } = await supabase.from('club_members').insert({
      club_id: club.id,
      user_id: user.id,
      role: 'founder',
      added_by: user.id,
    })
    if (memberErr) {
      setError(`Club created, but founder membership insert failed: ${memberErr.message}`)
      setLoading(false)
      return
    }

    // Upload optional logo + cover
    const uploadImage = async (file: File, kind: 'logo' | 'cover'): Promise<string | null> => {
      const compressed = await compressImage(file)
      const ext = compressed.name.split('.').pop()?.toLowerCase() || 'jpg'
      const filename = `clubs/${club.id}/${kind}_${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('posts').upload(filename, compressed, { upsert: true })
      if (upErr) return null
      const { data: urlData } = supabase.storage.from('posts').getPublicUrl(filename)
      return urlData.publicUrl
    }

    const updates: { logo_url?: string; cover_image_url?: string } = {}
    if (logoFile) { const u = await uploadImage(logoFile, 'logo'); if (u) updates.logo_url = u }
    if (coverFile) { const u = await uploadImage(coverFile, 'cover'); if (u) updates.cover_image_url = u }
    if (Object.keys(updates).length) {
      await supabase.from('clubs').update(updates).eq('id', club.id)
    }

    // Backfill lat/lng from city+state for any chapter where the user
    // didn't click an autocomplete suggestion.
    const filtered = locations.filter(l => l.city && l.state)
    const withCoords = await Promise.all(filtered.map(async (l) => {
      if (l.lat != null && l.lng != null) return l
      const coords = await geocodeCityState(l.city, l.state)
      return { ...l, lat: coords?.lat ?? null, lng: coords?.lng ?? null }
    }))

    const fullLocs = withCoords.map(l => ({
      club_id: club.id,
      city: l.city,
      state: l.state.toUpperCase(),
      label: l.label,
      address: l.address || null,
      zip_code: l.zip_code || null,
      lat: l.lat,
      lng: l.lng,
      is_primary: l.is_primary,
    }))

    if (fullLocs.length > 0) {
      const { error: locErr } = await supabase.from('club_locations').insert(fullLocs)
      if (locErr) {
        const minimalLocs = fullLocs.map(l => ({ club_id: l.club_id, city: l.city, state: l.state, label: l.label, is_primary: l.is_primary }))
        const { error: retryErr } = await supabase.from('club_locations').insert(minimalLocs)
        if (retryErr) { setError('Could not save chapter locations: ' + retryErr.message); setLoading(false); return }
        setError('Chapters saved, but lat/lng columns are missing — apply migration 013 for heatmap pins.')
      }
    }

    router.push(`/clubs/${club.slug}`)
  }

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '80px 16px 40px' }}>
      <Link href="/clubs" className="text-muted-light hover:text-teal" style={{ fontSize: '13px', display: 'block', marginBottom: '20px' }}>&larr; Back to Clubs</Link>

      <h1 className="text-3xl font-bold" style={{ marginBottom: '8px' }}>
        Start a <span className="gradient-text">Club</span>
      </h1>
      <p className="text-muted-light" style={{ fontSize: '0.9rem', marginBottom: '28px' }}>Create a car club and start building your community</p>

      <form onSubmit={handleSubmit} className="glass" style={{ padding: '28px' }}>
        <div style={{ marginBottom: '16px' }}>
          <label className="label-mono" style={{ display: 'block', marginBottom: '6px' }}>Club Name *</label>
          <input name="name" value={form.name} onChange={handleChange} className="input" placeholder='e.g. "Smooth Rides" or "DFW Corvette Club"' required />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label className="label-mono" style={{ display: 'block', marginBottom: '6px' }}>Description</label>
          <textarea name="description" value={form.description} onChange={handleChange} className="input" rows={3} placeholder="What's your club about?" />
        </div>

        {/* Banner + Logo — prominent, WYSIWYG preview of how the club header will look */}
        <div style={{ marginBottom: '20px' }}>
          <label className="label-mono" style={{ display: 'block', marginBottom: '8px' }}>Banner & Logo <span style={{ color: '#6b7280', fontWeight: 400, textTransform: 'none' }}>(optional — you can add them later)</span></label>
          <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
            {/* Banner area */}
            <label style={{ display: 'block', height: '160px', position: 'relative', cursor: 'pointer', background: coverFile ? 'transparent' : 'linear-gradient(135deg, rgba(45,212,191,0.1), rgba(139,92,246,0.1))' }}>
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} style={{ display: 'none' }} />
              {coverFile && <img src={URL.createObjectURL(coverFile)} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: coverFile ? 'rgba(0,0,0,0.35)' : 'transparent' }}>
                <span style={{ padding: '10px 22px', borderRadius: '8px', background: 'rgba(45,212,191,0.85)', border: '1px solid rgba(45,212,191,0.5)', color: '#0c0c14', fontSize: '13px', fontWeight: 700, boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}>
                  {coverFile ? 'Change Banner' : 'Upload Banner Image'}
                </span>
              </div>
            </label>

            {/* Logo overlay + name row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', background: 'rgba(18,18,30,0.6)' }}>
              <label style={{ position: 'relative', width: '56px', height: '56px', borderRadius: '50%', overflow: 'hidden', background: 'rgba(26,26,46,0.8)', border: '2px solid rgba(45,212,191,0.4)', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '-40px' }}>
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} style={{ display: 'none' }} />
                {logoFile ? (
                  <img src={URL.createObjectURL(logoFile)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#9ca3af', letterSpacing: '1px' }}>LOGO</span>
                )}
              </label>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '15px', fontWeight: 700, color: '#e2e4e9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {form.name || 'Your Club Name'}
                </p>
                <p style={{ fontSize: '11px', color: '#6b7280' }}>
                  {logoFile ? 'Logo selected' : 'Tap the circle to add a logo'}
                </p>
              </div>
            </div>
          </div>
          <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '6px' }}>JPEG, PNG, or WebP · recommended: 1600×600 banner, square logo</p>
        </div>

        {/* Locations */}
        <div style={{ marginBottom: '16px' }}>
          <label className="label-mono" style={{ display: 'block', marginBottom: '8px' }}>Chapters / Locations *</label>
          <p className="text-muted" style={{ fontSize: '11px', marginBottom: '10px' }}>Clubs can have multiple chapters. Add as many as you need.</p>
          {locations.map((loc, i) => (
            <div key={i} style={{ padding: '14px', marginBottom: '10px', borderRadius: '8px', background: 'rgba(18,18,30,0.3)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span className="label-mono" style={{ color: '#9ca3af' }}>Chapter {i + 1}{loc.is_primary && ' · Primary'}</span>
                {locations.length > 1 && (
                  <button type="button" onClick={() => removeLocation(i)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>Remove</button>
                )}
              </div>
              <div style={{ marginBottom: '8px' }}>
                <AddressAutocomplete
                  defaultValue={loc.city && loc.state ? `${loc.city}, ${loc.state}` : ''}
                  placeholder="Start typing a city — e.g. &quot;Scranton, PA&quot;"
                  mode="city"
                  onChange={(a) => applyAddress(i, a)}
                />
                {loc.city && loc.state && (
                  <p className="spec" style={{ fontSize: '11px', color: '#2dd4bf', marginTop: '6px' }}>
                    {loc.city}, {loc.state}{loc.zip_code ? ` ${loc.zip_code}` : ''}
                  </p>
                )}
              </div>
              <input value={loc.label} onChange={(e) => updateLocation(i, 'label', e.target.value)} className="input" placeholder="Chapter name (optional — e.g. &quot;DFW Chapter&quot;)" />
            </div>
          ))}
          <button type="button" onClick={addLocation} style={{ background: 'none', border: 'none', color: '#2dd4bf', fontSize: '13px', fontWeight: 600, cursor: 'pointer', padding: '4px 0', minHeight: '44px' }}>
            + Add another location
          </button>
        </div>

        {/* Social */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 200px), 1fr))', gap: '12px', marginBottom: '16px' }}>
          <div>
            <label className="label-mono" style={{ display: 'block', marginBottom: '6px' }}>Website</label>
            <input name="website" value={form.website} onChange={handleChange} className="input" placeholder="https://..." />
          </div>
          <div>
            <label className="label-mono" style={{ display: 'block', marginBottom: '6px' }}>Instagram</label>
            <input name="instagram_handle" value={form.instagram_handle} onChange={handleChange} className="input" placeholder="@handle" />
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#ef4444', fontSize: '13px' }}>{error}</div>
        )}

        <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px', opacity: loading ? 0.5 : 1 }}>
          {loading ? 'Creating club...' : 'Create Club'}
        </button>
      </form>
    </div>
  )
}
