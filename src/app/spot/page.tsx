'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import PropsButton from '@/components/PropsButton'
import ClaimSightingButton from '@/components/ClaimSightingButton'
import { compressImage } from '@/lib/imageUpload'

interface Sighting {
  id: string
  spotter_id: string
  image_url: string
  location_name: string
  city: string
  state: string
  description: string
  instagram_handle: string | null
  props_count: number
  created_at: string
  spotter: { username: string; display_name: string; avatar_url: string }
  claimed_vehicle_id: string | null
}

export default function SpotPage() {
  const supabase = createClient()
  const [sightings, setSightings] = useState<Sighting[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({ location_name: '', city: '', state: '', description: '', instagram_handle: '' })
  const [file, setFile] = useState<File | null>(null)
  const [message, setMessage] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)
      const { data } = await supabase
        .from('sightings')
        .select('*, spotter:profiles!sightings_spotter_id_fkey(username, display_name, avatar_url)')
        .order('created_at', { ascending: false })
        .limit(30)
      setSightings((data || []) as unknown as Sighting[])
      setLoading(false)
    }
    fetch()
  }, [])

  const handleDeleteSighting = async (id: string) => {
    if (!window.confirm('Delete this sighting?')) return
    const { error } = await supabase.from('sightings').delete().eq('id', id)
    if (error) { setMessage('Delete failed: ' + error.message); setTimeout(() => setMessage(''), 4000); return }
    setSightings(sightings.filter(s => s.id !== id))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return
    setUploading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/auth/login'; return }

    const filename = `sightings/${user.id}/${Date.now()}.${file.name.split('.').pop()}`
    const { error: uploadError } = await supabase.storage.from('posts').upload(filename, await compressImage(file))
    if (uploadError) {
      setMessage(`Upload failed: ${uploadError.message}`)
      setUploading(false)
      setTimeout(() => setMessage(''), 5000)
      return
    }
    const { data: urlData } = supabase.storage.from('posts').getPublicUrl(filename)

    const { error: insertError } = await supabase.from('sightings').insert({
      spotter_id: user.id,
      image_url: urlData.publicUrl,
      location_name: form.location_name,
      city: form.city,
      state: form.state.toUpperCase(),
      description: form.description,
      instagram_handle: form.instagram_handle ? form.instagram_handle.replace(/^@/, '').trim() : null,
    })
    if (insertError) {
      setMessage(`Post failed: ${insertError.message}`)
      setUploading(false)
      setTimeout(() => setMessage(''), 5000)
      return
    }

    setMessage('Sighting posted! If the owner is on The Scene, they\'ll get notified.')
    setShowForm(false)
    setForm({ location_name: '', city: '', state: '', description: '', instagram_handle: '' })
    setFile(null)
    setUploading(false)
    setTimeout(() => setMessage(''), 4000)

    // Refresh
    const { data } = await supabase.from('sightings').select('*, spotter:profiles!sightings_spotter_id_fkey(username, display_name, avatar_url)').order('created_at', { ascending: false }).limit(30)
    setSightings((data || []) as unknown as Sighting[])
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '80px 32px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="text-3xl font-bold">Spot a <span className="text-neon-light">Ride</span></h1>
          <p className="text-muted-light" style={{ marginTop: '4px', fontSize: '0.85rem' }}>See a cool car? Snap it. Share it. The owner might be on The Scene.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-neon" style={{ fontSize: '12px' }}>
          {showForm ? 'Cancel' : 'Spot a Ride'}
        </button>
      </div>

      {message && (
        <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#22c55e', fontSize: '13px' }}>{message}</div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="glass" style={{ padding: '24px', marginBottom: '20px' }}>
          <h3 className="font-bold text-foreground" style={{ marginBottom: '16px' }}>Post a Sighting</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <input value={form.location_name} onChange={(e) => setForm({ ...form, location_name: e.target.value })} className="input" placeholder="Where? (e.g. Starbucks on Elm St)" required />
            <div style={{ display: 'flex', gap: '8px' }}>
              <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="input" placeholder="City" required style={{ flex: 2 }} />
              <input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="input" placeholder="ST" required style={{ flex: 0.6, textTransform: 'uppercase' }} maxLength={2} />
            </div>
          </div>
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input" placeholder="What did you spot? (e.g. Jungle Green Chevy SS, heavily modified)" style={{ marginBottom: '12px' }} />
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ padding: '0 10px', color: '#555555', fontSize: '13px' }}>@</span>
            <input
              value={form.instagram_handle}
              onChange={(e) => setForm({ ...form, instagram_handle: e.target.value.replace(/^@/, '').trim() })}
              className="input"
              placeholder="IG handle if you saw one on the car (sticker, plate frame)"
              style={{ flex: 1 }}
              maxLength={30}
            />
          </div>
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setFile(e.target.files?.[0] || null)} className="input" style={{ marginBottom: '12px', fontSize: '13px' }} required />
          <button type="submit" disabled={uploading} className="btn-neon" style={{ opacity: uploading ? 0.5 : 1, fontSize: '12px' }}>
            {uploading ? 'Posting...' : 'Post Sighting'}
          </button>
        </form>
      )}

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {[1,2,3].map(i => <div key={i} className="glass animate-pulse" style={{ height: '300px' }} />)}
        </div>
      ) : sightings.length === 0 ? (
        <div className="glass" style={{ padding: '48px 32px', textAlign: 'center' }}>
          <h2 className="text-xl font-bold" style={{ marginBottom: '8px' }}>No sightings yet</h2>
          <p className="text-muted-light" style={{ fontSize: '0.9rem' }}>Be the first to spot a cool ride in the wild!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {sightings.map((s) => (
            <div key={s.id} className="glass overflow-hidden card-hover">
              <div style={{ aspectRatio: '2 / 1', background: '#e4e4e4', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                <img
                  src={s.image_url}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    const img = e.currentTarget
                    img.style.display = 'none'
                    const parent = img.parentElement
                    if (parent && !parent.querySelector('.img-fallback')) {
                      const fb = document.createElement('div')
                      fb.className = 'img-fallback'
                      fb.style.cssText = 'color:#555555;font-size:36px'
                      fb.textContent = ''
                      parent.appendChild(fb)
                    }
                  }}
                />
              </div>
              <div style={{ padding: '16px' }}>
                {s.description && <p className="text-foreground" style={{ fontSize: '14px', marginBottom: '8px' }}>{s.description}</p>}
                <p className="text-muted-light" style={{ fontSize: '12px' }}>{s.location_name}{s.city && `, ${s.city}`}{s.state && `, ${s.state}`}</p>
                {s.instagram_handle && (
                  <a href={`https://instagram.com/${s.instagram_handle}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: '6px', fontSize: '12px', color: '#5fa8dd' }}>
                    @{s.instagram_handle} on IG
                  </a>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #e4e4e4' }}>
                  <PropsButton targetType="sighting" targetId={s.id} initialCount={s.props_count || 0} size="sm" />
                  <Link href={`/user/${s.spotter?.username}`} className="text-muted" style={{ fontSize: '12px' }}>by @{s.spotter?.username}</Link>
                </div>
                <div style={{ marginTop: '8px' }}>
                  <ClaimSightingButton sightingId={s.id} spotterId={s.spotter_id} alreadyClaimed={!!s.claimed_vehicle_id} onClaimed={() => setSightings(sightings.map(x => x.id === s.id ? { ...x, claimed_vehicle_id: 'claimed' } as any : x))} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                  <span className="text-muted" style={{ fontSize: '11px' }}>{new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  {currentUserId === s.spotter_id && (
                    <button onClick={() => handleDeleteSighting(s.id)} className="btn-danger-sm">Delete</button>
                  )}
                </div>
                {s.claimed_vehicle_id && (
                  <div style={{ marginTop: '8px', padding: '6px 10px', borderRadius: '6px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                    <span style={{ fontSize: '11px', color: '#22c55e', fontWeight: 600 }}>Owner claimed this sighting!</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
