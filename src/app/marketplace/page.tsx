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
        background: tab === key ? 'rgba(242,169,0,0.12)' : 'var(--color-surface-lowest)',
        color: tab === key ? 'var(--color-accent)' : 'var(--color-muted-light)',
        fontWeight: 700, fontSize: '13px',
        outline: tab === key ? '1px solid rgba(242,169,0,0.35)' : '1px solid var(--color-border)',
        display: 'flex', alignItems: 'center', gap: '8px',
      }}
    >
      {label}
      <span style={{ fontSize: '11px', background: 'var(--color-border)', padding: '2px 8px', borderRadius: '10px' }}>{count}</span>
    </button>
  )

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '80px 16px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <p className="eyebrow" style={{ marginBottom: '6px' }}>The Scene</p>
          <h1 style={{ fontSize: 'clamp(22px, 5vw, 28px)', fontWeight: 700, color: 'var(--color-foreground)' }}>Market<span className="gradient-text">place</span></h1>
          <p style={{ fontSize: '14px', color: 'var(--color-muted-light)', marginTop: '4px' }}>
            Buy and sell vehicles & parts, or find the shops working on builds{nearbyState && <> · filtered to <span style={{ color: 'var(--color-accent)' }}>{nearbyState}</span></>}
          </p>
        </div>
        <Link
          href={tab === 'items' ? '/marketplace/create' : '/shops/create'}
          className="btn-teal"
          style={{ fontSize: '13px', fontWeight: 700, whiteSpace: 'nowrap' }}
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
      <div className="panel" style={{ padding: '16px', marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '16px' }}>
          {[1,2,3].map(i => <div key={i} className="panel animate-pulse" style={{ height: '300px' }} />)}
        </div>
      ) : tab === 'items' ? (
        filteredListings.length === 0 ? (
          <div className="panel" style={{ padding: '48px 32px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-foreground)', marginBottom: '8px' }}>No listings yet</h2>
            <p style={{ fontSize: '14px', color: 'var(--color-muted-light)', marginBottom: '20px' }}>Be the first to list something for sale!</p>
            <Link href="/marketplace/create" className="btn-teal" style={{ fontSize: '13px', fontWeight: 700 }}>List an Item</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '16px' }}>
            {filteredListings.map(l => (
              <Link key={l.id} href={`/marketplace/${l.id}`} className="panel card-hover" style={{ overflow: 'hidden' }}>
                <div style={{ aspectRatio: '2 / 1', background: 'var(--color-surface-light)', position: 'relative' }}>
                  {l.images && l.images.length > 0 ? (
                    <img src={l.images[0].image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : null}
                  <span className={l.listing_type === 'vehicle' ? 'chip chip-purple' : 'chip'} style={{ position: 'absolute', top: '10px', left: '10px' }}>
                    {l.listing_type}
                  </span>
                  {l.is_obo && (
                    <span style={{ position: 'absolute', top: '10px', right: '10px', padding: '4px 8px', borderRadius: '4px', background: 'rgba(86,194,113,0.2)', border: '1px solid rgba(86,194,113,0.3)', fontSize: '10px', fontWeight: 700, color: 'var(--color-success)' }}>OBO</span>
                  )}
                </div>
                <div style={{ padding: '16px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-foreground)', marginBottom: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.title}</h3>
                  <p className="spec" style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-accent)', marginBottom: '8px' }}>${l.price.toLocaleString()}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--color-muted)' }}>
                    <span>{l.seller?.location || `${l.city}, ${l.state}` || 'Location N/A'}</span>
                    <span className="spec">{l.comments?.length || 0} comments</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--color-border)' }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--color-surface-light)', backgroundImage: l.seller?.avatar_url ? `url(${l.seller.avatar_url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }} />
                    <span style={{ fontSize: '12px', color: 'var(--color-muted-light)' }}>@{l.seller?.username}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )
      ) : (
        filteredShops.length === 0 ? (
          <div className="panel" style={{ padding: '48px 32px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-foreground)', marginBottom: '8px' }}>No shops yet</h2>
            <p style={{ fontSize: '14px', color: 'var(--color-muted-light)', marginBottom: '20px' }}>Be the first to add a shop to The Scene.</p>
            <Link href="/shops/create" className="btn-teal" style={{ fontSize: '13px', fontWeight: 700 }}>Add a Shop</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '16px' }}>
            {filteredShops.map(shop => (
              <Link key={shop.id} href={`/shops/${shop.slug}`} className="panel card-hover" style={{ overflow: 'hidden' }}>
                <div style={{ aspectRatio: '2 / 1', position: 'relative', overflow: 'hidden', background: 'var(--color-surface-light)' }}>
                  {shop.cover_image_url ? (
                    <img src={shop.cover_image_url} alt={shop.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(242,169,0,0.1), rgba(142,163,184,0.08))' }} />
                  )}
                  {shop.logo_url && (
                    <div style={{ position: 'absolute', bottom: '8px', left: '12px', width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', background: 'var(--color-background)', border: '2px solid var(--color-border)' }}>
                      <img src={shop.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                  <span className="chip" style={{ position: 'absolute', top: '10px', left: '10px' }}>
                    Shop
                  </span>
                </div>
                <div style={{ padding: '16px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-foreground)', marginBottom: '4px' }}>{shop.name}</h3>
                  {shop.city && shop.state && (
                    <p style={{ fontSize: '12px', color: 'var(--color-muted-light)', marginBottom: '8px' }}>{shop.city}, {shop.state}</p>
                  )}
                  {shop.specialties && shop.specialties.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                      {shop.specialties.slice(0, 3).map((t, i) => (
                        <span key={i} className="chip">{t}</span>
                      ))}
                    </div>
                  )}
                  <div style={{ fontSize: '12px', color: 'var(--color-muted)', paddingTop: '8px', borderTop: '1px solid var(--color-border)' }}>
                    <span className="spec">{shop.tag_count}</span> {shop.tag_count === 1 ? 'build' : 'builds'} tagged
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
