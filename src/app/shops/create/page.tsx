'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AddressAutocomplete from '@/components/AddressAutocomplete'
import { geocodeCityState, type ParsedAddress } from '@/lib/mapbox'

const SPECIALTY_OPTIONS = ['Performance', 'Tune', 'Dyno', 'Engine Build', 'Body & Paint', 'Wheels & Tires', 'Detail', 'Suspension', 'Fabrication', 'Exhaust', 'Wrap', 'Audio', 'Custom']

export default function CreateShopPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '', description: '', website: '', instagram_handle: '', phone: '',
    address: '', city: '', state: '', zip_code: '',
    lat: null as number | null, lng: null as number | null,
    specialties: [] as string[],
  })

  const toggleSpecialty = (s: string) => {
    setForm(f => ({ ...f, specialties: f.specialties.includes(s) ? f.specialties.filter(x => x !== s) : [...f.specialties, s] }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('You must be signed in'); setLoading(false); return }
    if (!form.city || !form.state) { setError('City and state are required'); setLoading(false); return }

    const slug = form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36)

    // Backfill coordinates if the user typed city/state without clicking
    // an autocomplete suggestion.
    let shopLat = form.lat
    let shopLng = form.lng
    if (shopLat == null || shopLng == null) {
      const coords = await geocodeCityState(form.city, form.state)
      if (coords) { shopLat = coords.lat; shopLng = coords.lng }
    }

    const { data: shop, error: insertError } = await supabase.from('shops').insert({
      slug,
      name: form.name,
      description: form.description || null,
      website: form.website || null,
      instagram_handle: form.instagram_handle ? form.instagram_handle.replace(/^@/, '') : null,
      phone: form.phone || null,
      address: form.address || null,
      city: form.city,
      state: form.state.toUpperCase(),
      zip_code: form.zip_code || null,
      lat: shopLat,
      lng: shopLng,
      specialties: form.specialties,
      created_by: user.id,
    }).select().single()

    if (insertError) { setError(insertError.message); setLoading(false); return }
    router.push(`/shops/${shop.slug}`)
  }

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '80px 32px 40px' }}>
      <Link href="/shops" style={{ fontSize: '13px', color: '#666666', display: 'block', marginBottom: '20px' }}>&larr; Back to Shops</Link>

      <h1 className="text-3xl font-bold" style={{ marginBottom: '8px' }}>Add a <span style={{ color: '#22c55e' }}>Shop</span></h1>
      <p className="text-muted-light" style={{ fontSize: '0.9rem', marginBottom: '28px' }}>List a shop so other members can tag it on their builds.</p>

      <form onSubmit={handleSubmit} className="glass" style={{ padding: '28px' }}>
        <div style={{ marginBottom: '16px' }}>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-light" style={{ display: 'block', marginBottom: '6px' }}>Shop Name *</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" placeholder='e.g. "Dallas Performance"' required maxLength={120} />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-light" style={{ display: 'block', marginBottom: '6px' }}>Description</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input" rows={3} placeholder="What does this shop do? What are they known for?" />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-light" style={{ display: 'block', marginBottom: '6px' }}>Address <span style={{ color: '#555555', fontWeight: 400, textTransform: 'none' }}>(autocomplete via Google Maps)</span></label>
          <AddressAutocomplete
            placeholder="Start typing the shop's address..."
            onChange={(a: ParsedAddress) => setForm(f => ({
              ...f,
              address: a.street || a.formatted,
              city: a.city || f.city,
              state: a.state || f.state,
              zip_code: a.zip,
              lat: a.lat,
              lng: a.lng,
            }))}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-light" style={{ display: 'block', marginBottom: '6px' }}>City *</label>
            <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="input" placeholder="Dallas" required />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-light" style={{ display: 'block', marginBottom: '6px' }}>State *</label>
            <input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="input" placeholder="TX" required maxLength={2} style={{ textTransform: 'uppercase' }} />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-light" style={{ display: 'block', marginBottom: '6px' }}>ZIP</label>
            <input value={form.zip_code} onChange={(e) => setForm({ ...form, zip_code: e.target.value })} className="input" placeholder="75201" maxLength={10} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-light" style={{ display: 'block', marginBottom: '6px' }}>Website</label>
            <input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="input" placeholder="https://..." />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-light" style={{ display: 'block', marginBottom: '6px' }}>Instagram</label>
            <input value={form.instagram_handle} onChange={(e) => setForm({ ...form, instagram_handle: e.target.value })} className="input" placeholder="@handle" />
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-light" style={{ display: 'block', marginBottom: '6px' }}>Phone</label>
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input" placeholder="(555) 555-5555" />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-light" style={{ display: 'block', marginBottom: '8px' }}>Specialties</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {SPECIALTY_OPTIONS.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => toggleSpecialty(s)}
                style={{
                  padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: 'none',
                  background: form.specialties.includes(s) ? 'rgba(34,197,94,0.2)' : '#f0f0f0',
                  color: form.specialties.includes(s) ? '#22c55e' : '#555555',
                  outline: form.specialties.includes(s) ? '1px solid rgba(34,197,94,0.3)' : '1px solid #e4e4e4',
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#ef4444', fontSize: '13px' }}>{error}</div>
        )}

        <button type="submit" disabled={loading} className="btn-neon" style={{ width: '100%', justifyContent: 'center', padding: '14px', opacity: loading ? 0.5 : 1 }}>
          {loading ? 'Creating shop...' : 'Add Shop'}
        </button>
      </form>
    </div>
  )
}
