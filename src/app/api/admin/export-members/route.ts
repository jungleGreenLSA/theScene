import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Escape a single CSV cell — wrap in quotes and double-up inner quotes
// whenever the value contains a comma, quote, or newline.
function csvCell(v: unknown): string {
  if (v === null || v === undefined) return ''
  const s = String(v)
  if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"'
  return s
}

// All members exported to CSV: Name, Location, Phone, Email,
// Car (primary vehicle's year make model color), Clubs (comma-joined
// names of every active club membership). Only theScene admins can
// hit this endpoint — we check profiles.role = 'admin' against the
// logged-in user before pulling any service-role data.
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  }
  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (me?.role !== 'admin') {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  const admin = createAdminClient()

  // Pull every profile, their primary vehicle, and the list of clubs
  // they're active in, in parallel.
  const [profilesRes, vehiclesRes, clubsRes, authUsersRes] = await Promise.all([
    admin.from('profiles')
      .select('id, username, first_name, last_name, display_name, location')
      .order('created_at', { ascending: true }),
    admin.from('vehicles')
      .select('owner_id, year, make, model, color')
      .eq('is_primary', true),
    admin.from('club_members')
      .select('user_id, club:clubs(name)')
      .eq('status', 'active'),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ])

  if (profilesRes.error) {
    return NextResponse.json({ error: profilesRes.error.message }, { status: 500 })
  }

  const profiles = profilesRes.data || []
  const vehicles = vehiclesRes.data || []
  const clubRows = (clubsRes.data || []) as Array<{ user_id: string; club: { name: string } | { name: string }[] | null }>
  const authUsers = authUsersRes.data?.users || []

  // Index helpers for O(1) joins in the row loop
  const vehicleByOwner = new Map<string, { year: number; make: string; model: string; color: string | null }>()
  for (const v of vehicles) vehicleByOwner.set(v.owner_id, v)

  const clubsByUser = new Map<string, string[]>()
  for (const row of clubRows) {
    const clubObj = Array.isArray(row.club) ? row.club[0] : row.club
    if (!clubObj?.name) continue
    const list = clubsByUser.get(row.user_id) ?? []
    list.push(clubObj.name)
    clubsByUser.set(row.user_id, list)
  }

  const authById = new Map<string, { email: string | null; phone: string | null }>()
  for (const u of authUsers) {
    authById.set(u.id, { email: u.email ?? null, phone: u.phone ?? null })
  }

  // Build CSV — header first, then one row per profile.
  const header = ['Name', 'Location', 'Phone', 'Email', 'Car', 'Clubs', 'Username']
  const lines: string[] = [header.join(',')]

  for (const p of profiles) {
    const name = [p.first_name, p.last_name].filter(Boolean).join(' ') || p.display_name || p.username
    const auth = authById.get(p.id)
    const v = vehicleByOwner.get(p.id)
    const carParts = v ? [v.year, v.make, v.model, v.color].filter(Boolean).map(String) : []
    const car = carParts.join(' ')
    const clubs = (clubsByUser.get(p.id) || []).join(', ')

    lines.push([
      csvCell(name),
      csvCell(p.location),
      csvCell(auth?.phone),
      csvCell(auth?.email),
      csvCell(car),
      csvCell(clubs),
      csvCell(p.username),
    ].join(','))
  }

  const body = lines.join('\n') + '\n'
  const stamp = new Date().toISOString().slice(0, 10)
  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="thescene-members-${stamp}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
