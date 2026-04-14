import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import UserActions from '@/components/UserActions'

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  return { title: `@${username}` }
}

export default async function UserProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()

  if (!profile) return notFound()

  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('*')
    .eq('owner_id', profile.id)
    .eq('is_public', true)
    .order('is_primary', { ascending: false })

  const { data: followers } = await supabase
    .from('follows')
    .select('id')
    .eq('following_id', profile.id)

  const { data: following } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', profile.id)

  const { data: eventsAttended } = await supabase
    .from('event_rsvps')
    .select('id')
    .eq('user_id', profile.id)

  // Calculate total props across all vehicles
  const totalProps = vehicles?.reduce((sum, v) => sum + (v.props_count || 0), 0) || 0
  const totalViews = vehicles?.reduce((sum, v) => sum + (v.view_count || 0), 0) || 0

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Profile header */}
      <div className="glass p-8 mb-8">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-surface-light border-2 border-purple/30 overflow-hidden flex items-center justify-center">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl text-muted">{profile.username.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="text-center md:text-left flex-1">
            <h1 className="text-2xl font-bold text-foreground">{profile.display_name || profile.username}</h1>
            <p className="text-purple-light text-sm">@{profile.username}</p>
            {profile.location && (
              <p className="text-muted-light text-sm mt-1">📍 {profile.location}</p>
            )}
            {profile.bio && (
              <p className="text-muted-light mt-3 max-w-lg">{profile.bio}</p>
            )}
            <div className="flex flex-wrap items-center gap-4 mt-4 justify-center md:justify-start">
              <span className="text-sm"><strong className="text-foreground">{followers?.length || 0}</strong> <span className="text-muted-light">followers</span></span>
              <span className="text-sm"><strong className="text-foreground">{following?.length || 0}</strong> <span className="text-muted-light">following</span></span>
              <span className="text-sm"><strong className="text-foreground">{vehicles?.length || 0}</strong> <span className="text-muted-light">rides</span></span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button className="btn-primary text-xs">Follow</button>
            <UserActions targetUserId={profile.id} targetUsername={profile.username} />
          </div>
        </div>

        {/* Garage Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-border">
          <div className="text-center">
            <div className="text-xl font-bold text-purple-light">🤙 {totalProps}</div>
            <div className="text-xs text-muted-light uppercase tracking-wider mt-1">Total Props</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-purple-light">👁 {totalViews}</div>
            <div className="text-xs text-muted-light uppercase tracking-wider mt-1">Total Views</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-neon-light">📅 {eventsAttended?.length || 0}</div>
            <div className="text-xs text-muted-light uppercase tracking-wider mt-1">Events Attended</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-neon-light">📅 {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
            <div className="text-xs text-muted-light uppercase tracking-wider mt-1">Member Since</div>
          </div>
        </div>
      </div>

      {/* Garage */}
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        🏠 <span>{profile.display_name || profile.username}&apos;s Garage</span>
      </h2>

      {(!vehicles || vehicles.length === 0) ? (
        <div className="glass p-12 text-center">
          <p className="text-muted-light">No vehicles in this garage yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {vehicles.map((vehicle) => (
            <Link
              key={vehicle.id}
              href={`/user/${username}/${vehicle.slug}`}
              className="glass overflow-hidden card-hover group"
            >
              <div className="h-48 bg-surface-light overflow-hidden">
                {vehicle.primary_image_url ? (
                  <img
                    src={vehicle.primary_image_url}
                    alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-4xl">🚗</span>
                  </div>
                )}
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-foreground group-hover:text-purple-light transition-colors">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </h3>
                  <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded bg-purple/10 text-purple-light border border-purple/20">
                    {vehicle.build_status?.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-sm text-muted-light mt-1">{vehicle.color} {vehicle.engine && `• ${vehicle.engine}`}</p>
                <div className="flex items-center gap-4 mt-3 text-xs text-muted">
                  <span>🤙 {vehicle.props_count || 0} props</span>
                  <span>👁 {vehicle.view_count || 0} views</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
