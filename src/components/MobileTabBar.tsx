'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

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

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setLoggedIn(!!data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setLoggedIn(!!session))
    return () => sub.subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!loggedIn) return null

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <nav className="mobile-tab-bar" aria-label="Primary">
      <div className="tabs">
        {TABS.map(t => (
          <Link key={t.href} href={t.href} className={isActive(t.href) ? 'active' : ''} aria-current={isActive(t.href) ? 'page' : undefined}>
            {t.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
