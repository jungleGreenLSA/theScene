import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ClubActions from '@/components/ClubActions'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: club } = await supabase.from('clubs').select('name').eq('slug', slug).single()
  if (!club) return { title: 'Not Found' }
  return { title: `${club.name} - Car Club` }
}

export default async function ClubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: club } = await supabase
    .from('clubs')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!club) return notFound()

  const { data: locations } = await supabase
    .from('club_locations')
    .select('*')
    .eq('club_id', club.id)
    .order('is_primary', { ascending: false })

  const { data: members } = await supabase
    .from('club_members')
    .select(`
      *,
      user:profiles(id, username, display_name, avatar_url, location),
      vehicle:profiles(
        id
      )
    `)
    .eq('club_id', club.id)
    .order('role')
    .order('joined_at')

  // Get primary vehicle for each member
  const memberIds = members?.map(m => m.user_id) || []
  const { data: memberVehicles } = await supabase
    .from('vehicles')
    .select('owner_id, year, make, model, color, slug')
    .in('owner_id', memberIds)
    .eq('is_primary', true)

  const vehicleMap: Record<string, any> = {}
  memberVehicles?.forEach(v => { vehicleMap[v.owner_id] = v })

  const { data: founder } = await supabase
    .from('profiles')
    .select('username, display_name')
    .eq('id', club.created_by)
    .single()

  const roleBadges: Record<string, string> = {
    founder: '👑 Founder',
    admin: '⚡ Admin',
    officer: '🛡️ Officer',
    member: '🏁 Member',
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '80px 32px 40px' }}>
      {/* Club Header */}
      <div className="glass glow-purple" style={{ overflow: 'hidden', marginBottom: '24px' }}>
        <div style={{ height: '220px', background: 'rgba(26,26,46,0.5)', position: 'relative', overflow: 'hidden' }}>
          {club.cover_image_url ? (
            <img src={club.cover_image_url} alt={club.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(249,115,22,0.1))' }}>
              <span style={{ fontSize: '64px' }}>🏁</span>
            </div>
          )}
        </div>

        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px' }}>
            {club.logo_url && (
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', overflow: 'hidden', background: 'rgba(26,26,46,0.5)', border: '2px solid rgba(124,58,237,0.3)', flexShrink: 0, marginTop: '-48px', position: 'relative', zIndex: 1 }}>
                <img src={club.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#e2e4e9' }}>{club.name}</h1>
              {founder && (
                <p style={{ fontSize: '14px', color: '#8892a4', marginTop: '4px' }}>
                  Founded by <Link href={`/user/${founder.username}`} style={{ color: '#a78bfa' }}>{founder.display_name || founder.username}</Link>
                </p>
              )}
            </div>
            <ClubActions clubId={club.id} />
          </div>

          {club.description && (
            <p style={{ fontSize: '14px', color: '#9ca3af', marginTop: '14px', lineHeight: 1.7 }}>{club.description}</p>
          )}

          {/* Social Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '14px' }}>
            {club.website && <a href={club.website} target="_blank" rel="noopener" style={{ fontSize: '13px', color: '#a78bfa' }}>🌐 Website</a>}
            {club.instagram_handle && <a href={`https://instagram.com/${club.instagram_handle}`} target="_blank" rel="noopener" style={{ fontSize: '13px', color: '#a78bfa' }}>📸 Instagram</a>}
            {club.facebook_url && <a href={club.facebook_url} target="_blank" rel="noopener" style={{ fontSize: '13px', color: '#a78bfa' }}>👥 Facebook</a>}
          </div>
        </div>
      </div>

      {/* Locations / Chapters */}
      {locations && locations.length > 0 && (
        <div className="glass" style={{ padding: '24px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#e2e4e9', marginBottom: '14px' }}>📍 Chapters &amp; Locations</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 200px), 1fr))', gap: '10px' }}>
            {locations.map((loc) => (
              <div key={loc.id} style={{ padding: '14px', background: 'rgba(18,18,30,0.5)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#e2e4e9' }}>{loc.city}, {loc.state}</p>
                {loc.label && <p style={{ fontSize: '12px', color: '#a78bfa', marginTop: '2px' }}>{loc.label}</p>}
                {loc.zip_code && <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>ZIP: {loc.zip_code}</p>}
                {loc.is_primary && <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#fb923c', fontWeight: 700, display: 'block', marginTop: '4px' }}>Primary Chapter</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Members */}
      <div className="glass" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#e2e4e9' }}>👥 Members ({members?.length || 0})</h2>
        </div>

        {(!members || members.length === 0) ? (
          <p style={{ fontSize: '13px', color: '#8892a4' }}>No members yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {members.map((member) => {
              const v = vehicleMap[member.user_id]
              return (
                <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px', borderRadius: '8px', background: 'rgba(18,18,30,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <Link href={`/user/${member.user?.username}`} style={{ flexShrink: 0 }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', background: 'rgba(26,26,46,0.5)', backgroundImage: member.user?.avatar_url ? `url(${member.user.avatar_url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {!member.user?.avatar_url && <span style={{ fontSize: '14px', color: '#6b7280' }}>{member.user?.username?.charAt(0).toUpperCase()}</span>}
                    </div>
                  </Link>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Link href={`/user/${member.user?.username}`} style={{ fontSize: '14px', fontWeight: 600, color: '#e2e4e9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {member.user?.display_name || member.user?.username}
                      </Link>
                      <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: 'rgba(124,58,237,0.1)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.2)', flexShrink: 0 }}>
                        {roleBadges[member.role] || member.role}
                      </span>
                    </div>
                    {v ? (
                      <Link href={`/user/${member.user?.username}/${v.slug}`} style={{ fontSize: '12px', color: '#8892a4', display: 'block', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {v.year} {v.make} {v.model} {v.color && `— ${v.color}`}
                      </Link>
                    ) : (
                      <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>No garage yet</p>
                    )}
                  </div>

                  {member.user?.location && (
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>📍 {member.user.location}</span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
