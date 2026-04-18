'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import AddressAutocomplete from '@/components/AddressAutocomplete'
import { geocodeCityState } from '@/lib/mapbox'

const CATEGORIES = ['Car Show', 'Car Meet', 'Track Day', 'Cruise', 'Swap Meet', 'Drag Race', 'Autocross', 'Dyno Day', 'Charity Event']

export default function EditEventPage() {
  const supabase = createClient()
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [eventId, setEventId] = useState('')
  const [cochairUsername, setCochairUsername] = useState('')
  const [cochairs, setCochairs] = useState<any[]>([])

  const [form, setForm] = useState({
    title: '', description: '', event_date: '', event_time: '',
    location_name: '', location_address: '', city: '', state: '',
    lat: null as number | null, lng: null as number | null,
    admission_info: '', categories: [] as string[],
  })

  useEffect(() => {
    const load = async () => {
      const { data: event } = await supabase.from('events').select('*').eq('slug', slug).single()
      if (!event) return
      setEventId(event.id)
      const d = new Date(event.event_date)
      setForm({
        title: event.title || '', description: event.description || '',
        event_date: d.toISOString().split('T')[0],
        event_time: d.toTimeString().slice(0, 5),
        location_name: event.location_name || '', location_address: event.location_address || '',
        city: event.city || '', state: event.state || '',
        lat: event.lat ?? null, lng: event.lng ?? null,
        admission_info: event.admission_info || '',
        categories: event.categories || [],
      })

      const { data: cc } = await supabase.from('event_cochairs')
        .select('id, user:profiles!event_cochairs_user_id_fkey(username, display_name)')
        .eq('event_id', event.id)
      setCochairs(cc || [])
      setLoading(false)
    }
    load()
  }, [slug])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const toggleCategory = (cat: string) => {
    setForm({ ...form, categories: form.categories.includes(cat) ? form.categories.filter(c => c !== cat) : [...form.categories, cat] })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    const eventDate = new Date(`${form.event_date}T${form.event_time || '12:00'}`)

    // Backfill lat/lng from city+state if the user typed a city without picking
    // from the autocomplete (preserves existing coords if already set).
    let { lat, lng } = form
    if ((lat == null || lng == null) && form.city && form.state) {
      const coords = await geocodeCityState(form.city, form.state)
      if (coords) { lat = coords.lat; lng = coords.lng }
    }

    const { error: updateErr } = await supabase.from('events').update({
      title: form.title, description: form.description,
      event_date: eventDate.toISOString(),
      location_name: form.location_name, location_address: form.location_address,
      city: form.city, state: form.state,
      lat, lng,
      admission_info: form.admission_info, categories: form.categories,
      updated_at: new Date().toISOString(),
    }).eq('id', eventId)

    if (updateErr) setError(updateErr.message)
    else {
      setForm(f => ({ ...f, lat, lng }))
      setMessage('Event updated!')
      setTimeout(() => setMessage(''), 3000)
    }
    setSaving(false)
  }

  const handleAddCochair = async () => {
    if (!cochairUsername.trim()) return
    const { data: profile } = await supabase.from('profiles').select('id, username, display_name').eq('username', cochairUsername.toLowerCase().trim()).single()
    if (!profile) { setError('User not found'); setTimeout(() => setError(''), 3000); return }

    const { data: { user } } = await supabase.auth.getUser()
    const { error: err } = await supabase.from('event_cochairs').insert({
      event_id: eventId, user_id: profile.id, added_by: user?.id,
    })
    if (err) { setError(err.message) }
    else {
      setCochairs([...cochairs, { id: Date.now(), user: { username: profile.username, display_name: profile.display_name } }])
      setCochairUsername('')
      setMessage(`Added @${profile.username} as co-chair!`)
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const handleRemoveCochair = async (cochairId: string) => {
    await supabase.from('event_cochairs').delete().eq('id', cochairId)
    setCochairs(cochairs.filter(c => c.id !== cochairId))
  }

  const labelStyle = { display: 'block' as const, fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '1.5px', color: '#666666', marginBottom: '6px' }

  if (loading) return <div style={{ maxWidth: '640px', margin: '0 auto', padding: '80px 32px', textAlign: 'center', color: '#666666' }}>Loading...</div>

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '80px 32px 40px' }}>
      <Link href={`/events/${slug}`} style={{ fontSize: '13px', color: '#666666', display: 'block', marginBottom: '20px' }}>&larr; Back to Event</Link>

      <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1a1a1a', marginBottom: '28px' }}>
        Edit <span style={{ color: '#90caf9' }}>Event</span>
      </h1>

      {message && <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', marginBottom: '16px', fontSize: '13px', color: '#22c55e' }}>{message}</div>}
      {error && <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', marginBottom: '16px', fontSize: '13px', color: '#ef4444' }}>{error}</div>}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="glass" style={{ padding: '24px' }}>
          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle}>Title</label>
            <input name="title" value={form.title} onChange={handleChange} className="input" required maxLength={128} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div><label style={labelStyle}>Date</label><input type="date" name="event_date" value={form.event_date} onChange={handleChange} className="input" required /></div>
            <div><label style={labelStyle}>Time</label><input type="time" name="event_time" value={form.event_time} onChange={handleChange} className="input" /></div>
          </div>
          <div style={{ marginBottom: '12px' }}><label style={labelStyle}>Venue</label><input name="location_name" value={form.location_name} onChange={handleChange} className="input" maxLength={128} /></div>
          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle}>City / State — pick from dropdown to drop a pin on the heatmap</label>
            <AddressAutocomplete
              defaultValue={form.city && form.state ? `${form.city}, ${form.state}` : ''}
              placeholder="Start typing a city..."
              mode="city"
              onChange={(a) => setForm(f => ({
                ...f,
                city: a.city || f.city,
                state: (a.state || f.state).toUpperCase(),
                lat: a.lat ?? f.lat,
                lng: a.lng ?? f.lng,
              }))}
            />
            {form.city && form.state && (
              <p style={{ fontSize: '11px', color: form.lat && form.lng ? '#22c55e' : '#90caf9', marginTop: '6px' }}>
                {form.city}, {form.state}{form.lat && form.lng ? ' · geocoded ✓' : ' · geocoding on save'}
              </p>
            )}
          </div>
          <div style={{ marginBottom: '12px' }}><label style={labelStyle}>Address (optional)</label><input name="location_address" value={form.location_address} onChange={handleChange} className="input" maxLength={128} /></div>
          <div style={{ marginBottom: '12px' }}><label style={labelStyle}>Description</label><textarea name="description" value={form.description} onChange={handleChange} className="input" rows={4} maxLength={2000} /></div>
          <div style={{ marginBottom: '12px' }}><label style={labelStyle}>Admission</label><input name="admission_info" value={form.admission_info} onChange={handleChange} className="input" maxLength={128} /></div>
          <div>
            <label style={labelStyle}>Categories</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {CATEGORIES.map(cat => (
                <button key={cat} type="button" onClick={() => toggleCategory(cat)} style={{
                  padding: '5px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', border: 'none',
                  background: form.categories.includes(cat) ? 'rgba(44, 121, 196, 0.2)' : '#f0f0f0',
                  color: form.categories.includes(cat) ? '#5fa8dd' : '#555555',
                  outline: form.categories.includes(cat) ? '1px solid rgba(44, 121, 196, 0.3)' : '1px solid #e4e4e4',
                }}>{cat}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Co-chairs */}
        <div className="glass" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1a1a1a', marginBottom: '12px' }}>Co-Chairs</h3>
          <p style={{ fontSize: '12px', color: '#555555', marginBottom: '12px' }}>Co-chairs can also manage this event.</p>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <input value={cochairUsername} onChange={(e) => setCochairUsername(e.target.value)} className="input" placeholder="Enter username" maxLength={64} style={{ flex: 1 }} />
            <button type="button" onClick={handleAddCochair} style={{ padding: '10px 16px', borderRadius: '8px', background: '#2c79c4', border: '1px solid #5fa8dd', color: 'white', fontSize: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>Add</button>
          </div>

          {cochairs.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {cochairs.map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '6px', background: '#f0f0f0', border: '1px solid #e4e4e4' }}>
                  <span style={{ fontSize: '13px', color: '#1a1a1a' }}>@{c.user?.username || 'unknown'} <span style={{ color: '#555555' }}>({c.user?.display_name || ''})</span></span>
                  <button type="button" onClick={() => handleRemoveCochair(c.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>Remove</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button type="submit" disabled={saving} style={{
          width: '100%', padding: '16px', borderRadius: '12px',
          background: '#5fa8dd', border: '1px solid #90caf9', color: '#0c0c14',
          fontSize: '15px', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.5 : 1,
        }}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}
