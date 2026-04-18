'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { compressImage } from '@/lib/imageUpload'

interface Vehicle { id: string; year: number; make: string; model: string; color: string }
interface CheckIn { id: string; note: string; image_url: string; created_at: string; user: { username: string; display_name: string; avatar_url: string }; vehicle: { year: number; make: string; model: string; color: string } | null }

export default function EventCheckIn({ eventId, eventTitle }: { eventId: string; eventTitle: string }) {
  const supabase = createClient()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [checkins, setCheckins] = useState<CheckIn[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState('')
  const [note, setNote] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [alreadyCheckedIn, setAlreadyCheckedIn] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setLoggedIn(true)

      const { data: v } = await supabase.from('vehicles').select('id, year, make, model, color').eq('owner_id', user.id)
      setVehicles(v || [])
      if (v && v.length > 0) setSelectedVehicle(v[0].id)

      const { data: existing } = await supabase.from('event_checkins').select('id').eq('event_id', eventId).eq('user_id', user.id).single()
      if (existing) setAlreadyCheckedIn(true)

      const { data: ckins } = await supabase
        .from('event_checkins')
        .select('*, user:profiles!event_checkins_user_id_fkey(username, display_name, avatar_url), vehicle:vehicles!event_checkins_vehicle_id_fkey(year, make, model, color)')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })
        .limit(20)
      setCheckins((ckins || []) as unknown as CheckIn[])
    }
    load()
  }, [eventId])

  const handleCheckIn = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setLoading(true)

    let imageUrl = ''
    if (file) {
      const compressed = await compressImage(file)
      const filename = `event_checkins/${user.id}/${Date.now()}.${compressed.name.split('.').pop()}`
      const { error: upErr } = await supabase.storage.from('posts').upload(filename, compressed)
      if (upErr) { alert('Check-in photo upload failed: ' + upErr.message); setLoading(false); return }
      const { data } = supabase.storage.from('posts').getPublicUrl(filename)
      imageUrl = data.publicUrl
    }

    await supabase.from('event_checkins').insert({
      event_id: eventId,
      user_id: user.id,
      vehicle_id: selectedVehicle || null,
      note: note.trim(),
      image_url: imageUrl || null,
    })

    setAlreadyCheckedIn(true)
    setLoading(false)
    window.location.reload()
  }

  return (
    <div style={{ marginBottom: '20px' }}>
      <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#e2e4e9', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        📍 Check-Ins
        <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 400 }}>{checkins.length} member{checkins.length !== 1 ? 's' : ''} checked in</span>
      </h2>

      {/* Check-in form */}
      {loggedIn && !alreadyCheckedIn && (
        <div className="glass" style={{ padding: '20px', marginBottom: '16px', border: '1px solid rgba(34,197,94,0.15)' }}>
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#e2e4e9', marginBottom: '12px' }}>🏁 I&apos;m at {eventTitle}!</p>
          {vehicles.length > 1 && (
            <div style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: '#8892a4', display: 'block', marginBottom: '4px' }}>Which ride did you bring?</label>
              <select value={selectedVehicle} onChange={(e) => setSelectedVehicle(e.target.value)} className="input">
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.year} {v.make} {v.model} — {v.color}</option>)}
              </select>
            </div>
          )}
          <input value={note} onChange={(e) => setNote(e.target.value)} className="input" placeholder="How's the show? (optional)" maxLength={280} style={{ marginBottom: '10px' }} />
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setFile(e.target.files?.[0] || null)} className="input" style={{ fontSize: '12px', flex: 1 }} />
            <button onClick={handleCheckIn} disabled={loading} style={{ padding: '10px 20px', borderRadius: '8px', background: '#22c55e', border: 'none', color: 'white', fontSize: '13px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', opacity: loading ? 0.5 : 1 }}>
              {loading ? 'Checking in...' : '📍 Check In'}
            </button>
          </div>
        </div>
      )}

      {alreadyCheckedIn && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', marginBottom: '16px', fontSize: '13px', color: '#22c55e', fontWeight: 600 }}>
          ✅ You&apos;re checked in at this event!
        </div>
      )}

      {/* Check-in feed */}
      {checkins.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {checkins.map(c => (
            <div key={c.id} className="glass" style={{ padding: '14px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: c.note || c.image_url ? '10px' : 0 }}>
                <Link href={`/user/${c.user?.username}`}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(26,26,46,0.5)', backgroundImage: c.user?.avatar_url ? `url(${c.user.avatar_url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }} />
                </Link>
                <div>
                  <p style={{ fontSize: '13px', color: '#e2e4e9' }}>
                    <Link href={`/user/${c.user?.username}`} style={{ fontWeight: 600, color: '#e2e4e9' }}>{c.user?.display_name || c.user?.username}</Link>
                    {' checked in'}
                    {c.vehicle && <span style={{ color: '#a78bfa' }}> with their {c.vehicle.year} {c.vehicle.make} {c.vehicle.model}</span>}
                  </p>
                  <p style={{ fontSize: '11px', color: '#6b7280' }}>
                    {new Date(c.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              {c.note && <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: c.image_url ? '10px' : 0 }}>{c.note}</p>}
              {c.image_url && (
                <div style={{ borderRadius: '8px', overflow: 'hidden', maxHeight: '200px', background: 'rgba(26,26,46,0.5)' }}>
                  <img src={c.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', maxHeight: '200px' }} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
