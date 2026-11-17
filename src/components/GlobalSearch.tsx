'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Hit {
  kind: 'user' | 'club' | 'event' | 'shop' | 'vehicle'
  href: string
  title: string
  subtitle?: string
}

const KIND_LABELS: Record<Hit['kind'], string> = {
  user: 'USER',
  club: 'CLUB',
  event: 'EVENT',
  shop: 'SHOP',
  vehicle: 'RIDE',
}

export default function GlobalSearch() {
  const supabase = createClient()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [hits, setHits] = useState<Hit[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<number | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    const q = query.trim()
    if (q.length < 2) { setHits([]); return }
    setLoading(true)
    debounceRef.current = window.setTimeout(async () => {
      const like = `%${q}%`
      const [users, clubs, events, shops, vehicles] = await Promise.all([
        supabase.from('profiles').select('username, display_name, avatar_url').or(`username.ilike.${like},display_name.ilike.${like}`).eq('is_public', true).limit(3),
        supabase.from('clubs').select('name, slug, logo_url').ilike('name', like).eq('is_public', true).limit(3),
        supabase.from('events').select('title, slug, city, state').ilike('title', like).in('status', ['published', 'active']).limit(3),
        supabase.from('shops').select('name, slug, city, state').ilike('name', like).limit(3),
        supabase.from('vehicles').select('slug, year, make, model, owner:profiles!owner_id(username)').or(`make.ilike.${like},model.ilike.${like}`).eq('is_public', true).limit(3),
      ])

      const results: Hit[] = []
      ;(users.data || []).forEach((u: any) => results.push({ kind: 'user', title: u.display_name || u.username, subtitle: `@${u.username}`, href: `/user/${u.username}` }))
      ;(clubs.data || []).forEach((c: any) => results.push({ kind: 'club', title: c.name, subtitle: 'Club', href: `/clubs/${c.slug}` }))
      ;(events.data || []).forEach((e: any) => results.push({ kind: 'event', title: e.title, subtitle: [e.city, e.state].filter(Boolean).join(', ') || 'Event', href: `/events/${e.slug}` }))
      ;(shops.data || []).forEach((s: any) => results.push({ kind: 'shop', title: s.name, subtitle: [s.city, s.state].filter(Boolean).join(', ') || 'Shop', href: `/shops/${s.slug}` }))
      ;(vehicles.data || []).forEach((v: any) => {
        const owner = v.owner?.username
        if (!owner) return
        results.push({ kind: 'vehicle', title: `${v.year} ${v.make} ${v.model}`, subtitle: `by @${owner}`, href: `/user/${owner}/${v.slug}` })
      })

      setHits(results)
      setLoading(false)
    }, 250)
  }, [query])

  const pick = (h: Hit) => {
    setOpen(false)
    setQuery('')
    router.push(h.href)
  }

  return (
    <div ref={wrapperRef} style={{ position: 'relative', flex: 1, maxWidth: '320px', margin: '0 16px' }}>
      <input
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder="Search builds, clubs, events, shops..."
        style={{ width: '100%', padding: '7px 12px', borderRadius: '6px', background: '#f0f0f0', border: '1px solid #d4d4d4', color: '#1a1a1a', fontSize: '12px', outline: 'none' }}
      />
      {open && query.trim().length >= 2 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '6px', background: '#12121e', border: '1px solid #d4d4d4', borderRadius: '8px', overflow: 'hidden', zIndex: 60, maxHeight: '360px', overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
          {loading && hits.length === 0 && (
            <div style={{ padding: '14px', fontSize: '12px', color: '#555555', textAlign: 'center' }}>Searching…</div>
          )}
          {!loading && hits.length === 0 && (
            <div style={{ padding: '14px', fontSize: '12px', color: '#555555', textAlign: 'center' }}>No matches.</div>
          )}
          {hits.map((h, i) => (
            <button
              key={i}
              onClick={() => pick(h)}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 12px', background: 'none', border: 'none', borderBottom: i < hits.length - 1 ? '1px solid #f5f5f5' : 'none', cursor: 'pointer', textAlign: 'left' }}
            >
              <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '1px', color: '#555555', flexShrink: 0, width: '40px' }}>{KIND_LABELS[h.kind]}</span>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.title}</p>
                {h.subtitle && <p style={{ fontSize: '11px', color: '#555555' }}>{h.subtitle}</p>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
