'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ClubActions({ clubId }: { clubId: string }) {
  const supabase = createClient()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isFounder, setIsFounder] = useState(false)
  const [membership, setMembership] = useState<'none' | 'pending' | 'active'>('none')
  const [showAddMember, setShowAddMember] = useState(false)
  const [memberUsername, setMemberUsername] = useState('')
  const [memberRole, setMemberRole] = useState('member')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [joining, setJoining] = useState(false)

  const flash = (m: string) => { setMessage(m); setTimeout(() => setMessage(''), 4000) }

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('club_members')
        .select('id, role, status')
        .eq('club_id', clubId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (!data) { setMembership('none'); return }
      if (data.status === 'pending') { setMembership('pending'); return }
      setMembership('active')
      if (['admin', 'founder'].includes(data.role)) {
        setIsAdmin(true)
        if (data.role === 'founder') setIsFounder(true)
      }
    }
    checkAdmin()
  }, [clubId])

  const handleJoin = async () => {
    setJoining(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/auth/login'; return }
    const { error } = await supabase.from('club_members').insert({
      club_id: clubId, user_id: user.id, role: 'member', status: 'pending', added_by: user.id,
    })
    if (error) { flash('Request failed: ' + error.message); setJoining(false); return }
    setMembership('pending')
    flash('Join request sent. You\'ll show up in the club once an admin approves.')
    setJoining(false)
  }

  const handleCancelRequest = async () => {
    if (!window.confirm('Cancel your pending join request?')) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('club_members').delete().eq('club_id', clubId).eq('user_id', user.id).eq('status', 'pending')
    if (error) { flash('Cancel failed: ' + error.message); return }
    setMembership('none')
    flash('Request cancelled.')
  }

  const handleDeleteClub = async () => {
    if (!window.confirm('Delete this club? This removes all chapters, members, and references. This cannot be undone.')) return
    const typed = window.prompt('Type "delete" to confirm:')
    if (typed?.toLowerCase() !== 'delete') return
    const { error } = await supabase.from('clubs').delete().eq('id', clubId)
    if (error) { setMessage('Delete failed: ' + error.message); return }
    window.location.href = '/clubs'
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    // Look up the user by username
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('username', memberUsername.toLowerCase().trim())
      .single()

    if (!profile) {
      setMessage('User not found. Make sure the username is correct.')
      setLoading(false)
      return
    }

    // Check if already a member
    const { data: existing } = await supabase
      .from('club_members')
      .select('id')
      .eq('club_id', clubId)
      .eq('user_id', profile.id)
      .single()

    if (existing) {
      setMessage('This user is already a member of this club.')
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('club_members').insert({
      club_id: clubId,
      user_id: profile.id,
      role: memberRole,
      added_by: user?.id,
    })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage(`Added @${profile.username} as ${memberRole}!`)
      setMemberUsername('')
      setMemberRole('member')
    }
    setLoading(false)
  }

  // Non-members: show Join button
  if (!isAdmin && membership !== 'active') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
        {membership === 'pending' ? (
          <>
            <span className="chip" style={{ cursor: 'default', padding: '8px 14px', borderRadius: '6px', fontSize: '11px' }}>Pending Approval</span>
            <button onClick={handleCancelRequest} style={{ fontSize: '11px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}>Cancel request</button>
          </>
        ) : (
          <button onClick={handleJoin} disabled={joining} className="btn-teal text-xs" style={{ opacity: joining ? 0.5 : 1 }}>
            {joining ? 'Sending...' : 'Request to Join'}
          </button>
        )}
        {message && <span style={{ fontSize: '11px', color: '#2dd4bf' }}>{message}</span>}
      </div>
    )
  }

  if (!isAdmin) return null

  return (
    <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <button
          onClick={() => setShowAddMember(!showAddMember)}
          className="btn-teal"
          style={{ fontSize: '12px' }}
        >
          {showAddMember ? 'Close' : '+ Add Member'}
        </button>
        {isFounder && (
          <button onClick={handleDeleteClub} className="btn-danger">
            Delete Club
          </button>
        )}
      </div>

      {showAddMember && (
        <form onSubmit={handleAddMember} style={{ width: '300px', maxWidth: '100%', padding: '16px', borderRadius: '8px', background: 'rgba(18,18,30,0.5)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <p style={{ fontSize: '11px', color: '#9ca3af' }}>Add a user to this club by username.</p>
          <div>
            <label className="eyebrow" style={{ display: 'block', marginBottom: '4px' }}>Username</label>
            <input
              type="text"
              value={memberUsername}
              onChange={(e) => setMemberUsername(e.target.value)}
              className="input"
              placeholder="their_handle"
              required
            />
          </div>
          <div>
            <label className="eyebrow" style={{ display: 'block', marginBottom: '4px' }}>Role</label>
            <select value={memberRole} onChange={(e) => setMemberRole(e.target.value)} className="input">
              <option value="member">Member</option>
              <option value="officer">Officer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {message && (
            <p style={{ fontSize: '12px', color: message.includes('Added') ? '#2dd4bf' : '#ef4444' }}>{message}</p>
          )}
          <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '10px', fontSize: '12px', opacity: loading ? 0.5 : 1 }}>
            {loading ? 'Adding...' : 'Add to Club'}
          </button>
        </form>
      )}
    </div>
  )
}
