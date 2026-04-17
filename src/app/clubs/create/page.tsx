'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AddressAutocomplete from '@/components/AddressAutocomplete'
import { geocodeCityState, type ParsedAddress } from '@/lib/mapbox'

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

    // Backfill lat/lng from city+state for any chapter where the user
    // didn't click an autocomplete suggestion.
    const filtered = locations.filter(l => l.city && l.state)
    const withCoords = await Promise.all(filtered.map(async (l) => {
      if (l.lat != null && l.lng != null) return l
      const coords = await geocodeCityState(l.city, l.state)
      return { ...l, lat: coords?.lat ?? null, lng: coords?.lng ?? null }
    }))

    const locs = withCoords.map(l => ({
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
    if (locs.length > 0) {
      await supabase.from('club_locations').insert(locs)
    }

    // Add creator as founder
    await supabase.from('club_members').insert({
      club_id: club.id,
      user_id: user.id,
      role: 'founder',
      added_by: user.id,
    })

    router.push(`/clubs/${club.slug}`)
  }

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '80px 32px 40px' }}>
      <Link href="/clubs" className="text-muted-light hover:text-purple-light" style={{ fontSize: '13px', display: 'block', marginBottom: '20px' }}>&larr; Back to Clubs</Link>

      <h1 className="text-3xl font-bold" style={{ marginBottom: '8px' }}>
        Start a <span className="text-purple-light">Club</span>
      </h1>
      <p className="text-muted-light" style={{ fontSize: '0.9rem', marginBottom: '28px' }}>Create a car club and start building your community</p>

      <form onSubmit={handleSubmit} className="glass" style={{ padding: '28px' }}>
        <div style={{ marginBottom: '16px' }}>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-light" style={{ display: 'block', marginBottom: '6px' }}>Club Name *</label>
          <input name="name" value={form.name} onChange={handleChange} className="input" placeholder='e.g. "Smooth Rides" or "DFW Corvette Club"' required />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-light" style={{ display: 'block', marginBottom: '6px' }}>Description</label>
          <textarea name="description" value={form.description} onChange={handleChange} className="input" rows={3} placeholder="What's your club about?" />
        </div>

        {/* Locations */}
        <div style={{ marginBottom: '16px' }}>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-light" style={{ display: 'block', marginBottom: '8px' }}>Chapters / Locations *</label>
          <p className="text-muted" style={{ fontSize: '11px', marginBottom: '10px' }}>Clubs can have multiple chapters. Add as many as you need.</p>
          {locations.map((loc, i) => (
            <div key={i} style={{ padding: '14px', marginBottom: '10px', borderRadius: '8px', background: 'rgba(18,18,30,0.3)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Chapter {i + 1}{loc.is_primary && ' · Primary'}</span>
                {locations.length > 1 && (
                  <button type="button" onClick={() => removeLocation(i)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>✕ Remove</button>
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
                  <p style={{ fontSize: '11px', color: '#22c55e', marginTop: '6px' }}>
                    ✓ {loc.city}, {loc.state}{loc.zip_code ? ` ${loc.zip_code}` : ''}
                  </p>
                )}
              </div>
              <input value={loc.label} onChange={(e) => updateLocation(i, 'label', e.target.value)} className="input" placeholder="Chapter name (optional — e.g. &quot;DFW Chapter&quot;)" />
            </div>
          ))}
          <button type="button" onClick={addLocation} style={{ background: 'none', border: 'none', color: '#a78bfa', fontSize: '13px', fontWeight: 600, cursor: 'pointer', padding: '4px 0' }}>
            + Add another location
          </button>
        </div>

        {/* Social */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-light" style={{ display: 'block', marginBottom: '6px' }}>Website</label>
            <input name="website" value={form.website} onChange={handleChange} className="input" placeholder="https://..." />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-light" style={{ display: 'block', marginBottom: '6px' }}>Instagram</label>
            <input name="instagram_handle" value={form.instagram_handle} onChange={handleChange} className="input" placeholder="@handle" />
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#ef4444', fontSize: '13px' }}>{error}</div>
        )}

        <button type="submit" disabled={loading} className="btn-neon" style={{ width: '100%', justifyContent: 'center', padding: '14px', opacity: loading ? 0.5 : 1 }}>
          {loading ? 'Creating club...' : '🏁 Create Club'}
        </button>
      </form>
    </div>
  )
}
