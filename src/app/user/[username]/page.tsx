import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import UserActions from '@/components/UserActions'
import FollowButton from '@/components/FollowButton'
import FollowLists from '@/components/FollowLists'
import UserBadges from '@/components/UserBadges'
import UserCoverEditor from '@/components/UserCoverEditor'

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

  const { data: eventsAttended } = await supabase
    .from('event_rsvps')
    .select('id')
    .eq('user_id', profile.id)

  const totalProps = vehicles?.reduce((sum, v) => sum + (v.props_count || 0), 0) || 0
  const totalViews = vehicles?.reduce((sum, v) => sum + (v.view_count || 0), 0) || 0

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '80px 32px 40px' }}>
      {/* Cover image */}
      <div className="glass" style={{ overflow: 'hidden', marginBottom: '24px' }}>
        <div style={{ height: '180px', position: 'relative', background: 'rgba(26,26,46,0.5)' }}>
          {profile.cover_image_url ? (
            <img src={profile.cover_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(249,115,22,0.1))' }} />
          )}
          <UserCoverEditor userId={profile.id} currentCoverUrl={profile.cover_image_url} />
        </div>
      </div>

      {/* Profile header */}
      <div className="glass" style={{ padding: '32px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '20px' }}>
          {/* Avatar with online indicator */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', background: 'rgba(26,26,46,0.5)', border: '2px solid rgba(124,58,237,0.3)' }}>
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', color: '#6b7280' }}>
                  {profile.username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            {profile.is_online && (
              <div style={{ position: 'absolute', bottom: 2, right: 2, width: '16px', height: '16px', borderRadius: '50%', background: '#22c55e', border: '3px solid #12121e', boxShadow: '0 0 8px rgba(34,197,94,0.5)' }} />
            )}
          </div>

          {/* Name + meta */}
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h1 className="text-2xl font-bold text-foreground">{profile.display_name || profile.username}</h1>
              {profile.subscription_tier === 'premium' && (
                <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', padding: '3px 8px', borderRadius: '4px', background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa' }}>Premium</span>
              )}
              {profile.is_online && (
                <span style={{ fontSize: '11px', color: '#22c55e', fontWeight: 600 }}>● Active now</span>
              )}
            </div>
            <p className="text-purple-light" style={{ fontSize: '14px' }}>@{profile.username}</p>
            {profile.location && (
              <p className="text-muted-light" style={{ fontSize: '13px', marginTop: '4px' }}>📍 {profile.location}</p>
            )}
            {profile.bio && (
              <p className="text-muted-light" style={{ fontSize: '14px', marginTop: '8px', lineHeight: 1.6, maxWidth: '500px' }}>{profile.bio}</p>
            )}
            <p className="text-muted" style={{ fontSize: '11px', marginTop: '6px' }}>
              Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>

            {/* Followers/Following */}
            <div style={{ marginTop: '12px' }}>
              <FollowLists userId={profile.id} />
              <UserBadges userId={profile.id} />
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <FollowButton targetUserId={profile.id} targetUsername={profile.username} />
            <UserActions targetUserId={profile.id} targetUsername={profile.username} />
          </div>
        </div>

        {/* Stats bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 120px), 1fr))', gap: '12px', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="text-purple-light font-bold" style={{ fontSize: '1.2rem' }}>🤙 {totalProps}</div>
            <div className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Props</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div className="text-purple-light font-bold" style={{ fontSize: '1.2rem' }}>👁 {totalViews}</div>
            <div className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Views</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div className="text-neon-light font-bold" style={{ fontSize: '1.2rem' }}>📅 {eventsAttended?.length || 0}</div>
            <div className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Events</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div className="text-neon-light font-bold" style={{ fontSize: '1.2rem' }}>🚗 {vehicles?.length || 0}</div>
            <div className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Rides</div>
          </div>
        </div>
      </div>

      {/* Garage */}
      <h2 className="font-bold text-foreground" style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        🏠 {profile.display_name || profile.username}&apos;s Garage
      </h2>

      {(!vehicles || vehicles.length === 0) ? (
        <div className="glass" style={{ padding: '40px 32px', textAlign: 'center' }}>
          <p className="text-muted-light">No vehicles in this garage yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '16px' }}>
          {vehicles.map((vehicle) => (
            <Link
              key={vehicle.id}
              href={`/user/${username}/${vehicle.slug}`}
              className="glass overflow-hidden card-hover group"
            >
              <div style={{ height: '200px', overflow: 'hidden', background: 'rgba(26,26,46,0.5)' }}>
                {vehicle.primary_image_url ? (
                  <img
                    src={vehicle.primary_image_url}
                    alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                    className="group-hover:scale-105 transition-transform duration-500"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '40px' }}>🚗</span>
                  </div>
                )}
              </div>
              <div style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 className="font-bold text-foreground group-hover:text-purple-light transition-colors" style={{ fontSize: '1rem' }}>
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </h3>
                  <span className="text-purple-light" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}>
                    {vehicle.build_status?.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-muted-light" style={{ fontSize: '13px', marginTop: '4px' }}>{vehicle.color} {vehicle.engine && `· ${vehicle.engine}`}</p>
                <div style={{ display: 'flex', gap: '12px', marginTop: '10px', fontSize: '12px' }}>
                  <span className="text-muted">🤙 {vehicle.props_count || 0} props</span>
                  <span className="text-muted">👁 {vehicle.view_count || 0} views</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
