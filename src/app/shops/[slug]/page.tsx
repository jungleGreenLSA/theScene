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
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '80px 16px 40px' }}>
      <Link href="/shops" className="text-muted-light hover:text-teal" style={{ fontSize: '13px', display: 'block', marginBottom: '20px' }}>&larr; Back to Shops</Link>

      <div className="panel glow-teal" style={{ overflow: 'hidden', marginBottom: '24px' }}>
        <div style={{ height: '220px', background: 'var(--color-surface-light)', position: 'relative', overflow: 'hidden' }}>
          {shop.cover_image_url ? (
            <img src={shop.cover_image_url} alt={shop.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(242,169,0,0.1), rgba(142,163,184,0.08))' }} />
          )}
        </div>
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
            {shop.logo_url && (
              <div style={{ width: '72px', height: '72px', borderRadius: '50%', overflow: 'hidden', background: 'var(--color-background)', border: '2px solid rgba(242,169,0,0.3)', marginTop: '-48px', position: 'relative', zIndex: 1, flexShrink: 0 }}>
                <img src={shop.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--color-foreground)' }}>{shop.name}</h1>
              {shop.city && shop.state && (
                <p style={{ fontSize: '14px', color: 'var(--color-muted-light)', marginTop: '4px' }}>{[shop.address, shop.city, shop.state, shop.zip_code].filter(Boolean).join(', ')}</p>
              )}
            </div>
          </div>

          {shop.description && (
            <p style={{ fontSize: '14px', color: 'var(--color-muted-light)', marginTop: '16px', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{shop.description}</p>
          )}

          {shop.specialties && shop.specialties.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '14px' }}>
              {shop.specialties.map((s: string) => (
                <span key={s} style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, padding: '4px 10px', borderRadius: '4px', background: 'rgba(242,169,0,0.08)', color: 'var(--color-accent)', border: '1px solid rgba(242,169,0,0.2)', fontFamily: 'var(--font-mono)' }}>{s}</span>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--color-border)', flexWrap: 'wrap' }}>
            {shop.website && <a href={shop.website} target="_blank" rel="noopener" style={{ fontSize: '13px', color: 'var(--color-accent)' }}>Website</a>}
            {shop.instagram_handle && <a href={`https://instagram.com/${shop.instagram_handle}`} target="_blank" rel="noopener" style={{ fontSize: '13px', color: 'var(--color-accent)' }}>@{shop.instagram_handle}</a>}
            {shop.phone && <a href={`tel:${shop.phone}`} style={{ fontSize: '13px', color: 'var(--color-accent)' }}>{shop.phone}</a>}
          </div>
        </div>
      </div>

      <div className="panel" style={{ padding: '24px' }}>
        <p className="eyebrow" style={{ marginBottom: '6px' }}>Tagged Builds</p>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-foreground)', marginBottom: '14px' }}>Builds tagged here <span className="spec">({tags?.length || 0})</span></h2>
        {!tags || tags.length === 0 ? (
          <p style={{ fontSize: '13px', color: 'var(--color-muted-light)' }}>No builds tagged yet. Members can tag this shop from their garage.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 240px), 1fr))', gap: '12px' }}>
            {tags.map((t: any) => {
              const v = t.vehicle
              if (!v?.owner) return null
              return (
                <Link key={t.id} href={`/user/${v.owner.username}/${v.slug}`} className="card-hover group" style={{ display: 'block', padding: '12px', borderRadius: '8px', background: 'var(--color-surface-lowest)', border: '1px solid var(--color-border)' }}>
                  <div style={{ aspectRatio: '2 / 1', borderRadius: '6px', overflow: 'hidden', background: 'var(--color-surface-light)', marginBottom: '10px' }}>
                    {v.primary_image_url ? (
                      <img src={v.primary_image_url} alt="" className="group-hover:scale-105 transition-transform duration-500" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : null}
                  </div>
                  <p className="spec group-hover:text-teal transition-colors" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-foreground)' }}>{v.year} {v.make} {v.model}</p>
                  {v.color && <p style={{ fontSize: '11px', color: 'var(--color-muted)' }}>{v.color}</p>}
                  <p style={{ fontSize: '11px', color: 'var(--color-steel-light)', marginTop: '4px' }}>by {v.owner.display_name || v.owner.username}</p>
                  {t.note && <p style={{ fontSize: '11px', color: 'var(--color-muted)', marginTop: '6px', fontStyle: 'italic' }}>&ldquo;{t.note}&rdquo;</p>}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
