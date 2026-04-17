'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Member {
  id: string
  user_id: string
  role: string
  status: string
  joined_at: string
  user: { username: string; display_name: string; avatar_url: string; location: string } | null
  vehicle?: { year: number; make: string; model: string; color: string; slug: string } | null
}

const ROLE_BADGES: Record<string, string> = {
  founder: '👑 Founder',
  admin: '⚡ Admin',
  officer: '🛡️ Officer',
  member: '🏁 Member',
}

export default function ClubMembers({ clubId, createdBy }: { clubId: string; createdBy: string }) {
  const supabase = createClient()
  const [members, setMembers] = useState<Member[]>([])
  const [pending, setPending] = useState<Member[]>([])
  const [canManage, setCanManage] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  const flash = (m: string) => { setMessage(m); setTimeout(() => setMessage(''), 4000) }

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUserId(user?.id || null)

    const { data: memberRows } = await supabase
      .from('club_members')
      .select('id, user_id, role, status, joined_at, user:profiles(username, display_name, avatar_url, location)')
      .eq('club_id', clubId)
      .order('role')
      .order('joined_at')

    const rows = (memberRows || []) as unknown as Member[]
    const active = rows.filter(m => m.status !== 'pending' && m.status !== 'rejected')
    const pendingRows = rows.filter(m => m.status === 'pending')

    // Fetch primary vehicles for active members
    const ids = active.map(m => m.user_id)
    if (ids.length > 0) {
      const { data: vehicles } = await supabase
        .from('vehicles')
        .select('owner_id, year, make, model, color, slug')
        .in('owner_id', ids)
        .eq('is_primary', true)
      const vMap: Record<string, any> = {}
      vehicles?.forEach(v => { vMap[v.owner_id] = v })
      active.forEach(m => { m.vehicle = vMap[m.user_id] || null })
    }

    setMembers(active)
    setPending(pendingRows)

    // Check admin status
    if (user) {
      const self = rows.find(r => r.user_id === user.id)
      if (self && ['admin', 'founder'].includes(self.role) && self.status !== 'pending') setCanManage(true)
      else if (user.id === createdBy) setCanManage(true)
    }
    setLoading(false)
  }

  useEffect(() => { load() /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [clubId])

  const approve = async (memberId: string) => {
    const { error } = await supabase.from('club_members').update({ status: 'active' }).eq('id', memberId)
    if (error) { flash('Approve failed: ' + error.message); return }
    flash('Member approved.')
    load()
  }

  const reject = async (memberId: string) => {
    if (!window.confirm('Reject this join request?')) return
    const { error } = await supabase.from('club_members').delete().eq('id', memberId)
    if (error) { flash('Reject failed: ' + error.message); return }
    flash('Request rejected.')
    load()
  }

  const removeMember = async (memberId: string, username: string, role: string) => {
    if (role === 'founder') { flash('You cannot remove the founder.'); return }
    if (!window.confirm(`Remove @${username} from the club?`)) return
    const { error } = await supabase.from('club_members').delete().eq('id', memberId)
    if (error) { flash('Remove failed: ' + error.message); return }
    flash(`Removed @${username}.`)
    load()
  }

  if (loading) {
    return <div className="glass" style={{ padding: '24px', color: '#6b7280', fontSize: '13px' }}>Loading members...</div>
  }

  return (
    <>
      {message && (
        <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px', color: '#22c55e', fontSize: '12px' }}>
          {message}
        </div>
      )}

      {/* Pending requests — admins/founders only */}
      {canManage && pending.length > 0 && (
        <div className="glass" style={{ padding: '24px', marginBottom: '20px', border: '1px solid rgba(249,115,22,0.25)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#fb923c', marginBottom: '14px' }}>🔔 Pending Requests ({pending.length})</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {pending.map(m => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '8px', background: 'rgba(18,18,30,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <Link href={`/user/${m.user?.username}`} style={{ flexShrink: 0 }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', background: 'rgba(26,26,46,0.5)', backgroundImage: m.user?.avatar_url ? `url(${m.user.avatar_url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {!m.user?.avatar_url && <span style={{ fontSize: '12px', color: '#6b7280' }}>{m.user?.username?.charAt(0).toUpperCase()}</span>}
                  </div>
                </Link>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link href={`/user/${m.user?.username}`} style={{ fontSize: '13px', fontWeight: 600, color: '#e2e4e9' }}>{m.user?.display_name || m.user?.username}</Link>
                  {m.user?.location && <p style={{ fontSize: '11px', color: '#6b7280' }}>📍 {m.user.location}</p>}
                </div>
                <button onClick={() => approve(m.id)} className="btn-success-sm">✓ Approve</button>
                <button onClick={() => reject(m.id)} className="btn-danger-sm">✕ Reject</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Members */}
      <div className="glass" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#e2e4e9' }}>👥 Members ({members.length})</h2>
        </div>
        {members.length === 0 ? (
          <p style={{ fontSize: '13px', color: '#8892a4' }}>No members yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {members.map(m => {
              const v = m.vehicle
              const canRemove = canManage && m.role !== 'founder' && m.user_id !== currentUserId
              return (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px', borderRadius: '8px', background: 'rgba(18,18,30,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <Link href={`/user/${m.user?.username}`} style={{ flexShrink: 0 }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', background: 'rgba(26,26,46,0.5)', backgroundImage: m.user?.avatar_url ? `url(${m.user.avatar_url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {!m.user?.avatar_url && <span style={{ fontSize: '14px', color: '#6b7280' }}>{m.user?.username?.charAt(0).toUpperCase()}</span>}
                    </div>
                  </Link>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <Link href={`/user/${m.user?.username}`} style={{ fontSize: '14px', fontWeight: 600, color: '#e2e4e9' }}>
                        {m.user?.display_name || m.user?.username}
                      </Link>
                      <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: 'rgba(124,58,237,0.1)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.2)' }}>
                        {ROLE_BADGES[m.role] || m.role}
                      </span>
                    </div>
                    {v ? (
                      <Link href={`/user/${m.user?.username}/${v.slug}`} style={{ fontSize: '12px', color: '#8892a4', display: 'block', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {v.year} {v.make} {v.model} {v.color && `— ${v.color}`}
                      </Link>
                    ) : (
                      <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>No garage yet</p>
                    )}
                  </div>
                  {m.user?.location && <span style={{ fontSize: '12px', color: '#6b7280' }}>📍 {m.user.location}</span>}
                  {canRemove && (
                    <button onClick={() => removeMember(m.id, m.user?.username || 'member', m.role)} className="btn-danger-sm">🗑 Remove</button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
