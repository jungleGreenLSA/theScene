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
            <button disabled style={{ padding: '8px 14px', borderRadius: '6px', background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)', color: '#fb923c', fontSize: '12px', fontWeight: 600, cursor: 'default' }}>Pending Approval</button>
            <button onClick={handleCancelRequest} style={{ fontSize: '11px', color: '#555555', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}>Cancel request</button>
          </>
        ) : (
          <button onClick={handleJoin} disabled={joining} className="btn-neon text-xs" style={{ opacity: joining ? 0.5 : 1 }}>
            {joining ? 'Sending...' : 'Request to Join'}
          </button>
        )}
        {message && <span style={{ fontSize: '11px', color: '#22c55e' }}>{message}</span>}
      </div>
    )
  }

  if (!isAdmin) return null

  return (
    <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <button
          onClick={() => setShowAddMember(!showAddMember)}
          style={{ padding: '8px 16px', borderRadius: '6px', background: 'rgba(232,120,23,0.15)', border: '1px solid rgba(232,120,23,0.3)', color: '#f97316', fontSize: '12px', fontWeight: 600, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px' }}
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
        <form onSubmit={handleAddMember} style={{ width: '300px', maxWidth: '100%', padding: '16px', borderRadius: '8px', background: '#f0f0f0', border: '1px solid #e4e4e4', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <p style={{ fontSize: '11px', color: '#666666' }}>Add a user to this club by username.</p>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: '#666666', marginBottom: '4px' }}>Username</label>
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
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: '#666666', marginBottom: '4px' }}>Role</label>
            <select value={memberRole} onChange={(e) => setMemberRole(e.target.value)} className="input">
              <option value="member">Member</option>
              <option value="officer">Officer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {message && (
            <p style={{ fontSize: '12px', color: message.includes('Added') ? '#22c55e' : '#ef4444' }}>{message}</p>
          )}
          <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '10px', fontSize: '12px', opacity: loading ? 0.5 : 1 }}>
            {loading ? 'Adding...' : 'Add to Club'}
          </button>
        </form>
      )}
    </div>
  )
}
