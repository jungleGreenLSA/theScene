'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import SceneHeatmap from '@/components/SceneHeatmap'

interface Shop {
  id: string
  slug: string
  name: string
  description: string
  city: string
  state: string
  specialties: string[]
  logo_url: string | null
  cover_image_url: string | null
  tag_count?: number
}

export default function ShopsPage() {
  const supabase = createClient()
  const [shops, setShops] = useState<Shop[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('shops')
        .select('id, slug, name, description, city, state, specialties, logo_url, cover_image_url, vehicle_shops(id)')
        .order('name')
      const mapped = (data || []).map((s: any) => ({ ...s, tag_count: s.vehicle_shops?.length || 0 }))
      setShops(mapped)
      setLoading(false)
    }
    load()
  }, [])

  const filtered = search
    ? shops.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.city?.toLowerCase().includes(search.toLowerCase()) ||
        s.state?.toLowerCase().includes(search.toLowerCase()) ||
        s.specialties?.some(t => t.toLowerCase().includes(search.toLowerCase()))
      )
    : shops

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '80px 16px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <p className="eyebrow" style={{ marginBottom: '4px' }}>Directory</p>
          <h1 className="text-3xl font-bold">Car <span className="gradient-text">Shops</span></h1>
          <p className="text-muted-light" style={{ marginTop: '4px', fontSize: '0.9rem' }}>Performance, detail, fab, tune — find the shops building your scene.</p>
        </div>
        <Link href="/shops/create" className="btn-primary text-xs">+ Add Shop</Link>
      </div>

      <div className="glass" style={{ padding: '20px', marginBottom: '20px' }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder='Search by name, city, state, or specialty (e.g. "Dyno", "Wheels", "Austin TX")'
          className="input"
          style={{ width: '100%' }}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <SceneHeatmap type="shops" title="Where the Shops Are" />
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {[1,2,3].map(i => <div key={i} className="glass animate-pulse" style={{ height: '200px' }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass text-center" style={{ padding: '48px 32px' }}>
          <h2 className="text-xl font-bold" style={{ marginBottom: '8px' }}>No shops yet</h2>
          <p className="text-muted-light" style={{ fontSize: '0.9rem', marginBottom: '20px' }}>Be the first to add a shop to The Scene.</p>
          <Link href="/shops/create" className="btn-primary">+ Add a Shop</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {filtered.map((shop) => (
            <Link key={shop.id} href={`/shops/${shop.slug}`} className="glass overflow-hidden card-hover group">
              <div style={{ height: '120px', position: 'relative', overflow: 'hidden', background: 'rgba(26,26,46,0.5)' }}>
                {shop.cover_image_url ? (
                  <img src={shop.cover_image_url} alt={shop.name} className="group-hover:scale-105 transition-transform duration-500" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(45,212,191,0.08), rgba(139,92,246,0.08))' }} />
                )}
                {shop.logo_url && (
                  <div style={{ position: 'absolute', bottom: '8px', left: '12px', width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', background: '#0c0c14', border: '2px solid rgba(255,255,255,0.06)' }}>
                    <img src={shop.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
              </div>
              <div style={{ padding: '16px' }}>
                <h3 className="font-bold text-foreground group-hover:text-teal transition-colors" style={{ fontSize: '0.95rem' }}>{shop.name}</h3>
                {shop.city && shop.state && (
                  <p className="text-muted-light" style={{ fontSize: '12px', marginTop: '4px' }}>{shop.city}, {shop.state}</p>
                )}
                {shop.specialties && shop.specialties.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                    {shop.specialties.slice(0, 3).map((t, i) => (
                      <span key={i} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.2)', color: '#2dd4bf', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{t}</span>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="text-muted spec" style={{ fontSize: '12px' }}>{shop.tag_count} {shop.tag_count === 1 ? 'build' : 'builds'}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
