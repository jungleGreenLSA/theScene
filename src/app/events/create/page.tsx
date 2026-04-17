'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AddressAutocomplete from '@/components/AddressAutocomplete'
import { geocodeCityState, type ParsedAddress } from '@/lib/mapbox'

interface Club {
  id: string
  name: string
}

export default function CreateEventPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [clubs, setClubs] = useState<Club[]>([])
  const [flyerFile, setFlyerFile] = useState<File | null>(null)
  const [canCreate, setCanCreate] = useState(true)
  const [eventCount, setEventCount] = useState(0)
  const [maxEvents, setMaxEvents] = useState(2)

  const [form, setForm] = useState({
    title: '',
    description: '',
    event_date: '',
    event_time: '',
    location_name: '',
    location_address: '',
    city: '',
    state: '',
    zip_code: '',
    lat: null as number | null,
    lng: null as number | null,
    admission_info: '',
    club_id: '',
    categories: [] as string[],
  })

  useEffect(() => {
    const loadClubs = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Check event limits
      const { data: profile } = await supabase.from('profiles').select('subscription_tier, role').eq('id', user.id).single()
      const isPremium = profile?.subscription_tier === 'premium' || profile?.role === 'admin'
      const limit = isPremium ? 10 : 2
      setMaxEvents(limit)

      const { count } = await supabase.from('events').select('id', { count: 'exact', head: true }).eq('organizer_id', user.id).in('status', ['published', 'active', 'draft'])
      setEventCount(count || 0)
      setCanCreate((count || 0) < limit)

      // Get clubs where user is admin or founder
      const { data } = await supabase
        .from('club_members')
        .select('club:clubs(id, name)')
        .eq('user_id', user.id)
        .in('role', ['admin', 'founder'])
      setClubs((data || []).map((d: any) => d.club).filter(Boolean))
    }
    loadClubs()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const toggleCategory = (cat: string) => {
    setForm({
      ...form,
      categories: form.categories.includes(cat)
        ? form.categories.filter(c => c !== cat)
        : [...form.categories, cat],
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('You must be signed in'); setLoading(false); return }

    if (!form.city || !form.state) { setError('City and State are required'); setLoading(false); return }

    const slug = `${form.title}-${form.city}-${form.state}`
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
      + '-' + Date.now().toString(36)

    let flyerUrl = ''
    if (flyerFile) {
      const allowed = ['image/jpeg', 'image/png', 'image/webp']
      if (!allowed.includes(flyerFile.type)) { setError('Flyer must be JPEG, PNG, or WebP'); setLoading(false); return }
      if (flyerFile.size > 5 * 1024 * 1024) { setError('Flyer must be under 5MB'); setLoading(false); return }

      const filename = `${user.id}/${Date.now()}_flyer.${flyerFile.name.split('.').pop()}`
      const { error: uploadError } = await supabase.storage.from('events').upload(filename, flyerFile)
      if (uploadError) { setError('Flyer upload failed'); setLoading(false); return }
      const { data: urlData } = supabase.storage.from('events').getPublicUrl(filename)
      flyerUrl = urlData.publicUrl
    }

    const eventDate = new Date(`${form.event_date}T${form.event_time || '12:00'}`)

    // Backfill coordinates if the user typed city/state without clicking
    // an autocomplete suggestion.
    let eventLat = form.lat
    let eventLng = form.lng
    if (eventLat == null || eventLng == null) {
      const coords = await geocodeCityState(form.city, form.state)
      if (coords) { eventLat = coords.lat; eventLng = coords.lng }
    }

    const { error: insertError } = await supabase.from('events').insert({
      organizer_id: user.id,
      title: form.title,
      slug,
      description: form.description,
      event_date: eventDate.toISOString(),
      location_name: form.location_name,
      location_address: form.location_address,
      city: form.city,
      state: form.state,
      zip_code: form.zip_code || null,
      lat: eventLat,
      lng: eventLng,
      admission_info: form.admission_info,
      club_id: form.club_id || null,
      categories: form.categories,
      flyer_url: flyerUrl || null,
      cover_image_url: flyerUrl || null,
      status: 'published',
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
    } else {
      router.push(`/events/${slug}`)
    }
  }

  const CATEGORIES = ['Car Show', 'Car Meet', 'Track Day', 'Cruise', 'Swap Meet', 'Drag Race', 'Autocross', 'Dyno Day', 'Charity Event']

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '80px 32px 40px' }}>
      <Link href="/events" className="text-muted-light hover:text-purple-light" style={{ fontSize: '13px', display: 'block', marginBottom: '20px' }}>&larr; Back to Events</Link>

      <h1 className="text-3xl font-bold" style={{ marginBottom: '8px' }}>
        Create an <span className="text-neon-light">Event</span>
      </h1>
      <p style={{ fontSize: '14px', color: '#8892a4', marginBottom: '12px' }}>List a car show, meet, track day, or cruise</p>
      <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '28px' }}>{eventCount} of {maxEvents} events used {maxEvents <= 2 && '· Upgrade to premium for up to 10'}</p>

      {!canCreate ? (
        <div className="glass" style={{ padding: '40px', textAlign: 'center' }}>
          <span style={{ fontSize: '40px', display: 'block', marginBottom: '12px' }}>📅</span>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#e2e4e9', marginBottom: '8px' }}>Event limit reached</h2>
          <p style={{ fontSize: '14px', color: '#8892a4', marginBottom: '20px' }}>Free members can create up to {maxEvents} events. Upgrade for more.</p>
          <Link href="/pricing" style={{ padding: '10px 24px', borderRadius: '8px', background: '#f97316', color: '#0c0c14', fontSize: '13px', fontWeight: 700 }}>Upgrade to Premium</Link>
        </div>
      ) : (
      <form onSubmit={handleSubmit} className="glass" style={{ padding: '28px' }}>
        {/* Title */}
        <div style={{ marginBottom: '16px' }}>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-light" style={{ display: 'block', marginBottom: '6px' }}>Event Title *</label>
          <input name="title" value={form.title} onChange={handleChange} className="input" placeholder='e.g. "Smooth Rides 2026 Car Show" or "Tom Smith&apos;s Annual Meet"' required />
        </div>

        {/* Club association (optional) */}
        {clubs.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-light" style={{ display: 'block', marginBottom: '6px' }}>Hosting as Club (optional)</label>
            <select name="club_id" value={form.club_id} onChange={handleChange} className="input">
              <option value="">Personal event (not a club)</option>
              {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <p className="text-muted" style={{ fontSize: '11px', marginTop: '4px' }}>If this event is hosted by your club, select it here</p>
          </div>
        )}

        {/* Date & Time */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-light" style={{ display: 'block', marginBottom: '6px' }}>Date *</label>
            <input type="date" name="event_date" value={form.event_date} onChange={handleChange} className="input" required />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-light" style={{ display: 'block', marginBottom: '6px' }}>Time</label>
            <input type="time" name="event_time" value={form.event_time} onChange={handleChange} className="input" />
          </div>
        </div>

        {/* Location */}
        <div style={{ marginBottom: '16px' }}>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-light" style={{ display: 'block', marginBottom: '6px' }}>Venue Name</label>
          <input name="location_name" value={form.location_name} onChange={handleChange} className="input" placeholder="e.g. Dallas Convention Center" />
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-light" style={{ display: 'block', marginBottom: '6px' }}>Address <span style={{ color: '#6b7280', fontWeight: 400, textTransform: 'none' }}>(start typing — we&apos;ll fill in the rest)</span></label>
          <AddressAutocomplete
            defaultValue={form.location_address}
            placeholder="Start typing a venue address..."
            onChange={(a: ParsedAddress) => setForm(f => ({
              ...f,
              location_address: a.street || a.formatted,
              city: a.city,
              state: a.state,
              zip_code: a.zip,
              lat: a.lat,
              lng: a.lng,
            }))}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-light" style={{ display: 'block', marginBottom: '6px' }}>City *</label>
            <input name="city" value={form.city} onChange={handleChange} className="input" placeholder="Dallas" required />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-light" style={{ display: 'block', marginBottom: '6px' }}>State *</label>
            <input name="state" value={form.state} onChange={handleChange} className="input" placeholder="TX" required maxLength={2} style={{ textTransform: 'uppercase' }} />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-light" style={{ display: 'block', marginBottom: '6px' }}>ZIP</label>
            <input name="zip_code" value={form.zip_code} onChange={handleChange} className="input" placeholder="75201" maxLength={10} />
          </div>
        </div>

        {/* Description */}
        <div style={{ marginBottom: '16px' }}>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-light" style={{ display: 'block', marginBottom: '6px' }}>Description</label>
          <textarea name="description" value={form.description} onChange={handleChange} className="input" rows={4} placeholder="Tell people about the event..." />
        </div>

        {/* Admission */}
        <div style={{ marginBottom: '16px' }}>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-light" style={{ display: 'block', marginBottom: '6px' }}>Admission Info</label>
          <input name="admission_info" value={form.admission_info} onChange={handleChange} className="input" placeholder='e.g. "Free entry" or "$20 per car"' />
        </div>

        {/* Categories */}
        <div style={{ marginBottom: '16px' }}>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-light" style={{ display: 'block', marginBottom: '8px' }}>Categories</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCategory(cat)}
                style={{
                  padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.2s',
                  background: form.categories.includes(cat) ? 'rgba(124,58,237,0.2)' : 'rgba(18,18,30,0.5)',
                  color: form.categories.includes(cat) ? '#a78bfa' : '#6b7280',
                  outline: form.categories.includes(cat) ? '1px solid rgba(124,58,237,0.3)' : '1px solid rgba(255,255,255,0.06)',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Flyer upload */}
        <div style={{ marginBottom: '20px' }}>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-light" style={{ display: 'block', marginBottom: '6px' }}>Event Flyer (optional)</label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setFlyerFile(e.target.files?.[0] || null)}
            className="input"
            style={{ fontSize: '13px' }}
          />
          <p className="text-muted" style={{ fontSize: '11px', marginTop: '4px' }}>Upload your car show flyer (JPEG, PNG, or WebP, max 5MB)</p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#ef4444', fontSize: '13px' }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-neon" style={{ width: '100%', justifyContent: 'center', padding: '14px', opacity: loading ? 0.5 : 1 }}>
          {loading ? 'Creating event...' : '📅 Publish Event'}
        </button>
      </form>
      )}
    </div>
  )
}
