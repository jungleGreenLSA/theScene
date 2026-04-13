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
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Club Header */}
      <div className="glass overflow-hidden mb-8 glow-purple">
        <div className="h-48 md:h-64 bg-surface-light relative overflow-hidden">
          {club.cover_image_url ? (
            <img src={club.cover_image_url} alt={club.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple/15 to-neon/10">
              <span className="text-6xl">🏁</span>
            </div>
          )}
        </div>

        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            {club.logo_url && (
              <div className="w-20 h-20 rounded-full bg-surface-light border-2 border-purple/30 overflow-hidden flex-shrink-0 -mt-14 md:-mt-16 relative z-10">
                <img src={club.logo_url} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground">{club.name}</h1>
              {founder && (
                <p className="text-sm text-muted-light mt-1">
                  Founded by <Link href={`/user/${founder.username}`} className="text-purple-light hover:text-neon-light">{founder.display_name || founder.username}</Link>
                </p>
              )}
            </div>
            <ClubActions clubId={club.id} />
          </div>

          {club.description && (
            <p className="text-muted-light mt-4 leading-relaxed">{club.description}</p>
          )}

          {/* Social Links */}
          <div className="flex items-center gap-3 mt-4">
            {club.website && <a href={club.website} target="_blank" rel="noopener" className="text-xs text-purple-light hover:text-neon-light">🌐 Website</a>}
            {club.instagram_handle && <a href={`https://instagram.com/${club.instagram_handle}`} target="_blank" rel="noopener" className="text-xs text-purple-light hover:text-neon-light">📸 Instagram</a>}
            {club.facebook_url && <a href={club.facebook_url} target="_blank" rel="noopener" className="text-xs text-purple-light hover:text-neon-light">👥 Facebook</a>}
          </div>
        </div>
      </div>

      {/* Locations / Chapters */}
      {locations && locations.length > 0 && (
        <div className="glass p-6 mb-8">
          <h2 className="text-lg font-bold text-foreground mb-4">📍 Chapters &amp; Locations</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {locations.map((loc) => (
              <div key={loc.id} className="bg-surface rounded-lg p-4 border border-border">
                <p className="font-semibold text-foreground">{loc.city}, {loc.state}</p>
                {loc.label && <p className="text-xs text-purple-light mt-0.5">{loc.label}</p>}
                {loc.zip_code && <p className="text-xs text-muted mt-0.5">ZIP: {loc.zip_code}</p>}
                {loc.is_primary && <span className="text-[10px] uppercase tracking-wider text-neon-light font-bold mt-1 block">Primary Chapter</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Members */}
      <div className="glass p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">👥 Members ({members?.length || 0})</h2>
        </div>

        {(!members || members.length === 0) ? (
          <p className="text-muted-light text-sm">No members yet.</p>
        ) : (
          <div className="space-y-3">
            {members.map((member) => {
              const v = vehicleMap[member.user_id]
              return (
                <div key={member.id} className="flex items-center gap-4 p-3 rounded-lg bg-surface border border-border hover:border-purple/20 transition-colors">
                  {/* Avatar */}
                  <Link href={`/user/${member.user?.username}`} className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-surface-light overflow-hidden flex items-center justify-center">
                      {member.user?.avatar_url ? (
                        <img src={member.user.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm text-muted">{member.user?.username?.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link href={`/user/${member.user?.username}`} className="text-sm font-semibold text-foreground hover:text-purple-light truncate">
                        {member.user?.display_name || member.user?.username}
                      </Link>
                      <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-purple/10 text-purple-light border border-purple/20 flex-shrink-0">
                        {roleBadges[member.role] || member.role}
                      </span>
                    </div>
                    {v ? (
                      <Link href={`/user/${member.user?.username}/${v.slug}`} className="text-xs text-muted-light hover:text-neon-light mt-0.5 block truncate">
                        {v.year} {v.make} {v.model} {v.color && `— ${v.color}`}
                      </Link>
                    ) : (
                      <p className="text-xs text-muted mt-0.5">No garage yet</p>
                    )}
                  </div>

                  {/* Location */}
                  {member.user?.location && (
                    <span className="text-xs text-muted hidden md:block">📍 {member.user.location}</span>
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
