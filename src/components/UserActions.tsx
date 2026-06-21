'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface UserActionsProps {
  targetUserId: string
  targetUsername: string
}

export default function UserActions({ targetUserId, targetUsername }: UserActionsProps) {
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [isBlocked, setIsBlocked] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [isOwnProfile, setIsOwnProfile] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const checkStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      if (user.id === targetUserId) { setIsOwnProfile(true); return }

      const { data } = await supabase
        .from('blocks')
        .select('id')
        .eq('blocker_id', user.id)
        .eq('blocked_id', targetUserId)
        .single()

      if (data) setIsBlocked(true)
    }
    checkStatus()
  }, [targetUserId])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
        setShowReport(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        setShowReport(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  if (isOwnProfile) return null

  const handleBlock = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/auth/login'; return }

    setLoading(true)
    if (isBlocked) {
      await supabase.from('blocks').delete().eq('blocker_id', user.id).eq('blocked_id', targetUserId)
      setIsBlocked(false)
      setMessage(`Unblocked @${targetUsername}`)
    } else {
      await supabase.from('blocks').insert({ blocker_id: user.id, blocked_id: targetUserId })
      setIsBlocked(true)
      setMessage(`Blocked @${targetUsername}. You won't see their content.`)
    }
    setLoading(false)
    setOpen(false)
    setTimeout(() => setMessage(''), 4000)
  }

  const handleReport = async () => {
    if (!reportReason.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/auth/login'; return }

    setLoading(true)
    await supabase.from('reports').insert({
      reporter_id: user.id,
      target_type: 'user',
      target_id: targetUserId,
      reason: reportReason.trim(),
    })
    setMessage('Report submitted. Our team will review it.')
    setShowReport(false)
    setReportReason('')
    setOpen(false)
    setLoading(false)
    setTimeout(() => setMessage(''), 4000)
  }

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      {/* Trigger button */}
      <button
        ref={triggerRef}
        onClick={() => setOpen(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
        style={{
          background: '#f0f0f0',
          border: '1px solid #e4e4e4',
          borderRadius: '8px',
          padding: '8px 12px',
          color: '#2c3e50',
          fontSize: '16px',
          cursor: 'pointer',
          lineHeight: 1,
        }}
        aria-label="User actions"
      >
        ···
      </button>

      {/* Dropdown */}
      {open && !showReport && (
        <div role="menu" aria-label="User actions" className="menu-pop" style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '8px',
          width: '220px',
          background: '#f0f0f0',
          backdropFilter: 'blur(16px)',
          border: '1px solid #e4e4e4',
          borderRadius: '10px',
          padding: '6px',
          zIndex: 50,
          boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
        }}>
          <button
            role="menuitem"
            onClick={handleBlock}
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px 14px',
              background: 'none',
              border: 'none',
              borderRadius: '6px',
              color: isBlocked ? 'var(--color-success)' : 'var(--color-danger)',
              fontSize: '13px',
              fontWeight: 600,
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f5f5')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
          >
            {isBlocked ? 'Unblock' : 'Block'} @{targetUsername}
          </button>

          <button
            role="menuitem"
            onClick={() => setShowReport(true)}
            style={{
              width: '100%',
              padding: '10px 14px',
              background: 'none',
              border: 'none',
              borderRadius: '6px',
              color: 'var(--color-link)',
              fontSize: '13px',
              fontWeight: 600,
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f5f5')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
          >
            Report @{targetUsername}
          </button>
        </div>
      )}

      {/* Report form */}
      {open && showReport && (
        <div role="dialog" aria-modal="false" aria-labelledby="useractions-report-title" className="menu-pop" style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '8px',
          width: '300px',
          background: '#f0f0f0',
          backdropFilter: 'blur(16px)',
          border: '1px solid #e4e4e4',
          borderRadius: '10px',
          padding: '20px',
          zIndex: 50,
          boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
        }}>
          <h4 id="useractions-report-title" className="font-bold text-foreground" style={{ fontSize: '14px', marginBottom: '4px' }}>
            Report @{targetUsername}
          </h4>
          <p className="text-muted" style={{ fontSize: '12px', marginBottom: '12px' }}>
            Tell us what&apos;s wrong. Our team will review it within 24 hours.
          </p>

          <select
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            className="input"
            style={{ marginBottom: '12px', fontSize: '13px' }}
          >
            <option value="">Select a reason...</option>
            <option value="harassment">Harassment or bullying</option>
            <option value="spam">Spam or scam</option>
            <option value="fake">Fake profile or impersonation</option>
            <option value="inappropriate">Inappropriate content</option>
            <option value="hate">Hate speech</option>
            <option value="other">Other</option>
          </select>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => { setShowReport(false); setReportReason('') }}
              style={{ flex: 1, padding: '10px', borderRadius: '6px', background: '#f5f5f5', border: '1px solid #e4e4e4', color: '#2c3e50', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              onClick={handleReport}
              disabled={loading || !reportReason}
              style={{ flex: 1, padding: '10px', borderRadius: '6px', background: reportReason ? '#2c79c4' : 'rgba(44, 121, 196, 0.3)', border: 'none', color: 'white', fontSize: '12px', fontWeight: 600, cursor: reportReason ? 'pointer' : 'default', opacity: loading ? 0.5 : 1 }}
            >
              {loading ? 'Sending...' : 'Submit Report'}
            </button>
          </div>
        </div>
      )}

      {/* Toast message */}
      {message && (
        <div role="status" aria-live="polite" style={{
          position: 'fixed',
          bottom: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#f0f0f0',
          border: '1px solid rgba(44, 121, 196, 0.3)',
          borderRadius: '10px',
          padding: '14px 24px',
          zIndex: 1000,
          boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
          maxWidth: '400px',
        }}>
          <p className="text-foreground" style={{ fontSize: '13px', fontWeight: 500 }}>{message}</p>
        </div>
      )}
    </div>
  )
}
