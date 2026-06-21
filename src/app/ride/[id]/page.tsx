import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: v } = await supabase.from('vehicles').select('year, make, model, color').eq('id', id).single()
  if (!v) return { title: 'Ride Not Found' }
  return {
    title: `${v.year} ${v.make} ${v.model} - ${v.color} | The Scene`,
    description: `Check out this ${v.year} ${v.make} ${v.model} in ${v.color} on The Scene -- the car community, reimagined.`,
  }
}

export default async function PublicRidePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: vehicle } = await supabase.from('vehicles').select('*').eq('id', id).single()
  if (!vehicle) return notFound()

  const { data: owner } = await supabase.from('profiles').select('username, display_name, avatar_url, location').eq('id', vehicle.owner_id).single()
  const { data: images } = await supabase.from('vehicle_images').select('image_url').eq('vehicle_id', id).order('sort_order').limit(10)
  const { data: mods } = await supabase.from('vehicle_modifications').select('category, item, brand').eq('vehicle_id', id).order('category')

  // Increment view
  await supabase.rpc('increment_vehicle_views', { vehicle_uuid: id })

  const specItems = [
    { label: 'Year', value: vehicle.year },
    { label: 'Make', value: vehicle.make },
    { label: 'Model', value: vehicle.model },
    { label: 'Color', value: vehicle.color },
    { label: 'Engine', value: vehicle.engine },
    { label: 'Horsepower', value: vehicle.horsepower },
    { label: 'Transmission', value: vehicle.transmission },
    { label: 'Drivetrain', value: vehicle.drivetrain },
    { label: 'Mileage', value: vehicle.mileage },
    { label: 'Body', value: vehicle.trim },
  ].filter(s => s.value)

  // Group mods by category for spec-sheet layout
  type Mod = { category: string; item: string; brand: string }
  const modsByCategory: Record<string, Mod[]> = {}
  if (mods) {
    for (const mod of mods) {
      if (!modsByCategory[mod.category]) modsByCategory[mod.category] = []
      modsByCategory[mod.category]!.push(mod)
    }
  }

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '24px', minHeight: '100vh' }}>
      {/* Header with logo */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <Image src="/images/logo.png" alt="The Scene" width={60} height={60} style={{ margin: '0 auto 12px', borderRadius: '50%' }} />
        <p className="eyebrow">THE SCENE</p>
      </div>

      {/* Hero Image */}
      <div className="glass" style={{ overflow: 'hidden', marginBottom: '20px' }}>
        <div style={{ height: '300px', background: 'rgba(26,26,46,0.5)', position: 'relative' }}>
          {(vehicle.primary_image_url || (images && images.length > 0)) ? (
            <img src={vehicle.primary_image_url || images?.[0]?.image_url} alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : null}
          {/* build_status chip: purple kept as decorative secondary identity badge */}
          <span className="chip chip-purple" style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(12,12,20,0.85)', textTransform: 'capitalize' }}>
            {vehicle.build_status?.replace(/_/g, ' ')}
          </span>
        </div>

        <div style={{ padding: '24px' }}>
          <h1 style={{ fontSize: 'clamp(22px, 5vw, 28px)', fontWeight: 700, color: '#e4e1ed', marginBottom: '4px' }}>
            <span className="spec" style={{ fontSize: '0.65em', color: '#9ca3af', letterSpacing: '0.05em', display: 'block', marginBottom: '2px' }}>{vehicle.year}</span>
            {vehicle.make} {vehicle.model}
          </h1>
          <p className="spec" style={{ fontSize: '16px', color: '#2dd4bf', marginTop: '4px' }}>{vehicle.color}</p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '16px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>
              <span className="spec" style={{ color: '#e4e1ed' }}>{vehicle.props_count || 0}</span>
              <span style={{ marginLeft: '4px' }}>props</span>
            </span>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>
              <span className="spec" style={{ color: '#e4e1ed' }}>{vehicle.view_count || 0}</span>
              <span style={{ marginLeft: '4px' }}>views</span>
            </span>
          </div>

          {/* Owner */}
          {owner && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(26,26,46,0.5)', backgroundImage: owner.avatar_url ? `url(${owner.avatar_url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(255,255,255,0.08)' }}>
                {!owner.avatar_url && <span style={{ fontSize: '16px', color: '#2dd4bf', fontWeight: 700 }}>{owner.username?.charAt(0).toUpperCase()}</span>}
              </div>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#e4e1ed' }}>{owner.display_name || owner.username}</p>
                <p style={{ fontSize: '12px', color: '#9ca3af' }}>
                  <span className="spec">@{owner.username}</span>
                  {owner.location && <span style={{ marginLeft: '6px' }}>· {owner.location}</span>}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bio */}
      {vehicle.bio && (
        <div className="glass" style={{ padding: '24px', marginBottom: '20px' }}>
          <h2 className="eyebrow" style={{ marginBottom: '12px' }}>About This Build</h2>
          <p style={{ fontSize: '14px', color: '#9ca3af', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{vehicle.bio}</p>
        </div>
      )}

      {/* Specs */}
      {specItems.length > 0 && (
        <div className="glass" style={{ padding: '24px', marginBottom: '20px' }}>
          <h2 className="eyebrow" style={{ marginBottom: '14px' }}>Specs</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 140px), 1fr))', gap: '8px' }}>
            {specItems.map(s => (
              <div key={s.label} style={{ padding: '12px', background: 'rgba(18,18,30,0.6)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="eyebrow" style={{ marginBottom: '4px', fontSize: '9px' }}>{s.label}</p>
                <p className="spec" style={{ color: '#e4e1ed', fontSize: '13px' }}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gallery */}
      {images && images.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h2 className="eyebrow" style={{ marginBottom: '14px' }}>Gallery</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 200px), 1fr))', gap: '8px' }}>
            {images.map((img, i) => (
              <div key={i} style={{ borderRadius: '8px', overflow: 'hidden', background: 'rgba(26,26,46,0.5)', aspectRatio: '3 / 2' }}>
                <img src={img.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mods — grouped by category for spec-sheet feel */}
      {mods && mods.length > 0 && (
        <div className="glass" style={{ padding: '24px', marginBottom: '20px' }}>
          <h2 className="eyebrow" style={{ marginBottom: '14px' }}>Modifications</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {Object.entries(modsByCategory).map(([category, catMods]) => (
              <div key={category}>
                <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#2dd4bf', fontFamily: 'var(--font-mono, monospace)', marginBottom: '6px' }}>{category}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {catMods!.map((mod, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: '#9ca3af', paddingLeft: '8px' }}>
                      <span style={{ color: 'rgba(45,212,191,0.5)', marginTop: '3px', flexShrink: 0 }}>—</span>
                      <span>
                        {mod.brand && <span className="spec" style={{ color: '#e4e1ed', marginRight: '4px' }}>{mod.brand}</span>}
                        {mod.item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="glass glow-teal" style={{ padding: '32px', textAlign: 'center', border: '1px solid rgba(45,212,191,0.2)' }}>
        <Image src="/images/logo.png" alt="The Scene" width={48} height={48} style={{ margin: '0 auto 16px', borderRadius: '50%' }} />
        <h2 style={{ fontSize: 'clamp(17px, 4vw, 20px)', fontWeight: 700, color: '#e4e1ed', marginBottom: '8px' }}>
          Want to show off <span className="gradient-text">your</span> build?
        </h2>
        <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '24px', lineHeight: 1.6 }}>
          The Scene is the car community, reimagined. Build your garage, connect with enthusiasts, and discover events near you.
        </p>
        <Link href="/pricing" className="btn-primary" style={{ display: 'inline-flex', padding: '14px 32px', fontSize: '14px' }}>
          Join The Scene &mdash; It&apos;s Free
        </Link>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <p style={{ fontSize: '11px', color: '#6b7280' }}>Powered by <span style={{ color: '#2dd4bf' }}>The Scene</span> · thescene.fyi</p>
      </div>
    </div>
  )
}
