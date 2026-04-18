'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const TABS = [
  { href: '/feed', label: 'Feed', icon: '📡' },
  { href: '/garage', label: 'Garage', icon: '🏁' },
  { href: '/explore', label: 'Explore', icon: '🔍' },
  { href: '/events', label: 'Events', icon: '📅' },
  { href: '/clubs', label: 'Clubs', icon: '👥' },
]

export default function MobileTabBar() {
  const pathname = usePathname()
  const supabase = createClient()
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setLoggedIn(!!data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setLoggedIn(!!session))
    return () => sub.subscription.unsubscribe()
  }, [])

  if (!loggedIn) return null

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <nav className="mobile-tab-bar" style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
      background: 'rgba(12,12,20,0.98)', backdropFilter: 'blur(16px)',
      borderTop: '1px solid rgba(255,255,255,0.08)',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }}>
      <div style={{ display: 'flex', alignItems: 'stretch', justifyContent: 'space-around', height: '56px' }}>
        {TABS.map(t => {
          const active = isActive(t.href)
          return (
            <Link key={t.href} href={t.href} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px',
              textDecoration: 'none',
              color: active ? '#a78bfa' : '#6b7280',
              transition: 'color 0.15s',
              position: 'relative',
            }}>
              {active && <span style={{ position: 'absolute', top: 0, left: '30%', right: '30%', height: '2px', background: '#a78bfa', borderRadius: '0 0 2px 2px' }} />}
              <span style={{ fontSize: '20px', lineHeight: 1 }}>{t.icon}</span>
              <span style={{ fontSize: '10px', fontWeight: 600 }}>{t.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
