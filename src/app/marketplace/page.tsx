'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { getNearbyPrefs, filterByRadius } from '@/lib/nearbyFilter'

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

type Tab = 'items' | 'shops'

export default function MarketplacePage() {
  const supabase = createClient()
  const [tab, setTab] = useState<Tab>('items')
  const [listings, setListings] = useState<Listing[]>([])
  const [shops, setShops] = useState<Shop[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [nearbyState, setNearbyState] = useState<string | null>(null)

  useEffect(() => {
    const fetch = async () => {
      const prefs = await getNearbyPrefs(supabase)

      // Listings
      const lq = supabase
        .from('listings')
        .select('*, seller:profiles!listings_seller_id_fkey(username, display_name, avatar_url, location), images:listing_images(image_url), comments:listing_comments(id)')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(60)

      // Shops
      const sq = supabase
        .from('shops')
        .select('id, slug, name, description, city, state, specialties, logo_url, cover_image_url, lat, lng, vehicle_shops(id)')
        .order('name')

      const [lRes, sRes] = await Promise.all([lq, sq])
      let listingsData = (lRes.data || []) as unknown as Listing[]
      let shopsData = ((sRes.data || []) as any[]).map(s => ({ ...s, tag_count: s.vehicle_shops?.length || 0 }))

      if (prefs.filterMarketplace && prefs.userCoords) {
        listingsData = await filterByRadius(listingsData, prefs, l => ({ city: l.city ?? null, state: l.state ?? null }))
        shopsData = await filterByRadius(shopsData, prefs, s => ({ lat: s.lat ?? null, lng: s.lng ?? null, city: s.city, state: s.state }))
        setNearbyState(`${prefs.radius} mi of ${prefs.state}`)
      }

      setListings(listingsData)
      setShops(shopsData)
      setLoading(false)
    }
    fetch()
  }, [])

  const filteredListings = listings.filter(l => {
    if (typeFilter && l.listing_type !== typeFilter) return false
    if (filter && !l.title.toLowerCase().includes(filter.toLowerCase())) return false
    return true
  })

  const filteredShops = shops.filter(s =>
    !filter || s.name.toLowerCase().includes(filter.toLowerCase())
    || s.city?.toLowerCase().includes(filter.toLowerCase())
    || s.state?.toLowerCase().includes(filter.toLowerCase())
    || s.specialties?.some(t => t.toLowerCase().includes(filter.toLowerCase()))
  )

  const tabBtn = (key: Tab, label: string, count: number) => (
    <button
      onClick={() => setTab(key)}
      style={{
        padding: '10px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer',
        background: tab === key ? 'rgba(249,115,22,0.15)' : 'rgba(18,18,30,0.5)',
        color: tab === key ? '#fb923c' : '#9ca3af',
        fontWeight: 700, fontSize: '13px',
        outline: tab === key ? '1px solid rgba(249,115,22,0.35)' : '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', gap: '8px',
      }}
    >
      {label}
      <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: '10px' }}>{count}</span>
    </button>
  )

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '80px 32px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#e2e4e9' }}>Market<span style={{ color: '#fb923c' }}>place</span></h1>
          <p style={{ fontSize: '14px', color: '#8892a4', marginTop: '4px' }}>
            Buy and sell vehicles & parts, or find the shops working on builds{nearbyState && <> · filtered to <span style={{ color: '#fb923c' }}>{nearbyState}</span></>}
          </p>
        </div>
        <Link
          href={tab === 'items' ? '/marketplace/create' : '/shops/create'}
          style={{ padding: '10px 20px', borderRadius: '8px', background: '#f97316', border: '1px solid #fb923c', color: '#0c0c14', fontSize: '13px', fontWeight: 700 }}
        >
          + {tab === 'items' ? 'List Item' : 'Add Shop'}
        </Link>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {tabBtn('items', 'Items', listings.length)}
        {tabBtn('shops', 'Shops', shops.length)}
      </div>

      {/* Filters */}
      <div className="glass" style={{ padding: '16px', marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="input"
          placeholder={tab === 'items' ? 'Search listings...' : 'Search by name, city, state, or specialty...'}
          style={{ flex: '1 1 200px' }}
        />
        {tab === 'items' && (
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input" style={{ flex: '0 1 160px' }}>
            <option value="">All Types</option>
            <option value="vehicle">Vehicles</option>
            <option value="parts">Parts</option>
          </select>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {[1,2,3].map(i => <div key={i} className="glass animate-pulse" style={{ height: '300px' }} />)}
        </div>
      ) : tab === 'items' ? (
        filteredListings.length === 0 ? (
          <div className="glass" style={{ padding: '48px 32px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#e2e4e9', marginBottom: '8px' }}>No listings yet</h2>
            <p style={{ fontSize: '14px', color: '#8892a4', marginBottom: '20px' }}>Be the first to list something for sale!</p>
            <Link href="/marketplace/create" style={{ padding: '10px 24px', borderRadius: '8px', background: '#f97316', color: '#0c0c14', fontSize: '13px', fontWeight: 700 }}>List an Item</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {filteredListings.map(l => (
              <Link key={l.id} href={`/marketplace/${l.id}`} className="glass card-hover" style={{ overflow: 'hidden' }}>
                <div style={{ aspectRatio: '2 / 1', background: 'rgba(26,26,46,0.5)', position: 'relative' }}>
                  {l.images && l.images.length > 0 ? (
                    <img src={l.images[0].image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : null}
                  <span style={{ position: 'absolute', top: '10px', left: '10px', padding: '4px 10px', borderRadius: '4px', background: 'rgba(12,12,20,0.85)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: l.listing_type === 'vehicle' ? '#f97316' : '#fb923c' }}>
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
                    <span>{l.seller?.location || `${l.city}, ${l.state}` || 'Location N/A'}</span>
                    <span>{l.comments?.length || 0} comments</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(26,26,46,0.5)', backgroundImage: l.seller?.avatar_url ? `url(${l.seller.avatar_url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }} />
                    <span style={{ fontSize: '12px', color: '#8892a4' }}>@{l.seller?.username}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )
      ) : (
        filteredShops.length === 0 ? (
          <div className="glass" style={{ padding: '48px 32px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#e2e4e9', marginBottom: '8px' }}>No shops yet</h2>
            <p style={{ fontSize: '14px', color: '#8892a4', marginBottom: '20px' }}>Be the first to add a shop to The Scene.</p>
            <Link href="/shops/create" style={{ padding: '10px 24px', borderRadius: '8px', background: '#f97316', color: '#0c0c14', fontSize: '13px', fontWeight: 700 }}>Add a Shop</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {filteredShops.map(shop => (
              <Link key={shop.id} href={`/shops/${shop.slug}`} className="glass card-hover" style={{ overflow: 'hidden' }}>
                <div style={{ aspectRatio: '2 / 1', position: 'relative', overflow: 'hidden', background: 'rgba(26,26,46,0.5)' }}>
                  {shop.cover_image_url ? (
                    <img src={shop.cover_image_url} alt={shop.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(34,197,94,0.1), rgba(249,115,22,0.08))' }} />
                  )}
                  {shop.logo_url && (
                    <div style={{ position: 'absolute', bottom: '8px', left: '12px', width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', background: '#0c0c14', border: '2px solid rgba(255,255,255,0.06)' }}>
                      <img src={shop.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                  <span style={{ position: 'absolute', top: '10px', left: '10px', padding: '4px 10px', borderRadius: '4px', background: 'rgba(12,12,20,0.85)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#22c55e' }}>
                    Shop
                  </span>
                </div>
                <div style={{ padding: '16px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#e2e4e9', marginBottom: '4px' }}>{shop.name}</h3>
                  {shop.city && shop.state && (
                    <p style={{ fontSize: '12px', color: '#8892a4', marginBottom: '8px' }}>{shop.city}, {shop.state}</p>
                  )}
                  {shop.specialties && shop.specialties.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                      {shop.specialties.slice(0, 3).map((t, i) => (
                        <span key={i} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>{t}</span>
                      ))}
                    </div>
                  )}
                  <div style={{ fontSize: '12px', color: '#6b7280', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    {shop.tag_count} {shop.tag_count === 1 ? 'build' : 'builds'} tagged
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )
      )}
    </div>
  )
}
