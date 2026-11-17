'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface ShopSuggestion {
  id: string
  slug: string
  name: string
  city: string
  state: string
}

interface TaggedShop {
  id: string
  shop: { id: string; slug: string; name: string; city: string; state: string }
  note: string | null
}

export default function ShopTagger({ vehicleId }: { vehicleId: string }) {
  const supabase = createClient()
  const [tags, setTags] = useState<TaggedShop[]>([])
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<ShopSuggestion[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [adding, setAdding] = useState(false)
  const [message, setMessage] = useState('')
  const debounceRef = useRef<number | null>(null)

  const flash = (m: string) => { setMessage(m); setTimeout(() => setMessage(''), 3500) }

  const loadTags = async () => {
    const { data } = await supabase
      .from('vehicle_shops')
      .select('id, note, shop:shops(id, slug, name, city, state)')
      .eq('vehicle_id', vehicleId)
      .order('created_at', { ascending: false })
    setTags((data || []) as unknown as TaggedShop[])
  }

  useEffect(() => { loadTags() /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [vehicleId])

  // Debounced search as user types
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    if (query.trim().length < 2) { setSuggestions([]); return }
    debounceRef.current = window.setTimeout(async () => {
      const { data } = await supabase
        .from('shops')
        .select('id, slug, name, city, state')
        .ilike('name', `%${query.trim()}%`)
        .limit(8)
      setSuggestions((data || []) as ShopSuggestion[])
    }, 200)
    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current) }
  }, [query])

  const tagShop = async (shopId: string) => {
    setAdding(true)
    const { error } = await supabase.from('vehicle_shops').insert({ vehicle_id: vehicleId, shop_id: shopId })
    if (error) {
      if (error.code === '23505') flash('Already tagged.')
      else flash('Tag failed: ' + error.message)
    } else {
      setQuery('')
      setSuggestions([])
      setShowDropdown(false)
      await loadTags()
    }
    setAdding(false)
  }

  const createAndTag = async () => {
    const name = query.trim()
    if (name.length < 2) return
    setAdding(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { flash('Sign in required'); setAdding(false); return }
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36)
    const { data: shop, error } = await supabase.from('shops').insert({
      slug, name, created_by: user.id,
    }).select().single()
    if (error || !shop) { flash('Create failed: ' + (error?.message || 'unknown')); setAdding(false); return }
    await supabase.from('vehicle_shops').insert({ vehicle_id: vehicleId, shop_id: shop.id })
    flash(`Added "${name}" — you can fill in the address later.`)
    setQuery('')
    setSuggestions([])
    setShowDropdown(false)
    await loadTags()
    setAdding(false)
  }

  const untag = async (tagId: string) => {
    const { error, count } = await supabase.from('vehicle_shops').delete({ count: 'exact' }).eq('id', tagId)
    if (error || count === 0) { flash(error?.message || 'Could not untag'); return }
    setTags(tags.filter(t => t.id !== tagId))
  }

  const exactMatch = suggestions.some(s => s.name.toLowerCase() === query.trim().toLowerCase())

  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wider text-muted-light" style={{ display: 'block', marginBottom: '8px' }}>Tagged Shops</label>

      {tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
          {tags.map(t => (
            <span key={t.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 4px 5px 10px', borderRadius: '6px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', fontSize: '12px', color: '#22c55e' }}>
              <Link href={`/shops/${t.shop.slug}`} style={{ color: '#22c55e', fontWeight: 600 }}>{t.shop.name}</Link>
              {t.shop.city && <span style={{ color: '#555555', fontSize: '11px' }}>· {t.shop.city}, {t.shop.state}</span>}
              <button onClick={() => untag(t.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '13px', padding: '0 4px' }}>x</button>
            </span>
          ))}
        </div>
      )}

      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setShowDropdown(true) }}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          placeholder="Type a shop name — we'll autocomplete or let you add a new one"
          className="input"
          style={{ width: '100%' }}
        />
        {showDropdown && query.trim().length >= 2 && (suggestions.length > 0 || !exactMatch) && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px', background: '#12121e', border: '1px solid #d4d4d4', borderRadius: '8px', overflow: 'hidden', zIndex: 10, maxHeight: '280px', overflowY: 'auto' }}>
            {suggestions.map(s => (
              <button
                key={s.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => tagShop(s.id)}
                disabled={adding}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', background: 'none', border: 'none', borderBottom: '1px solid #f5f5f5', cursor: 'pointer', color: '#1a1a1a' }}
              >
                <span style={{ fontSize: '13px', fontWeight: 600 }}>{s.name}</span>
                {s.city && s.state && <span style={{ fontSize: '11px', color: '#555555', marginLeft: '8px' }}>{s.city}, {s.state}</span>}
              </button>
            ))}
            {!exactMatch && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={createAndTag}
                disabled={adding}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', background: 'rgba(34,197,94,0.06)', border: 'none', cursor: 'pointer', color: '#22c55e', fontSize: '13px', fontWeight: 600 }}
              >
                + Add &ldquo;{query.trim()}&rdquo; as a new shop
              </button>
            )}
          </div>
        )}
      </div>

      {message && <p style={{ fontSize: '11px', color: '#22c55e', marginTop: '6px' }}>{message}</p>}
    </div>
  )
}
