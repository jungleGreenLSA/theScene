'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function NotificationBell() {
  const supabase = createClient()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
      if (!cancelled) setUnread(count || 0)
    }
    load()
    const id = setInterval(load, 60000) // refresh every minute
    return () => { cancelled = true; clearInterval(id) }
  }, [])

  const label = unread > 0
    ? `Notifications — ${unread} unread`
    : 'Notifications'

  return (
    <Link
      href="/notifications"
      title={label}
      aria-label={label}
      style={{
        position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: '40px', height: '40px', borderRadius: '8px',
        background: 'transparent', border: 'none', cursor: 'pointer',
        color: unread > 0 ? '#90caf9' : '#dbeaf6',
        fontSize: '18px',
      }}
    >
      <span aria-hidden="true">🔔</span>
      {unread > 0 && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute', top: '4px', right: '4px',
            minWidth: '16px', height: '16px', padding: '0 4px',
            borderRadius: '8px', background: '#c02b2b', color: 'white',
            fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
            lineHeight: 1,
          }}
        >
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </Link>
  )
}
