'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ClubActions({ clubId }: { clubId: string }) {
  const supabase = createClient()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isFounder, setIsFounder] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)
  const [memberUsername, setMemberUsername] = useState('')
  const [memberRole, setMemberRole] = useState('member')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('club_members')
        .select('role')
        .eq('club_id', clubId)
        .eq('user_id', user.id)
        .single()

      if (data && ['admin', 'founder'].includes(data.role)) {
        setIsAdmin(true)
        if (data.role === 'founder') setIsFounder(true)
      }
    }
    checkAdmin()
  }, [clubId])

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

  if (!isAdmin) return null

  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <button
        onClick={() => setShowAddMember(!showAddMember)}
        className="btn-neon text-xs"
      >
        + Add Member
      </button>
      {isFounder && (
        <button
          onClick={handleDeleteClub}
          style={{ padding: '8px 14px', borderRadius: '6px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', color: '#ef4444', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
        >
          🗑 Delete Club
        </button>
      )}

      {showAddMember && (
        <form onSubmit={handleAddMember} className="mt-4 glass p-4 space-y-3">
          <p className="text-xs text-muted-light">Only club admins and founders can add members.</p>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-light mb-1">Username</label>
            <input
              type="text"
              value={memberUsername}
              onChange={(e) => setMemberUsername(e.target.value)}
              className="input"
              placeholder="Enter their username"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-light mb-1">Role</label>
            <select value={memberRole} onChange={(e) => setMemberRole(e.target.value)} className="input">
              <option value="member">Member</option>
              <option value="officer">Officer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {message && (
            <p className={`text-sm ${message.includes('Added') ? 'text-success' : 'text-danger'}`}>{message}</p>
          )}
          <button type="submit" disabled={loading} className="btn-primary text-xs w-full justify-center disabled:opacity-50">
            {loading ? 'Adding...' : 'Add to Club'}
          </button>
        </form>
      )}
    </div>
  )
}
