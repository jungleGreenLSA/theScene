'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Mod {
  id: string
  vehicle_id: string
  category: Category
  item: string
  brand: string | null
  notes: string | null
  sort_order: number
}

type Category =
  | 'engine' | 'exhaust' | 'forced_induction' | 'tuning'
  | 'suspension' | 'brakes'
  | 'wheels_tires'
  | 'exterior' | 'interior'
  | 'audio_electronics'
  | 'other'

const CATEGORY_GROUPS: { section: string; categories: { key: Category; label: string; hint: string }[] }[] = [
  {
    section: 'Performance',
    categories: [
      { key: 'engine', label: 'Engine', hint: 'Intake, cams, pistons, block work...' },
      { key: 'exhaust', label: 'Exhaust', hint: 'Headers, midpipe, cat-back, downpipe...' },
      { key: 'forced_induction', label: 'Forced Induction', hint: 'Turbo, supercharger, intercooler...' },
      { key: 'tuning', label: 'Tuning', hint: 'ECU tune, dyno results, fuel system...' },
    ],
  },
  {
    section: 'Suspension & Brakes',
    categories: [
      { key: 'suspension', label: 'Suspension', hint: 'Coilovers, sway bars, control arms...' },
      { key: 'brakes', label: 'Brakes', hint: 'Rotors, pads, lines, calipers...' },
    ],
  },
  {
    section: 'Wheels & Tires',
    categories: [
      { key: 'wheels_tires', label: 'Wheels & Tires', hint: 'Wheel setup, tire spec, offset...' },
    ],
  },
  {
    section: 'Visual',
    categories: [
      { key: 'exterior', label: 'Exterior', hint: 'Wrap, paint, aero, body kit...' },
      { key: 'interior', label: 'Interior', hint: 'Seats, wheel, shift knob, harness...' },
    ],
  },
  {
    section: 'Electronics',
    categories: [
      { key: 'audio_electronics', label: 'Audio & Electronics', hint: 'Head unit, subs, amps, gauges...' },
    ],
  },
  {
    section: 'Other',
    categories: [
      { key: 'other', label: 'Other', hint: 'Anything that doesn\'t fit above' },
    ],
  },
]

export default function VehicleMods({ vehicleId }: { vehicleId: string }) {
  const supabase = createClient()
  const [mods, setMods] = useState<Mod[]>([])
  const [loading, setLoading] = useState(true)
  const [openCategory, setOpenCategory] = useState<Category | null>(null)
  const [draft, setDraft] = useState({ item: '', brand: '', notes: '' })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('vehicle_modifications')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('category')
        .order('sort_order')
      setMods((data || []) as Mod[])
      setLoading(false)
    }
    load()
  }, [vehicleId])

  const byCategory = (cat: Category) => mods.filter(m => m.category === cat)

  const openAdd = (cat: Category) => {
    setOpenCategory(cat)
    setEditingId(null)
    setDraft({ item: '', brand: '', notes: '' })
  }

  const openEdit = (m: Mod) => {
    setOpenCategory(m.category)
    setEditingId(m.id)
    setDraft({ item: m.item, brand: m.brand || '', notes: m.notes || '' })
  }

  const cancel = () => {
    setOpenCategory(null)
    setEditingId(null)
    setDraft({ item: '', brand: '', notes: '' })
  }

  const save = async () => {
    if (!openCategory || !draft.item.trim()) return
    setSaving(true)

    if (editingId) {
      const { error } = await supabase.from('vehicle_modifications').update({
        item: draft.item.trim(),
        brand: draft.brand.trim() || null,
        notes: draft.notes.trim() || null,
      }).eq('id', editingId)
      if (!error) {
        setMods(ms => ms.map(m => m.id === editingId ? { ...m, item: draft.item.trim(), brand: draft.brand.trim() || null, notes: draft.notes.trim() || null } : m))
        cancel()
      } else {
        alert('Save failed: ' + error.message)
      }
    } else {
      const nextOrder = byCategory(openCategory).length
      const { data, error } = await supabase.from('vehicle_modifications').insert({
        vehicle_id: vehicleId,
        category: openCategory,
        item: draft.item.trim(),
        brand: draft.brand.trim() || null,
        notes: draft.notes.trim() || null,
        sort_order: nextOrder,
      }).select().single()
      if (error) { alert('Add failed: ' + error.message) }
      else if (data) { setMods(ms => [...ms, data as Mod]); cancel() }
    }
    setSaving(false)
  }

  const remove = async (id: string) => {
    if (!window.confirm('Remove this mod?')) return
    const { error } = await supabase.from('vehicle_modifications').delete().eq('id', id)
    if (error) { alert('Delete failed: ' + error.message); return }
    setMods(ms => ms.filter(m => m.id !== id))
  }

  if (loading) return <p style={{ fontSize: '13px', color: '#6b7280' }}>Loading mods...</p>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {CATEGORY_GROUPS.map(group => (
        <div key={group.section}>
          <h3 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#a78bfa', marginBottom: '10px' }}>
            {group.section}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {group.categories.map(cat => {
              const items = byCategory(cat.key)
              return (
                <div key={cat.key} style={{ padding: '14px', borderRadius: '8px', background: 'rgba(18,18,30,0.4)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: items.length > 0 ? '10px' : 0 }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: '#e2e4e9' }}>{cat.label}</p>
                      <p style={{ fontSize: '11px', color: '#6b7280' }}>{cat.hint}</p>
                    </div>
                    {openCategory !== cat.key && (
                      <button type="button" onClick={() => openAdd(cat.key)} style={{ padding: '6px 12px', borderRadius: '6px', background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa', fontSize: '11px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>+ Add</button>
                    )}
                  </div>

                  {items.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {items.map(m => (
                        <div key={m.id} style={{ padding: '10px 12px', borderRadius: '6px', background: 'rgba(18,18,30,0.6)', border: '1px solid rgba(255,255,255,0.04)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <p style={{ fontSize: '13px', fontWeight: 600, color: '#e2e4e9' }}>{m.item}</p>
                              {m.brand && <p style={{ fontSize: '11px', color: '#a78bfa', marginTop: '2px' }}>{m.brand}</p>}
                              {m.notes && <p style={{ fontSize: '12px', color: '#8892a4', marginTop: '4px', whiteSpace: 'pre-wrap' }}>{m.notes}</p>}
                            </div>
                            <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                              <button type="button" onClick={() => openEdit(m)} style={{ padding: '4px 10px', borderRadius: '4px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>Edit</button>
                              <button type="button" onClick={() => remove(m.id)} className="btn-danger-sm">Remove</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {openCategory === cat.key && (
                    <div style={{ marginTop: items.length > 0 ? '10px' : '12px', padding: '12px', borderRadius: '6px', background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.2)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <input value={draft.item} onChange={(e) => setDraft({ ...draft, item: e.target.value })} className="input" placeholder={`Part / mod (e.g. "Kooks Long Tube Headers")`} maxLength={200} autoFocus />
                        <input value={draft.brand} onChange={(e) => setDraft({ ...draft, brand: e.target.value })} className="input" placeholder="Brand (optional)" maxLength={100} />
                        <textarea value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} className="input" rows={2} placeholder="Notes (optional)" maxLength={500} />
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button type="button" onClick={cancel} style={{ padding: '8px 14px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                          <button type="button" onClick={save} disabled={saving || !draft.item.trim()} className="btn-primary" style={{ fontSize: '12px', padding: '8px 16px', opacity: (saving || !draft.item.trim()) ? 0.5 : 1 }}>
                            {saving ? 'Saving...' : (editingId ? 'Save' : 'Add mod')}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
