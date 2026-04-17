import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: shop } = await supabase.from('shops').select('name').eq('slug', slug).single()
  if (!shop) return { title: 'Not Found' }
  return { title: `${shop.name} - Shop` }
}

export default async function ShopDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: shop } = await supabase.from('shops').select('*').eq('slug', slug).single()
  if (!shop) return notFound()

  const { data: tags } = await supabase
    .from('vehicle_shops')
    .select('id, note, created_at, vehicle:vehicles(slug, year, make, model, color, primary_image_url, owner:profiles!owner_id(username, display_name, avatar_url))')
    .eq('shop_id', shop.id)
    .order('created_at', { ascending: false })

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '80px 32px 40px' }}>
      <Link href="/shops" style={{ fontSize: '13px', color: '#8892a4', display: 'block', marginBottom: '20px' }}>&larr; Back to Shops</Link>

      <div className="glass" style={{ overflow: 'hidden', marginBottom: '24px' }}>
        <div style={{ height: '220px', background: 'rgba(26,26,46,0.5)', position: 'relative', overflow: 'hidden' }}>
          {shop.cover_image_url ? (
            <img src={shop.cover_image_url} alt={shop.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(34,197,94,0.1), rgba(249,115,22,0.08))' }}>
              <span style={{ fontSize: '64px' }}>🔧</span>
            </div>
          )}
        </div>
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
            {shop.logo_url && (
              <div style={{ width: '72px', height: '72px', borderRadius: '12px', overflow: 'hidden', background: '#0c0c14', border: '2px solid rgba(34,197,94,0.3)', marginTop: '-48px', position: 'relative', zIndex: 1, flexShrink: 0 }}>
                <img src={shop.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#e2e4e9' }}>{shop.name}</h1>
              {shop.city && shop.state && (
                <p style={{ fontSize: '14px', color: '#8892a4', marginTop: '4px' }}>📍 {[shop.address, shop.city, shop.state, shop.zip_code].filter(Boolean).join(', ')}</p>
              )}
            </div>
          </div>

          {shop.description && (
            <p style={{ fontSize: '14px', color: '#9ca3af', marginTop: '16px', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{shop.description}</p>
          )}

          {shop.specialties && shop.specialties.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '14px' }}>
              {shop.specialties.map((s: string) => (
                <span key={s} style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, padding: '4px 10px', borderRadius: '4px', background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}>{s}</span>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap' }}>
            {shop.website && <a href={shop.website} target="_blank" rel="noopener" style={{ fontSize: '13px', color: '#a78bfa' }}>🌐 Website</a>}
            {shop.instagram_handle && <a href={`https://instagram.com/${shop.instagram_handle}`} target="_blank" rel="noopener" style={{ fontSize: '13px', color: '#a78bfa' }}>📸 @{shop.instagram_handle}</a>}
            {shop.phone && <a href={`tel:${shop.phone}`} style={{ fontSize: '13px', color: '#a78bfa' }}>📞 {shop.phone}</a>}
          </div>
        </div>
      </div>

      <div className="glass" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#e2e4e9', marginBottom: '14px' }}>🏁 Builds tagged here ({tags?.length || 0})</h2>
        {!tags || tags.length === 0 ? (
          <p style={{ fontSize: '13px', color: '#8892a4' }}>No builds tagged yet. Members can tag this shop from their garage.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
            {tags.map((t: any) => {
              const v = t.vehicle
              if (!v?.owner) return null
              return (
                <Link key={t.id} href={`/user/${v.owner.username}/${v.slug}`} style={{ display: 'block', padding: '12px', borderRadius: '8px', background: 'rgba(18,18,30,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ height: '120px', borderRadius: '6px', overflow: 'hidden', background: 'rgba(26,26,46,0.5)', marginBottom: '10px' }}>
                    {v.primary_image_url ? (
                      <img src={v.primary_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: '28px' }}>🏁</span></div>
                    )}
                  </div>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#e2e4e9' }}>{v.year} {v.make} {v.model}</p>
                  {v.color && <p style={{ fontSize: '11px', color: '#6b7280' }}>{v.color}</p>}
                  <p style={{ fontSize: '11px', color: '#a78bfa', marginTop: '4px' }}>by {v.owner.display_name || v.owner.username}</p>
                  {t.note && <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '6px', fontStyle: 'italic' }}>&ldquo;{t.note}&rdquo;</p>}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
