import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import GuestbookSection from '@/components/GuestbookSection'
import PropsButton from '@/components/PropsButton'
import GarageQR from '@/components/GarageQR'

export async function generateMetadata({ params }: { params: Promise<{ username: string; vehicle: string }> }) {
  const { username, vehicle } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase.from('profiles').select('id').eq('username', username).single()
  if (!profile) return { title: 'Not Found' }

  const { data: v } = await supabase.from('vehicles').select('year, make, model, color').eq('owner_id', profile.id).eq('slug', vehicle).single()
  if (!v) return { title: 'Not Found' }

  return {
    title: `${v.year} ${v.make} ${v.model} - ${v.color}`,
    description: `Check out this ${v.year} ${v.make} ${v.model} in ${v.color} on The Scene.`,
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
    engine: '🔧 Engine',
    exhaust: '💨 Exhaust',
    forced_induction: '⚡ Forced Induction',
    suspension: '🔩 Suspension',
    brakes: '🛑 Brakes',
    wheels_tires: '🛞 Wheels & Tires',
    exterior: '🎨 Exterior',
    interior: '🪑 Interior',
    audio_electronics: '🔊 Audio & Electronics',
    tuning: '📊 Tuning',
    other: '📦 Other',
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="text-sm text-muted mb-6">
        <Link href={`/user/${username}`} className="hover:text-purple-light">@{username}</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{vehicle.year} {vehicle.make} {vehicle.model}</span>
      </div>

      {/* Hero card */}
      <div className="glass overflow-hidden mb-8 glow-purple">
        <div className="h-80 md:h-[450px] bg-surface-light relative overflow-hidden">
          {vehicle.primary_image_url ? (
            <img
              src={vehicle.primary_image_url}
              alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-6xl">🚗</span>
            </div>
          )}
          <span className="absolute top-4 right-4 text-xs uppercase tracking-wider font-bold px-3 py-1.5 rounded-full bg-background/80 text-neon-light border border-neon/30">
            {vehicle.build_status?.replace('_', ' ')}
          </span>
        </div>

        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h1>
              <p className="text-lg text-purple-light mt-1">{vehicle.color}</p>
            </div>
            <div className="flex items-center gap-4" style={{ flexWrap: 'wrap' }}>
              <PropsButton vehicleId={vehicle.id} initialCount={vehicle.props_count || 0} />
              <div className="text-sm text-muted">
                👁 {vehicle.view_count || 0} views
              </div>
              <GarageQR username={username} vehicleSlug={vehicleSlug} />
            </div>
          </div>

          {/* Owner */}
          <Link href={`/user/${username}`} className="flex items-center gap-3 mt-6 pt-4 border-t border-border">
            <div className="w-10 h-10 rounded-full bg-surface-light overflow-hidden flex items-center justify-center">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm text-muted">{profile.username.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground hover:text-purple-light">{profile.display_name || profile.username}</p>
              <p className="text-xs text-muted-light">@{profile.username} {profile.location && `• ${profile.location}`}</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Specs grid */}
      <div className="glass p-6 mb-8">
        <h2 className="text-lg font-bold text-foreground mb-4">📋 Specs</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
            <div key={spec.label} className="bg-surface rounded-lg p-3">
              <p className="text-[10px] uppercase tracking-wider text-purple-light font-semibold">{spec.label}</p>
              <p className="text-sm font-medium text-foreground mt-0.5">{spec.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* About */}
      {vehicle.bio && (
        <div className="glass p-6 mb-8">
          <h2 className="text-lg font-bold text-foreground mb-3">📝 About This Build</h2>
          <p className="text-muted-light leading-relaxed whitespace-pre-wrap">{vehicle.bio}</p>
        </div>
      )}

      {/* Gallery */}
      {images && images.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-foreground mb-4">📸 Gallery</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {images.map((img) => (
              <div key={img.id} className="rounded-lg overflow-hidden bg-surface-light aspect-video">
                <img src={img.image_url} alt={img.caption || ''} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modifications */}
      {Object.keys(modsByCategory).length > 0 && (
        <div className="glass p-6 mb-8">
          <h2 className="text-lg font-bold text-foreground mb-4">🔧 Modifications</h2>
          <div className="space-y-6">
            {Object.entries(modsByCategory).map(([category, items]) => (
              <div key={category}>
                <h3 className="text-sm font-bold text-neon-light uppercase tracking-wider mb-2">
                  {categoryLabels[category] || category}
                </h3>
                <ul className="space-y-1.5">
                  {items?.map((mod) => (
                    <li key={mod.id} className="flex items-start gap-2 text-sm text-muted-light">
                      <span className="text-purple-light mt-1">•</span>
                      <span>
                        {mod.brand && <strong className="text-foreground">{mod.brand}</strong>} {mod.item}
                        {mod.notes && <span className="text-muted ml-1">— {mod.notes}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Guestbook */}
      <GuestbookSection vehicleId={vehicle.id} entries={guestbook || []} />

      {/* Similar Builds */}
      {similarBuilds && similarBuilds.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-bold text-foreground mb-4">🔍 Similar {vehicle.make} {vehicle.model} Builds</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {similarBuilds.map((sim) => (
              <Link
                key={sim.id}
                href={`/user/${sim.owner?.username}/${sim.slug}`}
                className="glass overflow-hidden card-hover group flex"
              >
                <div className="w-28 h-28 bg-surface-light flex-shrink-0 overflow-hidden">
                  {sim.primary_image_url ? (
                    <img src={sim.primary_image_url} alt={`${sim.year} ${sim.make} ${sim.model}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><span className="text-2xl">🚗</span></div>
                  )}
                </div>
                <div className="p-4 flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-foreground group-hover:text-purple-light transition-colors truncate">
                    {sim.year} {sim.make} {sim.model}
                  </h3>
                  <p className="text-xs text-muted-light mt-0.5">{sim.color} {sim.horsepower && `• ${sim.horsepower}`}</p>
                  <p className="text-xs text-muted mt-1">by @{sim.owner?.username}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted">
                    <span>🤙 {sim.props_count || 0}</span>
                    <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-purple/10 text-purple-light">
                      {sim.build_status?.replace('_', ' ')}
                    </span>
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
