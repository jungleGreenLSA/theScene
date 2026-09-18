'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import GlobalSearch from '@/components/GlobalSearch'
import NotificationBell from '@/components/NotificationBell'

// Primary nav — what shows directly in the bar. Keep it tight.
const PRIMARY_LINKS = [
  { href: '/feed', label: 'Feed', membersOnly: false },
  { href: '/garage', label: 'Garage', membersOnly: true },
  { href: '/explore', label: 'Explore', membersOnly: true },
  { href: '/events', label: 'Events', membersOnly: true },
  { href: '/clubs', label: 'Clubs', membersOnly: true },
  { href: '/marketplace', label: 'Market', membersOnly: true },
  { href: '/wwyd', label: 'WWYD', membersOnly: true },
]

// Rest live in a "More" dropdown. Shops lives inside Market now.
const MORE_LINKS = [
  { href: '/challenges', label: 'Challenges' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/spot', label: 'Spotted' },
]

// Profile dropdown — every tool is available to every member.
const PROFILE_LINKS = [
  { href: '/activity', label: 'My Activity' },
  { href: '/journal', label: 'Build Journal' },
  { href: '/analytics', label: 'Garage Analytics' },
  { href: '/collections', label: 'Saved' },
  { href: '/settings', label: 'Settings' },
]

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [initial, setInitial] = useState('ME')
  const pathname = usePathname()
  const supabase = createClient()
  const moreRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadProfile = async (uid: string) => {
      const { data: profile } = await supabase.from('profiles').select('avatar_url, username').eq('id', uid).single()
      if (profile?.avatar_url) setAvatarUrl(profile.avatar_url)
      if (profile?.username) setInitial(profile.username.slice(0, 2).toUpperCase())
    }
    const loadUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)
        loadProfile(session.user.id)
      }
    }
    loadUser()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) loadProfile(session.user.id)
    })
    return () => { subscription.unsubscribe() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Close dropdowns on click-outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false)
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Close the mobile drawer on route change
  useEffect(() => { setMenuOpen(false) }, [pathname])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')
  const moreActive = MORE_LINKS.some(l => isActive(l.href))

  return (
    <nav className="site-nav">
      <div className="nav-inner">
        {/* Wordmark */}
        <Link href="/" className="nav-logo" aria-label="The Scene — home">
          <span className="plate" aria-hidden="true">TS</span>
          <span>The<span className="word-b"> Scene</span></span>
        </Link>

        {/* Search (desktop only) */}
        {user && (
          <div className="nav-desktop" style={{ flex: 1, maxWidth: '280px', marginLeft: '8px' }}>
            <GlobalSearch />
          </div>
        )}

        {/* Desktop nav */}
        <div className="nav-desktop" style={{ marginLeft: 'auto' }}>
          {PRIMARY_LINKS.filter(link => !link.membersOnly || user).map(link => (
            <Link key={link.href} href={link.href} className={`nav-link${isActive(link.href) ? ' active' : ''}`}>{link.label}</Link>
          ))}

          {user && (
            <div ref={moreRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setMoreOpen(!moreOpen)}
                className={`nav-link${moreActive ? ' active' : ''}`}
                aria-haspopup="menu"
                aria-expanded={moreOpen}
              >
                More <span aria-hidden="true" style={{ fontSize: '9px', marginLeft: '4px', opacity: 0.7 }}>▼</span>
              </button>
              {moreOpen && (
                <div className="nav-menu" role="menu">
                  {MORE_LINKS.map(l => (
                    <Link key={l.href} href={l.href} role="menuitem" onClick={() => setMoreOpen(false)} className={isActive(l.href) ? 'active' : ''}>{l.label}</Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {user && <div style={{ marginLeft: '6px' }}><NotificationBell /></div>}

          {user ? (
            <div ref={profileRef} style={{ position: 'relative', marginLeft: '8px' }}>
              <button
                type="button"
                onClick={() => setProfileOpen(!profileOpen)}
                title="Profile menu"
                aria-haspopup="menu"
                aria-expanded={profileOpen}
                className="nav-avatar"
                style={{ backgroundImage: avatarUrl ? `url(${avatarUrl})` : 'none' }}
              >
                {!avatarUrl && <span>{initial}</span>}
              </button>
              {profileOpen && (
                <div className="nav-menu" role="menu" style={{ minWidth: '210px' }}>
                  {PROFILE_LINKS.map(l => (
                    <Link key={l.href} href={l.href} role="menuitem" onClick={() => setProfileOpen(false)} className={isActive(l.href) ? 'active' : ''}>{l.label}</Link>
                  ))}
                  <div className="sep" />
                  <button type="button" onClick={handleSignOut} className="danger">Sign out</button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px', marginLeft: '12px', alignItems: 'center' }}>
              <Link href="/auth/login" className="btn-outline" style={{ padding: '9px 16px', fontSize: '13px' }}>Sign in</Link>
              <Link href="/auth/register" className="btn-primary" style={{ padding: '9px 18px', fontSize: '13px' }}>Join free</Link>
            </div>
          )}
        </div>

        {/* Mobile hamburger */}
        <button className="nav-mobile-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu" aria-expanded={menuOpen}>
          <span style={{ transform: menuOpen ? 'rotate(45deg) translateY(7px)' : 'none' }} />
          <span style={{ opacity: menuOpen ? 0 : 1 }} />
          <span style={{ transform: menuOpen ? 'rotate(-45deg) translateY(-7px)' : 'none' }} />
        </button>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="nav-mobile-menu">
          <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--color-border)' }}>
            {user ? (
              <Link href="/settings" onClick={() => setMenuOpen(false)} className="panel" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', color: 'var(--color-foreground)' }}>
                <div className="nav-avatar" style={{ width: '42px', height: '42px', backgroundImage: avatarUrl ? `url(${avatarUrl})` : 'none' }}>
                  {!avatarUrl && <span>{initial}</span>}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ fontSize: '15px', fontWeight: 600 }}>My profile</p>
                  <p className="spec" style={{ fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email || 'Open settings'}</p>
                </div>
                <span aria-hidden="true" style={{ color: 'var(--color-muted)' }}>›</span>
              </Link>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <Link href="/auth/login" onClick={() => setMenuOpen(false)} className="btn-outline" style={{ flex: 1, padding: '14px' }}>Sign in</Link>
                <Link href="/auth/register" onClick={() => setMenuOpen(false)} className="btn-primary" style={{ flex: 1, padding: '14px' }}>Join free</Link>
              </div>
            )}
          </div>

          <div style={{ padding: '4px 8px 12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <p className="group-label">Main</p>
            {PRIMARY_LINKS.filter(link => !link.membersOnly || user).map(link => (
              <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)} className={`m-link${isActive(link.href) ? ' active' : ''}`}>{link.label}</Link>
            ))}

            {user && (
              <>
                <p className="group-label">More</p>
                {MORE_LINKS.map(l => (
                  <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className={`m-link${isActive(l.href) ? ' active' : ''}`}>{l.label}</Link>
                ))}
                <p className="group-label">You</p>
                {PROFILE_LINKS.map(l => (
                  <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className={`m-link${isActive(l.href) ? ' active' : ''}`}>{l.label}</Link>
                ))}
              </>
            )}
          </div>

          {user && (
            <div style={{ marginTop: 'auto', padding: '16px 16px 24px', borderTop: '1px solid var(--color-border)' }}>
              <button type="button" onClick={handleSignOut} className="btn-danger" style={{ width: '100%', justifyContent: 'center', padding: '14px' }}>Sign out</button>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}
