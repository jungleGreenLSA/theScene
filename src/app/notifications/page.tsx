'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Notification {
  id: string
  type: string
  actor_id: string | null
  target_type: string | null
  target_id: string | null
  message: string | null
  is_read: boolean
  created_at: string
  actor: { username: string; display_name: string; avatar_url: string } | null
}

const TYPE_EMOJI: Record<string, string> = {
  follow: '👥',
  props: '👍',
  comment: '💬',
  guestbook: '📓',
  event_rsvp: '📅',
  mention: '@',
  featured: '⭐',
  club_join_request: '🏁',
  club_approved: '✅',
  club_rejected: '❌',
}

function targetHref(n: Notification): string {
  if (!n.target_type || !n.target_id) return '#'
  if (n.target_type === 'club') {
    // We only store club UUID, not slug — route through actor's profile or a search page
    return `/clubs`
  }
  if (n.target_type === 'event') return `/events`
  if (n.target_type === 'vehicle') return `/garage`
  if (n.target_type === 'profile' && n.actor?.username) return `/user/${n.actor.username}`
  return '#'
}

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  if (s < 604800) return `${Math.floor(s / 86400)}d`
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function NotificationsPage() {
  const supabase = createClient()
  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/auth/login'; return }
      const { data } = await supabase
        .from('notifications')
        .select('*, actor:profiles!actor_id(username, display_name, avatar_url)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100)
      setItems((data || []) as unknown as Notification[])
      setLoading(false)

      // Mark all as read
      const unreadIds = (data || []).filter((n: any) => !n.is_read).map((n: any) => n.id)
      if (unreadIds.length > 0) {
        await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds)
      }
    }
    load()
  }, [])

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '80px 32px 40px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#e2e4e9', marginBottom: '4px' }}>Notifications</h1>
      <p style={{ fontSize: '13px', color: '#8892a4', marginBottom: '20px' }}>Join requests, guestbook signs, and mentions show up here.</p>

      {loading ? (
        <p style={{ fontSize: '13px', color: '#6b7280' }}>Loading...</p>
      ) : items.length === 0 ? (
        <div className="glass" style={{ padding: '32px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: '#8892a4' }}>Nothing new. Check back later.</p>
        </div>
      ) : (
        <div className="glass" style={{ padding: '8px' }}>
          {items.map((n) => (
            <Link
              key={n.id}
              href={targetHref(n)}
              style={{
                display: 'flex', gap: '12px', alignItems: 'flex-start',
                padding: '14px', borderRadius: '8px',
                background: n.is_read ? 'transparent' : 'rgba(232,120,23,0.05)',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              <div style={{ fontSize: '22px', flexShrink: 0, width: '28px', textAlign: 'center' }}>
                {TYPE_EMOJI[n.type] || '🔔'}
              </div>
              {n.actor?.avatar_url ? (
                <img src={n.actor.avatar_url} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(26,26,46,0.6)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#6b7280' }}>
                  {n.actor?.username?.charAt(0).toUpperCase() || '?'}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '14px', color: '#e2e4e9', lineHeight: 1.4 }}>
                  {n.message || 'New activity'}
                </p>
                <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>{timeAgo(n.created_at)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
