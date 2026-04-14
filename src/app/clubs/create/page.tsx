'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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

  const [locations, setLocations] = useState([{ city: '', state: '', label: '', is_primary: true }])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const updateLocation = (index: number, field: string, value: string) => {
    const updated = [...locations]
    updated[index] = { ...updated[index], [field]: value }
    setLocations(updated)
  }

  const addLocation = () => {
    setLocations([...locations, { city: '', state: '', label: '', is_primary: false }])
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

    if (!locations[0].city || !locations[0].state) { setError('At least one location is required'); setLoading(false); return }

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

    // Add locations
    const locs = locations.filter(l => l.city && l.state).map(l => ({
      club_id: club.id,
      city: l.city,
      state: l.state.toUpperCase(),
      label: l.label,
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
            <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
              <input value={loc.city} onChange={(e) => updateLocation(i, 'city', e.target.value)} className="input" placeholder="City" style={{ flex: 2 }} required={i === 0} />
              <input value={loc.state} onChange={(e) => updateLocation(i, 'state', e.target.value)} className="input" placeholder="ST" style={{ flex: 0.7, textTransform: 'uppercase' }} maxLength={2} required={i === 0} />
              <input value={loc.label} onChange={(e) => updateLocation(i, 'label', e.target.value)} className="input" placeholder="Chapter name (optional)" style={{ flex: 2 }} />
              {locations.length > 1 && (
                <button type="button" onClick={() => removeLocation(i)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px', padding: '4px' }}>✕</button>
              )}
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
