import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import GuestbookSection from '@/components/GuestbookSection'
import PropsButton from '@/components/PropsButton'
import ShareButton from '@/components/ShareButton'
import GarageQR from '@/components/GarageQR'
import BuildMatch from '@/components/BuildMatch'

export async function generateMetadata({ params }: { params: Promise<{ username: string; vehicle: string }> }) {
  const { username, vehicle } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase.from('profiles').select('id').eq('username', username).single()
  if (!profile) return { title: 'Not Found' }

  const { data: v } = await supabase.from('vehicles').select('id, year, make, model, color').eq('owner_id', profile.id).eq('slug', vehicle).single()
  if (!v) return { title: 'Not Found' }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thescene.fyi'
  const ogUrl = `${siteUrl}/api/og/vehicle/${v.id}`
  const title = `${v.year} ${v.make} ${v.model}${v.color ? ' — ' + v.color : ''}`
  const description = `Check out this ${v.year} ${v.make} ${v.model} on The Scene.`
  return {
    title,
    description,
    openGraph: { title, description, images: [ogUrl], type: 'website' },
    twitter: { card: 'summary_large_image', title, description, images: [ogUrl] },
  }
}

export default async function VehiclePage({ params }: { params: Promise<{ username: string; vehicle: string }> }) {
  const { username, vehicle: vehicleSlug } = await params
  const supabase = await createClient()

  // Get profile
  const { data: profile } = await supabase.from('profiles').select('*').eq('username', username).single()
  if (!profile) return notFound()

  // Get vehicle
  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('*')
    .eq('owner_id', profile.id)
    .eq('slug', vehicleSlug)
    .single()
  if (!vehicle) return notFound()

  // Get mods
  const { data: mods } = await supabase
    .from('vehicle_modifications')
    .select('*')
    .eq('vehicle_id', vehicle.id)
    .order('category')
    .order('sort_order')

  // Get images
  const { data: images } = await supabase
    .from('vehicle_images')
    .select('*')
    .eq('vehicle_id', vehicle.id)
    .order('sort_order')

  // Get tagged shops
  const { data: taggedShops } = await supabase
    .from('vehicle_shops')
    .select('id, shop:shops(id, slug, name, city, state, logo_url)')
    .eq('vehicle_id', vehicle.id)

  // Get guestbook
  const { data: guestbook } = await supabase
    .from('guestbook_entries')
    .select(`
      *,
      author:profiles(username, display_name, avatar_url)
    `)
    .eq('vehicle_id', vehicle.id)
    .eq('is_hidden', false)
    .order('created_at', { ascending: false })
    .limit(20)

  // Get similar builds (same make & model, different vehicle)
  const { data: similarBuilds } = await supabase
    .from('vehicles')
    .select(`
      *,
      owner:profiles(username, display_name, avatar_url)
    `)
    .eq('make', vehicle.make)
    .eq('model', vehicle.model)
    .eq('is_public', true)
    .neq('id', vehicle.id)
    .order('props_count', { ascending: false })
    .limit(4)

  // Increment view count
  await supabase.rpc('increment_vehicle_views', { vehicle_uuid: vehicle.id })

  // Group mods by category
  const modsByCategory: Record<string, typeof mods> = {}
  mods?.forEach((mod) => {
    if (!modsByCategory[mod.category]) modsByCategory[mod.category] = []
    modsByCategory[mod.category]!.push(mod)
  })

  const categoryLabels: Record<string, string> = {
    engine: 'Engine',
    exhaust: 'Exhaust',
    forced_induction: 'Forced Induction',
    suspension: 'Suspension',
    brakes: 'Brakes',
    wheels_tires: 'Wheels & Tires',
    exterior: 'Exterior',
    interior: 'Interior',
    audio_electronics: 'Audio & Electronics',
    tuning: 'Tuning',
    other: 'Other',
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '80px 32px 40px' }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: '14px', color: '#555555', marginBottom: '20px' }}>
        <Link href={`/user/${username}`} style={{ color: '#666666' }}>@{username}</Link>
        <span style={{ margin: '0 8px' }}>/</span>
        <span style={{ color: '#1a1a1a' }}>{vehicle.year} {vehicle.make} {vehicle.model}</span>
      </div>

      {/* Hero card */}
      <div className="glass glow-purple" style={{ overflow: 'hidden', marginBottom: '24px' }}>
        <div style={{ aspectRatio: '2 / 1', background: '#e4e4e4', position: 'relative', overflow: 'hidden' }}>
          {(vehicle.primary_image_url || (images && images.length > 0)) ? (
            <img src={vehicle.primary_image_url || images?.[0]?.image_url} alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : null}
          <span style={{ position: 'absolute', top: '16px', right: '16px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, padding: '6px 14px', borderRadius: '20px', background: '#ffffff', color: 'var(--color-link)', border: '1px solid rgba(95, 168, 221, 0.3)' }}>
            {vehicle.build_status?.replace('_', ' ')}
          </span>
        </div>

        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1a1a1a' }}>
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h1>
              <p style={{ fontSize: '16px', color: 'var(--color-link)', marginTop: '4px' }}>{vehicle.color}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <PropsButton targetType="vehicle" targetId={vehicle.id} initialCount={vehicle.props_count || 0} />
              <ShareButton url={`/user/${username}/${vehicleSlug}`} title={`${vehicle.year} ${vehicle.make} ${vehicle.model}`} text={`Check out this ${vehicle.year} ${vehicle.make} ${vehicle.model} on The Scene`} small />
              <span style={{ fontSize: '13px', color: '#555555' }}>{vehicle.view_count || 0} views</span>
              <GarageQR username={username} vehicleSlug={vehicleSlug} vehicleId={vehicle.id} />
            </div>
          </div>

          {/* Owner */}
          <Link href={`/user/${username}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e4e4e4' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', background: '#e4e4e4', backgroundImage: profile.avatar_url ? `url(${profile.avatar_url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {!profile.avatar_url && <span style={{ fontSize: '14px', color: '#555555' }}>{profile.username.charAt(0).toUpperCase()}</span>}
            </div>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a1a' }}>{profile.display_name || profile.username}</p>
              <p style={{ fontSize: '12px', color: '#666666' }}>@{profile.username} {profile.location && `· ${profile.location}`}</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Specs grid */}
      <div className="glass" style={{ padding: '24px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a1a', marginBottom: '14px' }}>Specs</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 140px), 1fr))', gap: '10px' }}>
          {[
            { label: 'Year', value: vehicle.year },
            { label: 'Make', value: vehicle.make },
            { label: 'Model', value: vehicle.model },
            { label: 'Trim', value: vehicle.trim },
            { label: 'Color', value: vehicle.color },
            { label: 'Engine', value: vehicle.engine },
            { label: 'Transmission', value: vehicle.transmission },
            { label: 'Drivetrain', value: vehicle.drivetrain },
            { label: 'Horsepower', value: vehicle.horsepower },
            { label: 'Mileage', value: vehicle.mileage },
          ].filter(s => s.value).map((spec) => (
            <div key={spec.label} style={{ padding: '12px', background: '#f0f0f0', borderRadius: '8px' }}>
              <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--color-link)', fontWeight: 600 }}>{spec.label}</p>
              <p style={{ fontSize: '14px', fontWeight: 500, color: '#1a1a1a', marginTop: '2px' }}>{spec.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* About */}
      {vehicle.bio && (
        <div className="glass" style={{ padding: '24px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a1a', marginBottom: '12px' }}>About This Build</h2>
          <p style={{ fontSize: '14px', color: '#555555', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{vehicle.bio}</p>
        </div>
      )}

      {/* Gallery */}
      {images && images.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a1a', marginBottom: '14px' }}>Gallery</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 200px), 1fr))', gap: '10px' }}>
            {images.map((img) => (
              <div key={img.id} style={{ borderRadius: '8px', overflow: 'hidden', background: '#e4e4e4', aspectRatio: '2 / 1' }}>
                <img src={img.image_url} alt={img.caption || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modifications */}
      {Object.keys(modsByCategory).length > 0 && (
        <div className="glass" style={{ padding: '24px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a1a', marginBottom: '16px' }}>Modifications</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {Object.entries(modsByCategory).map(([category, items]) => (
              <div key={category}>
                <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-link)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '8px' }}>
                  {categoryLabels[category] || category}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {items?.map((mod) => (
                    <div key={mod.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '14px', color: '#555555' }}>
                      <span style={{ color: 'var(--color-link)', marginTop: '2px' }}>•</span>
                      <span>
                        {mod.brand && <strong style={{ color: '#1a1a1a' }}>{mod.brand}</strong>} {mod.item}
                        {mod.notes && <span style={{ color: '#555555', marginLeft: '4px' }}>— {mod.notes}</span>}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tagged Shops */}
      {taggedShops && taggedShops.length > 0 && (
        <div className="glass" style={{ padding: '24px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a1a', marginBottom: '14px' }}>Shops Tagged</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {taggedShops.map((t: any) => (
              t.shop && (
                <Link key={t.id} href={`/shops/${t.shop.slug}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
                  {t.shop.logo_url && <img src={t.shop.logo_url} alt={`${t.shop.name} logo`} style={{ width: '28px', height: '28px', borderRadius: '4px', objectFit: 'cover' }} />}
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-success)' }}>{t.shop.name}</p>
                    {t.shop.city && <p style={{ fontSize: '11px', color: '#555555' }}>{t.shop.city}, {t.shop.state}</p>}
                  </div>
                </Link>
              )
            ))}
          </div>
        </div>
      )}

      {/* Guestbook */}
      <GuestbookSection vehicleId={vehicle.id} entries={guestbook || []} />

      {/* Build Matches */}
      <BuildMatch vehicleId={vehicle.id} />

      {/* Similar Builds */}
      {similarBuilds && similarBuilds.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a1a', marginBottom: '14px' }}>Similar {vehicle.make} {vehicle.model} Builds</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: '12px' }}>
            {similarBuilds.map((sim) => (
              <Link key={sim.id} href={`/user/${sim.owner?.username}/${sim.slug}`} className="glass card-hover" style={{ display: 'flex', overflow: 'hidden' }}>
                <div style={{ width: '160px', aspectRatio: '2 / 1', background: '#e4e4e4', flexShrink: 0, overflow: 'hidden' }}>
                  {sim.primary_image_url ? (
                    <img src={sim.primary_image_url} alt={`${sim.year} ${sim.make} ${sim.model}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : null}
                </div>
                <div style={{ padding: '14px', flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sim.year} {sim.make} {sim.model}</h3>
                  <p style={{ fontSize: '12px', color: '#666666', marginTop: '2px' }}>{sim.color} {sim.horsepower && `· ${sim.horsepower}`}</p>
                  <p style={{ fontSize: '11px', color: '#555555', marginTop: '4px' }}>by @{sim.owner?.username}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                    <span style={{ fontSize: '11px', color: '#666666' }}>{sim.props_count || 0} Props</span>
                    <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(44, 121, 196, 0.1)', color: 'var(--color-link)' }}>{sim.build_status?.replace('_', ' ')}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
