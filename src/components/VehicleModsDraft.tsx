'use client'

import { useState } from 'react'
import { MOD_CATEGORY_GROUPS, type ModCategory } from '@/lib/vehicleMods'

export interface DraftMod {
  category: ModCategory
  item: string
  brand: string
  notes: string
}

interface Props {
  mods: DraftMod[]
  onChange: (mods: DraftMod[]) => void
}

export default function VehicleModsDraft({ mods, onChange }: Props) {
  const [openCategory, setOpenCategory] = useState<ModCategory | null>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [draft, setDraft] = useState({ item: '', brand: '', notes: '' })

  const byCategory = (cat: ModCategory) =>
    mods.map((m, i) => ({ ...m, idx: i })).filter(m => m.category === cat)

  const openAdd = (cat: ModCategory) => {
    setOpenCategory(cat)
    setEditingIndex(null)
    setDraft({ item: '', brand: '', notes: '' })
  }

  const openEdit = (idx: number) => {
    const m = mods[idx]
    setOpenCategory(m.category)
    setEditingIndex(idx)
    setDraft({ item: m.item, brand: m.brand, notes: m.notes })
  }

  const cancel = () => {
    setOpenCategory(null)
    setEditingIndex(null)
    setDraft({ item: '', brand: '', notes: '' })
  }

  const save = () => {
    if (!openCategory || !draft.item.trim()) return
    const next: DraftMod = {
      category: openCategory,
      item: draft.item.trim(),
      brand: draft.brand.trim(),
      notes: draft.notes.trim(),
    }
    if (editingIndex !== null) {
      const copy = [...mods]
      copy[editingIndex] = next
      onChange(copy)
    } else {
      onChange([...mods, next])
    }
    cancel()
  }

  const remove = (idx: number) => {
    if (!window.confirm('Remove this mod?')) return
    onChange(mods.filter((_, i) => i !== idx))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {MOD_CATEGORY_GROUPS.map(group => (
        <div key={group.section}>
          <h3 className="eyebrow" style={{ marginBottom: '10px' }}>
            {group.section}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {group.categories.map(cat => {
              const items = byCategory(cat.key)
              return (
                <div key={cat.key} style={{ padding: '14px', borderRadius: '8px', background: 'rgba(18,18,30,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: items.length > 0 ? '10px' : 0 }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: '#e4e1ed' }}>{cat.label}</p>
                      <p style={{ fontSize: '11px', color: '#6b7280' }}>{cat.hint}</p>
                    </div>
                    {openCategory !== cat.key && (
                      <button type="button" onClick={() => openAdd(cat.key)} style={{ padding: '6px 12px', borderRadius: '6px', background: 'rgba(45,212,191,0.1)', border: '1px solid rgba(45,212,191,0.3)', color: '#2dd4bf', fontSize: '11px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', minHeight: '32px' }}>+ Add</button>
                    )}
                  </div>

                  {items.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {items.map(m => (
                        <div key={m.idx} style={{ padding: '10px 12px', borderRadius: '6px', background: 'rgba(18,18,30,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <p style={{ fontSize: '13px', fontWeight: 600, color: '#e4e1ed' }}>{m.item}</p>
                              {m.brand && <p className="spec" style={{ fontSize: '11px', color: '#2dd4bf', marginTop: '2px' }}>{m.brand}</p>}
                              {m.notes && <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px', whiteSpace: 'pre-wrap' }}>{m.notes}</p>}
                            </div>
                            <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                              <button type="button" onClick={() => openEdit(m.idx)} style={{ padding: '4px 10px', borderRadius: '4px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af', fontSize: '11px', fontWeight: 600, cursor: 'pointer', minHeight: '32px' }}>Edit</button>
                              <button type="button" onClick={() => remove(m.idx)} className="btn-danger-sm">Remove</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {openCategory === cat.key && (
                    <div style={{ marginTop: items.length > 0 ? '10px' : '12px', padding: '12px', borderRadius: '6px', background: 'rgba(45,212,191,0.05)', border: '1px solid rgba(45,212,191,0.2)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <input value={draft.item} onChange={(e) => setDraft({ ...draft, item: e.target.value })} className="input" placeholder={`Part / mod (e.g. "Kooks Long Tube Headers")`} maxLength={200} autoFocus />
                        <input value={draft.brand} onChange={(e) => setDraft({ ...draft, brand: e.target.value })} className="input" placeholder="Brand (optional)" maxLength={100} />
                        <textarea value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} className="input" rows={2} placeholder="Notes (optional)" maxLength={500} />
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          <button type="button" onClick={cancel} style={{ padding: '8px 14px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af', fontSize: '12px', fontWeight: 600, cursor: 'pointer', minHeight: '36px' }}>Cancel</button>
                          <button type="button" onClick={save} disabled={!draft.item.trim()} className="btn-teal" style={{ fontSize: '12px', padding: '8px 16px', opacity: !draft.item.trim() ? 0.5 : 1, minHeight: '36px' }}>
                            {editingIndex !== null ? 'Save' : 'Add mod'}
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
