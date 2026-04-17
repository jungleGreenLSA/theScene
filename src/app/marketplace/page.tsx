'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { getNearbyPrefs } from '@/lib/nearbyFilter'

interface Listing {
  id: string
  listing_type: string
  title: string
  description: string
  price: number
  is_obo: boolean
  city: string
  state: string
  status: string
  created_at: string
  seller: { username: string; display_name: string; avatar_url: string; location: string }
  images: { image_url: string }[]
  comments: { id: string }[]
}

export default function MarketplacePage() {
  const supabase = createClient()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const [nearbyState, setNearbyState] = useState<string | null>(null)

  useEffect(() => {
    const fetch = async () => {
      const prefs = await getNearbyPrefs(supabase)
      let q = supabase
        .from('listings')
        .select('*, seller:profiles!listings_seller_id_fkey(username, display_name, avatar_url, location), images:listing_images(image_url), comments:listing_comments(id)')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(30)
      if (prefs.filterMarketplace && prefs.state) {
        q = q.eq('state', prefs.state)
        setNearbyState(prefs.state)
      }
      const { data } = await q
      setListings((data || []) as unknown as Listing[])
      setLoading(false)
    }
    fetch()
  }, [])

  const filtered = listings.filter(l => {
    if (typeFilter && l.listing_type !== typeFilter) return false
    if (filter && !l.title.toLowerCase().includes(filter.toLowerCase())) return false
    return true
  })

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '80px 32px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#e2e4e9' }}>Market<span style={{ color: '#fb923c' }}>place</span></h1>
          <p style={{ fontSize: '14px', color: '#8892a4', marginTop: '4px' }}>Buy and sell vehicles & parts</p>
        </div>
        <Link href="/marketplace/create" style={{ padding: '10px 20px', borderRadius: '8px', background: '#f97316', border: '1px solid #fb923c', color: '#0c0c14', fontSize: '13px', fontWeight: 700 }}>
          + List Item
        </Link>
      </div>

      {/* Filters */}
      <div className="glass" style={{ padding: '16px', marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <input value={filter} onChange={(e) => setFilter(e.target.value)} className="input" placeholder="Search listings..." style={{ flex: '1 1 200px' }} />
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input" style={{ flex: '0 1 160px' }}>
          <option value="">All Types</option>
          <option value="vehicle">Vehicles</option>
          <option value="parts">Parts</option>
        </select>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {[1,2,3].map(i => <div key={i} className="glass animate-pulse" style={{ height: '300px' }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass" style={{ padding: '48px 32px', textAlign: 'center' }}>
          <span style={{ fontSize: '48px', display: 'block', marginBottom: '12px' }}>🏪</span>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#e2e4e9', marginBottom: '8px' }}>No listings yet</h2>
          <p style={{ fontSize: '14px', color: '#8892a4', marginBottom: '20px' }}>Be the first to list something for sale!</p>
          <Link href="/marketplace/create" style={{ padding: '10px 24px', borderRadius: '8px', background: '#f97316', color: '#0c0c14', fontSize: '13px', fontWeight: 700 }}>List an Item</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {filtered.map(l => (
            <Link key={l.id} href={`/marketplace/${l.id}`} className="glass card-hover" style={{ overflow: 'hidden' }}>
              <div style={{ height: '180px', background: 'rgba(26,26,46,0.5)', position: 'relative' }}>
                {l.images && l.images.length > 0 ? (
                  <img src={l.images[0].image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px' }}>
                    {l.listing_type === 'vehicle' ? '🚗' : '🔧'}
                  </div>
                )}
                <span style={{ position: 'absolute', top: '10px', left: '10px', padding: '4px 10px', borderRadius: '4px', background: 'rgba(12,12,20,0.85)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: l.listing_type === 'vehicle' ? '#a78bfa' : '#fb923c' }}>
                  {l.listing_type}
                </span>
                {l.is_obo && (
                  <span style={{ position: 'absolute', top: '10px', right: '10px', padding: '4px 8px', borderRadius: '4px', background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.3)', fontSize: '10px', fontWeight: 700, color: '#22c55e' }}>OBO</span>
                )}
              </div>
              <div style={{ padding: '16px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#e2e4e9', marginBottom: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.title}</h3>
                <p style={{ fontSize: '22px', fontWeight: 700, color: '#22c55e', marginBottom: '8px' }}>${l.price.toLocaleString()}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#6b7280' }}>
                  <span>📍 {l.seller?.location || `${l.city}, ${l.state}` || 'Location N/A'}</span>
                  <span>💬 {l.comments?.length || 0}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(26,26,46,0.5)', backgroundImage: l.seller?.avatar_url ? `url(${l.seller.avatar_url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }} />
                  <span style={{ fontSize: '12px', color: '#8892a4' }}>@{l.seller?.username}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
