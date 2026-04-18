'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MOD_CATEGORY_GROUPS, type ModCategory as Category } from '@/lib/vehicleMods'

interface Mod {
  id: string
  vehicle_id: string
  category: Category
  item: string
  brand: string | null
  notes: string | null
  sort_order: number
}

const CATEGORY_GROUPS = MOD_CATEGORY_GROUPS

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

  if (loading) return <p style={{ fontSize: '13px', color: '#555555' }}>Loading mods...</p>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {CATEGORY_GROUPS.map(group => (
        <div key={group.section}>
          <h3 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#f97316', marginBottom: '10px' }}>
            {group.section}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {group.categories.map(cat => {
              const items = byCategory(cat.key)
              return (
                <div key={cat.key} style={{ padding: '14px', borderRadius: '8px', background: '#f0f0f0', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: items.length > 0 ? '10px' : 0 }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: '#1a1a1a' }}>{cat.label}</p>
                      <p style={{ fontSize: '11px', color: '#555555' }}>{cat.hint}</p>
                    </div>
                    {openCategory !== cat.key && (
                      <button type="button" onClick={() => openAdd(cat.key)} style={{ padding: '6px 12px', borderRadius: '6px', background: 'rgba(232,120,23,0.15)', border: '1px solid rgba(232,120,23,0.3)', color: '#f97316', fontSize: '11px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>+ Add</button>
                    )}
                  </div>

                  {items.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {items.map(m => (
                        <div key={m.id} style={{ padding: '10px 12px', borderRadius: '6px', background: '#f0f0f0', border: '1px solid #f5f5f5' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <p style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a1a' }}>{m.item}</p>
                              {m.brand && <p style={{ fontSize: '11px', color: '#f97316', marginTop: '2px' }}>{m.brand}</p>}
                              {m.notes && <p style={{ fontSize: '12px', color: '#666666', marginTop: '4px', whiteSpace: 'pre-wrap' }}>{m.notes}</p>}
                            </div>
                            <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                              <button type="button" onClick={() => openEdit(m)} style={{ padding: '4px 10px', borderRadius: '4px', background: '#f5f5f5', border: '1px solid #d4d4d4', color: '#555555', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>Edit</button>
                              <button type="button" onClick={() => remove(m.id)} className="btn-danger-sm">Remove</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {openCategory === cat.key && (
                    <div style={{ marginTop: items.length > 0 ? '10px' : '12px', padding: '12px', borderRadius: '6px', background: 'rgba(232,120,23,0.05)', border: '1px solid rgba(232,120,23,0.2)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <input value={draft.item} onChange={(e) => setDraft({ ...draft, item: e.target.value })} className="input" placeholder={`Part / mod (e.g. "Kooks Long Tube Headers")`} maxLength={200} autoFocus />
                        <input value={draft.brand} onChange={(e) => setDraft({ ...draft, brand: e.target.value })} className="input" placeholder="Brand (optional)" maxLength={100} />
                        <textarea value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} className="input" rows={2} placeholder="Notes (optional)" maxLength={500} />
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button type="button" onClick={cancel} style={{ padding: '8px 14px', borderRadius: '6px', background: '#f5f5f5', border: '1px solid #d4d4d4', color: '#555555', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
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
