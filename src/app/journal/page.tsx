'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Skeleton from '@/components/Skeleton'

interface JournalEntry {
  id: string
  title: string
  content: string
  image_url: string
  before_image_url: string
  after_image_url: string
  milestone_type: string
  cost: number
  journal_date: string
  created_at: string
}

interface Vehicle {
  id: string
  year: number
  make: string
  model: string
}

const MILESTONE_LABELS: Record<string, string> = {
  mod_install: 'MOD', maintenance: 'MAINT', milestone: 'MILE', purchase: 'BUY',
  event: 'EVENT', photo_shoot: 'PHOTO', dyno: 'DYNO', other: 'NOTE',
}

export default function JournalPage() {
  const supabase = createClient()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState('')
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [isPremium, setIsPremium] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [totalCost, setTotalCost] = useState(0)
  const [form, setForm] = useState({ title: '', content: '', milestone_type: 'mod_install', cost: '', journal_date: new Date().toISOString().split('T')[0] })
  const [submitting, setSubmitting] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase.from('profiles').select('subscription_tier').eq('id', user.id).single()
      setIsPremium(profile?.subscription_tier === 'premium')

      const { data: v } = await supabase.from('vehicles').select('id, year, make, model').eq('owner_id', user.id)
      setVehicles(v || [])
      if (v && v.length > 0) {
        setSelectedVehicle(v[0].id)
        await loadEntries(v[0].id)
      }
      setLoading(false)
    }
    load()
  }, [])

  const loadEntries = async (vehicleId: string) => {
    const { data } = await supabase
      .from('build_journal')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('journal_date', { ascending: false })
    setEntries((data || []) as JournalEntry[])

    const { data: costs } = await supabase
      .from('build_costs')
      .select('cost')
      .eq('vehicle_id', vehicleId)
    setTotalCost((costs || []).reduce((sum: number, c: any) => sum + (parseFloat(c.cost) || 0), 0))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let imageUrl = ''
    if (imageFile) {
      const filename = `journal/${user.id}/${Date.now()}.${imageFile.name.split('.').pop()}`
      await supabase.storage.from('vehicles').upload(filename, imageFile)
      const { data } = supabase.storage.from('vehicles').getPublicUrl(filename)
      imageUrl = data.publicUrl
    }

    await supabase.from('build_journal').insert({
      vehicle_id: selectedVehicle,
      title: form.title,
      content: form.content,
      milestone_type: form.milestone_type,
      cost: form.cost ? parseFloat(form.cost) : null,
      journal_date: form.journal_date,
      image_url: imageUrl || null,
    })

    if (form.cost) {
      await supabase.from('build_costs').insert({
        vehicle_id: selectedVehicle,
        category: form.milestone_type,
        item: form.title,
        cost: parseFloat(form.cost),
      })
    }

    setShowForm(false)
    setForm({ title: '', content: '', milestone_type: 'mod_install', cost: '', journal_date: new Date().toISOString().split('T')[0] })
    setImageFile(null)
    setSubmitting(false)
    await loadEntries(selectedVehicle)
  }

  if (loading) return <div style={{ maxWidth: '800px', margin: '0 auto', padding: '80px 32px 40px' }}><Skeleton variant="card" count={3} /></div>

  if (!isPremium) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '80px 32px 40px', textAlign: 'center' }}>
        <div className="glass" style={{ padding: '48px 32px' }}>
          <h1 className="text-2xl font-bold" style={{ marginBottom: '8px' }}>Build Journal</h1>
          <p className="text-muted-light" style={{ marginBottom: '12px', lineHeight: 1.6 }}>
            Document your build from Day 1. Track every mod, every milestone, every dollar spent. Before and after photos, cost tracking, and a full timeline of your build journey.
          </p>
          <p className="text-muted" style={{ marginBottom: '24px', fontSize: '13px' }}>Premium feature -- upgrade to start your build journal.</p>
          <Link href="/pricing" className="btn-neon" style={{ fontSize: '13px' }}>Upgrade to Premium</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '80px 32px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="text-3xl font-bold">Build <span className="text-neon-light">Journal</span></h1>
          <p className="text-muted-light" style={{ marginTop: '4px', fontSize: '0.85rem' }}>Your build story, one entry at a time</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-neon" style={{ fontSize: '12px' }}>
          {showForm ? 'Cancel' : 'New Entry'}
        </button>
      </div>

      {/* Vehicle selector + total cost */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {vehicles.length > 1 && (
          <select value={selectedVehicle} onChange={(e) => { setSelectedVehicle(e.target.value); loadEntries(e.target.value) }} className="input" style={{ maxWidth: '300px' }}>
            {vehicles.map(v => <option key={v.id} value={v.id}>{v.year} {v.make} {v.model}</option>)}
          </select>
        )}
        <div className="glass" style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="text-foreground font-bold" style={{ fontSize: '16px' }}>${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          <span className="text-muted" style={{ fontSize: '11px' }}>total invested</span>
        </div>
      </div>

      {/* New entry form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="glass" style={{ padding: '24px', marginBottom: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-light" style={{ display: 'block', marginBottom: '6px' }}>Title *</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input" placeholder="Installed headers" required />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-light" style={{ display: 'block', marginBottom: '6px' }}>Type</label>
              <select value={form.milestone_type} onChange={(e) => setForm({ ...form, milestone_type: e.target.value })} className="input">
                <option value="mod_install">Mod Install</option>
                <option value="maintenance">Maintenance</option>
                <option value="milestone">Milestone</option>
                <option value="purchase">Purchase</option>
                <option value="event">Event</option>
                <option value="dyno">Dyno</option>
                <option value="photo_shoot">Photo Shoot</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-light" style={{ display: 'block', marginBottom: '6px' }}>Date</label>
              <input type="date" value={form.journal_date} onChange={(e) => setForm({ ...form, journal_date: e.target.value })} className="input" />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-light" style={{ display: 'block', marginBottom: '6px' }}>Cost ($)</label>
              <input type="number" step="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} className="input" placeholder="0.00" />
            </div>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-light" style={{ display: 'block', marginBottom: '6px' }}>Notes</label>
            <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="input" rows={3} placeholder="What did you do? How did it go?" />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-light" style={{ display: 'block', marginBottom: '6px' }}>Photo</label>
            <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="input" style={{ fontSize: '13px' }} />
          </div>
          <button type="submit" disabled={submitting} className="btn-neon" style={{ opacity: submitting ? 0.5 : 1, fontSize: '12px' }}>
            {submitting ? 'Saving...' : 'Add Entry'}
          </button>
        </form>
      )}

      {/* Timeline */}
      {entries.length === 0 ? (
        <div className="glass" style={{ padding: '48px 32px', textAlign: 'center' }}>
          <h2 className="text-xl font-bold" style={{ marginBottom: '8px' }}>No entries yet</h2>
          <p className="text-muted-light" style={{ fontSize: '0.9rem' }}>Start documenting your build journey!</p>
        </div>
      ) : (
        <div style={{ position: 'relative', paddingLeft: '32px' }}>
          {/* Timeline line */}
          <div style={{ position: 'absolute', left: '11px', top: 0, bottom: 0, width: '2px', background: 'rgba(44, 121, 196, 0.2)' }} />

          {entries.map((entry, i) => (
            <div key={entry.id} style={{ position: 'relative', marginBottom: '20px' }}>
              {/* Timeline dot */}
              <div style={{ position: 'absolute', left: '-27px', top: '20px', width: '14px', height: '14px', borderRadius: '50%', background: '#2c79c4', border: '3px solid #0c0c14', zIndex: 1 }} />

              <div className="glass card-hover" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '1px', padding: '3px 8px', borderRadius: '4px', background: 'rgba(44, 121, 196, 0.12)', color: 'var(--color-link)' }}>{MILESTONE_LABELS[entry.milestone_type] || 'NOTE'}</span>
                    <h3 className="font-bold text-foreground" style={{ fontSize: '15px' }}>{entry.title}</h3>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {entry.cost && (
                      <span style={{ fontSize: '13px', color: 'var(--color-success)', fontWeight: 700 }}>${parseFloat(String(entry.cost)).toLocaleString()}</span>
                    )}
                    <span className="text-muted" style={{ fontSize: '12px' }}>
                      {new Date(entry.journal_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>
                {entry.content && <p className="text-muted-light" style={{ fontSize: '13px', lineHeight: 1.6 }}>{entry.content}</p>}
                {entry.image_url && (
                  <div style={{ marginTop: '12px', borderRadius: '8px', overflow: 'hidden', maxHeight: '250px', background: '#e4e4e4' }}>
                    <img src={entry.image_url} alt={entry.title} style={{ width: '100%', height: '100%', objectFit: 'cover', maxHeight: '250px' }} />
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
