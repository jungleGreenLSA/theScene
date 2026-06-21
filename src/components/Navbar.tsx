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
]

// Profile dropdown
const PROFILE_LINKS = [
  { href: '/activity', label: 'My Activity' },
  { href: '/analytics', label: 'Analytics' },
  { href: '/journal', label: 'Build Journal' },
  { href: '/collections', label: 'Collections' },
  { href: '/settings', label: 'Settings' },
]

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const pathname = usePathname()
  const supabase = createClient()
  const moreRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)
        const { data: profile } = await supabase.from('profiles').select('avatar_url').eq('id', session.user.id).single()
        if (profile?.avatar_url) setAvatarUrl(profile.avatar_url)
      }
    }
    loadUser()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        supabase.from('profiles').select('avatar_url').eq('id', session.user.id).single().then(({ data }) => {
          if (data?.avatar_url) setAvatarUrl(data.avatar_url)
        })
      }
    })
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => { subscription.unsubscribe(); window.removeEventListener('scroll', handleScroll) }
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

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')
  const moreActive = MORE_LINKS.some(l => isActive(l.href))

  const navLinkStyle = (href: string): React.CSSProperties => ({
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 600,
    transition: 'all 0.2s',
    color: isActive(href) ? '#a78bfa' : '#9ca3af',
    background: isActive(href) ? 'rgba(124,58,237,0.1)' : 'transparent',
    whiteSpace: 'nowrap',
  })

  const dropdownLinkStyle = (href: string): React.CSSProperties => ({
    display: 'block',
    padding: '10px 14px',
    fontSize: '13px',
    fontWeight: 600,
    color: isActive(href) ? '#a78bfa' : '#d1d5db',
    background: isActive(href) ? 'rgba(124,58,237,0.1)' : 'transparent',
    transition: 'background 0.15s',
  })

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      transition: 'all 0.3s',
      background: scrolled ? 'rgba(12,12,20,0.97)' : 'rgba(12,12,20,0.7)',
      backdropFilter: scrolled ? 'none' : 'blur(16px)',
      borderBottom: scrolled ? '1px solid var(--color-border)' : 'none',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', height: '56px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Logo */}
        <Link href="/" style={{ flexShrink: 0, fontSize: '16px', fontWeight: 700, letterSpacing: '1.5px', color: '#e2e4e9' }}>
          THE<span style={{ color: '#a78bfa' }}>SCENE</span>
        </Link>

        {/* Search (desktop only, fills available space) */}
        {user && (
          <div className="nav-desktop" style={{ margin: 0, flex: 1, maxWidth: '260px' }}>
            <GlobalSearch />
          </div>
        )}

        {/* Desktop nav */}
        <div className="nav-desktop" style={{ marginLeft: 'auto', gap: '2px' }}>
          {PRIMARY_LINKS.filter(link => !link.membersOnly || user).map(link => (
            <Link key={link.href} href={link.href} style={navLinkStyle(link.href)}>{link.label}</Link>
          ))}

          {/* More dropdown — only for logged-in users */}
          {user && (
            <div ref={moreRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setMoreOpen(!moreOpen)}
                style={{
                  ...navLinkStyle('/__more'),
                  background: moreActive ? 'rgba(124,58,237,0.1)' : (moreOpen ? 'rgba(255,255,255,0.04)' : 'transparent'),
                  color: moreActive ? '#a78bfa' : '#9ca3af',
                  border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px',
                }}
              >
                More <span style={{ fontSize: '9px', opacity: 0.7 }}>▾</span>
              </button>
              {moreOpen && (
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '6px', minWidth: '180px', background: '#12121e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                  {MORE_LINKS.map(l => (
                    <Link key={l.href} href={l.href} onClick={() => setMoreOpen(false)} style={dropdownLinkStyle(l.href)}>{l.label}</Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Notifications bell */}
          {user && <NotificationBell />}

          {/* Profile avatar / auth buttons */}
          {user ? (
            <div ref={profileRef} style={{ position: 'relative', marginLeft: '4px' }}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                title="Profile menu"
                style={{ width: '34px', height: '34px', borderRadius: '50%', overflow: 'hidden', background: 'rgba(26,26,46,0.8)', border: '1px solid rgba(124,58,237,0.3)', cursor: 'pointer', padding: 0, backgroundImage: avatarUrl ? `url(${avatarUrl})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {!avatarUrl && <span style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af' }}>ME</span>}
              </button>
              {profileOpen && (
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '6px', minWidth: '200px', background: '#12121e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                  {PROFILE_LINKS.map(l => (
                    <Link key={l.href} href={l.href} onClick={() => setProfileOpen(false)} style={dropdownLinkStyle(l.href)}>{l.label}</Link>
                  ))}
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <button onClick={handleSignOut} style={{ width: '100%', textAlign: 'left', padding: '10px 14px', fontSize: '13px', fontWeight: 600, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>Sign Out</button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px', marginLeft: '8px' }}>
              <Link href="/auth/login" style={{ padding: '7px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af' }}>Sign In</Link>
              <Link href="/pricing" style={{ padding: '7px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, background: '#7c3aed', border: '1px solid #a78bfa', color: 'white' }}>Join</Link>
            </div>
          )}
        </div>

        {/* Mobile hamburger */}
        <button className="nav-mobile-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu" style={{ marginLeft: 'auto' }}>
          <span style={{ transform: menuOpen ? 'rotate(45deg) translateY(6px)' : 'none' }} />
          <span style={{ opacity: menuOpen ? 0 : 1 }} />
          <span style={{ transform: menuOpen ? 'rotate(-45deg) translateY(-6px)' : 'none' }} />
        </button>
      </div>

      {/* Mobile menu — full-height drawer with profile pinned on top */}
      {menuOpen && (
        <div className="nav-mobile-menu" style={{ position: 'fixed', top: '56px', left: 0, right: 0, bottom: 0, background: 'rgba(12,12,20,0.98)', backdropFilter: 'blur(8px)', borderTop: '1px solid var(--color-border)', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {/* Profile / auth — pinned top */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {user ? (
              <Link href="/settings" onClick={() => setMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', borderRadius: '10px', background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', overflow: 'hidden', background: 'rgba(26,26,46,0.8)', border: '2px solid rgba(124,58,237,0.4)', flexShrink: 0, backgroundImage: avatarUrl ? `url(${avatarUrl})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {!avatarUrl && <span style={{ fontSize: '13px', fontWeight: 700, color: '#9ca3af' }}>ME</span>}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: '#e2e4e9' }}>My Profile</p>
                  <p style={{ fontSize: '12px', color: '#9ca3af', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email || 'Tap to open settings'}</p>
                </div>
                <span style={{ fontSize: '16px', color: '#6b7280' }}>›</span>
              </Link>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <Link href="/auth/login" onClick={() => setMenuOpen(false)} style={{ flex: 1, textAlign: 'center', padding: '14px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#e2e4e9', fontSize: '14px', fontWeight: 700 }}>Sign In</Link>
                <Link href="/pricing" onClick={() => setMenuOpen(false)} style={{ flex: 1, textAlign: 'center', padding: '14px', borderRadius: '8px', background: '#7c3aed', border: '1px solid #a78bfa', color: 'white', fontSize: '14px', fontWeight: 700 }}>Join</Link>
              </div>
            )}
          </div>

          {/* Primary nav — larger tap targets */}
          <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#6b7280', padding: '12px 8px 6px' }}>Main</p>
            {PRIMARY_LINKS.filter(link => !link.membersOnly || user).map(link => (
              <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}
                style={{ padding: '14px 12px', borderRadius: '8px', fontSize: '15px', fontWeight: 600, color: isActive(link.href) ? '#a78bfa' : '#e2e4e9', background: isActive(link.href) ? 'rgba(124,58,237,0.12)' : 'transparent' }}>
                {link.label}
              </Link>
            ))}

            {user && (
              <>
                <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#6b7280', padding: '16px 8px 6px' }}>More</p>
                {MORE_LINKS.map(l => (
                  <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
                    style={{ padding: '14px 12px', borderRadius: '8px', fontSize: '15px', fontWeight: 600, color: isActive(l.href) ? '#a78bfa' : '#e2e4e9', background: isActive(l.href) ? 'rgba(124,58,237,0.12)' : 'transparent' }}>
                    {l.label}
                  </Link>
                ))}

                <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#6b7280', padding: '16px 8px 6px' }}>You</p>
                {PROFILE_LINKS.map(l => (
                  <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
                    style={{ padding: '14px 12px', borderRadius: '8px', fontSize: '15px', fontWeight: 600, color: isActive(l.href) ? '#a78bfa' : '#e2e4e9', background: isActive(l.href) ? 'rgba(124,58,237,0.12)' : 'transparent' }}>
                    {l.label}
                  </Link>
                ))}
              </>
            )}
          </div>

          {user && (
            <div style={{ marginTop: 'auto', padding: '16px 20px 24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button onClick={handleSignOut} className="btn-danger" style={{ width: '100%', justifyContent: 'center', padding: '14px' }}>Sign Out</button>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}
