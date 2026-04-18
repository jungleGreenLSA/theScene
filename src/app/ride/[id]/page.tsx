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

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '24px', minHeight: '100vh' }}>
      {/* Header with logo */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <Image src="/images/logo.png" alt="The Scene" width={60} height={60} style={{ margin: '0 auto 12px', borderRadius: '50%' }} />
        <p style={{ fontSize: '11px', color: '#666666', textTransform: 'uppercase', letterSpacing: '2px' }}>THE SCENE</p>
      </div>

      {/* Hero Image */}
      <div className="glass" style={{ overflow: 'hidden', marginBottom: '20px' }}>
        <div style={{ height: '300px', background: '#e4e4e4', position: 'relative' }}>
          {(vehicle.primary_image_url || (images && images.length > 0)) ? (
            <img src={vehicle.primary_image_url || images?.[0]?.image_url} alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : null}
          <span style={{ position: 'absolute', top: '12px', right: '12px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', padding: '5px 14px', borderRadius: '20px', background: '#ffffff', color: '#90caf9', border: '1px solid rgba(95, 168, 221, 0.3)' }}>
            {vehicle.build_status?.replace('_', ' ')}
          </span>
        </div>

        <div style={{ padding: '24px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1a1a1a', marginBottom: '4px' }}>
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h1>
          <p style={{ fontSize: '18px', color: '#5fa8dd' }}>{vehicle.color}</p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '16px', fontSize: '14px', color: '#666666' }}>
            <span>{vehicle.props_count || 0} props</span>
            <span>{vehicle.view_count || 0} views</span>
          </div>

          {/* Owner */}
          {owner && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e4e4e4' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e4e4e4', backgroundImage: owner.avatar_url ? `url(${owner.avatar_url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {!owner.avatar_url && <span style={{ fontSize: '14px', color: '#555555' }}>{owner.username?.charAt(0).toUpperCase()}</span>}
              </div>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a1a' }}>{owner.display_name || owner.username}</p>
                <p style={{ fontSize: '12px', color: '#666666' }}>@{owner.username} {owner.location && `· ${owner.location}`}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bio */}
      {vehicle.bio && (
        <div className="glass" style={{ padding: '24px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a1a', marginBottom: '12px' }}>About This Build</h2>
          <p style={{ fontSize: '14px', color: '#555555', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{vehicle.bio}</p>
        </div>
      )}

      {/* Specs */}
      {specItems.length > 0 && (
        <div className="glass" style={{ padding: '24px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a1a', marginBottom: '14px' }}>Specs</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 140px), 1fr))', gap: '10px' }}>
            {specItems.map(s => (
              <div key={s.label} style={{ padding: '12px', background: '#f0f0f0', borderRadius: '8px' }}>
                <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#5fa8dd', fontWeight: 600 }}>{s.label}</p>
                <p style={{ fontSize: '14px', fontWeight: 500, color: '#1a1a1a', marginTop: '2px' }}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gallery */}
      {images && images.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a1a', marginBottom: '14px' }}>Gallery</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 200px), 1fr))', gap: '10px' }}>
            {images.map((img, i) => (
              <div key={i} style={{ borderRadius: '8px', overflow: 'hidden', background: '#e4e4e4', aspectRatio: '2 / 1' }}>
                <img src={img.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mods */}
      {mods && mods.length > 0 && (
        <div className="glass" style={{ padding: '24px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a1a', marginBottom: '14px' }}>Modifications</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {mods.map((mod, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '14px', color: '#555555' }}>
                <span style={{ color: '#5fa8dd', marginTop: '2px' }}>•</span>
                <span>{mod.brand && <strong style={{ color: '#1a1a1a' }}>{mod.brand}</strong>} {mod.item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="glass" style={{ padding: '32px', textAlign: 'center', border: '1px solid rgba(44, 121, 196, 0.2)' }}>
        <Image src="/images/logo.png" alt="The Scene" width={48} height={48} style={{ margin: '0 auto 16px', borderRadius: '50%' }} />
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1a1a1a', marginBottom: '8px' }}>
          Want to show off <span style={{ color: '#90caf9' }}>your</span> build?
        </h2>
        <p style={{ fontSize: '14px', color: '#666666', marginBottom: '20px', lineHeight: 1.6 }}>
          The Scene is the car community, reimagined. Build your garage, connect with enthusiasts, and discover events near you.
        </p>
        <Link href="/pricing" style={{ display: 'inline-block', padding: '14px 32px', borderRadius: '8px', background: '#5fa8dd', border: '1px solid #90caf9', color: '#0c0c14', fontSize: '14px', fontWeight: 700 }}>
          Join The Scene -- It&apos;s Free
        </Link>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e4e4e4' }}>
        <p style={{ fontSize: '11px', color: '#555555' }}>Powered by <span style={{ color: '#5fa8dd' }}>The Scene</span> · thescene.fyi</p>
      </div>
    </div>
  )
}
