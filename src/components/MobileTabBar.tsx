'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useReducedMotion } from '@/lib/useReducedMotion'

const TABS = [
  { href: '/feed', label: 'Feed' },
  { href: '/garage', label: 'Garage' },
  { href: '/explore', label: 'Explore' },
  { href: '/events', label: 'Events' },
  { href: '/clubs', label: 'Clubs' },
]

export default function MobileTabBar() {
  const pathname = usePathname()
  const supabase = createClient()
  const [loggedIn, setLoggedIn] = useState(false)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setLoggedIn(!!data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setLoggedIn(!!session))
    return () => sub.subscription.unsubscribe()
  }, [])

  if (!loggedIn) return null

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')
  const activeIndex = TABS.findIndex(t => isActive(t.href))

  return (
    <nav className="mobile-tab-bar" style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
      background: '#ffffff', backdropFilter: 'blur(16px)',
      borderTop: '1px solid #d4d4d4',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'stretch', justifyContent: 'space-around', height: '56px' }}>
        {/* Single sliding active indicator */}
        {activeIndex >= 0 && (
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '2px',
              width: `${100 / TABS.length}%`,
              background: '#5fa8dd',
              borderRadius: '0 0 2px 2px',
              transform: `translateX(${activeIndex * 100}%)`,
              transition: reducedMotion ? 'none' : 'transform 0.25s ease',
              pointerEvents: 'none',
            }}
          />
        )}
        {TABS.map(t => {
          const active = isActive(t.href)
          return (
            <Link key={t.href} href={t.href} aria-current={active ? 'page' : undefined} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px',
              textDecoration: 'none',
              color: active ? 'var(--color-link)' : '#555555',
              transition: 'color 0.15s',
              position: 'relative',
            }}>
              <span style={{ fontSize: '12px', fontWeight: 600 }}>{t.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
