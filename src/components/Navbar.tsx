'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import GlobalSearch from '@/components/GlobalSearch'
import NotificationBell from '@/components/NotificationBell'

const PRIMARY_LINKS = [
  { href: '/feed', label: 'Feed', membersOnly: false },
  { href: '/garage', label: 'Garage', membersOnly: true },
  { href: '/explore', label: 'Explore', membersOnly: true },
  { href: '/events', label: 'Events', membersOnly: true },
  { href: '/clubs', label: 'Clubs', membersOnly: true },
  { href: '/marketplace', label: 'Market', membersOnly: true },
  { href: '/wwyd', label: 'WWYD', membersOnly: true },
]

const MORE_LINKS = [
  { href: '/pricing', label: 'Pricing' },
  { href: '/challenges', label: 'Challenges' },
  { href: '/leaderboard', label: 'Leaderboard' },
]

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
    return () => { subscription.unsubscribe() }
  }, [])

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

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '10px 16px',
    fontSize: '13px',
    fontWeight: 700,
    color: active ? '#fff' : '#dbeaf6',
    background: active
      ? 'linear-gradient(180deg, #4fc3f7 0%, #2c79c4 100%)'
      : 'transparent',
    borderRight: '1px solid #0d3556',
    borderLeft: '1px solid #4a8cbe',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    transition: 'background 0.15s, color 0.15s, box-shadow 0.15s',
    textShadow: active ? '0 1px 0 rgba(0,0,0,0.25)' : 'none',
    boxShadow: active ? 'inset 0 2px 4px rgba(0,0,0,0.2), inset 0 -2px 0 #4fc3f7' : 'none',
  })

  const dropdownLinkStyle = (active: boolean): React.CSSProperties => ({
    display: 'block',
    padding: '8px 14px',
    fontSize: '12px',
    fontWeight: 600,
    color: active ? '#2c79c4' : '#222',
    background: active ? '#eaf4fb' : 'transparent',
    textDecoration: 'none',
    transition: 'background 0.1s',
  })

  return (
    <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50 }}>
      {/* Top row — sky-blue bar with logo + tabs + auth */}
      <div style={{
        background: 'linear-gradient(180deg, #3b74a6 0%, #1d4d7a 100%)',
        borderBottom: '1px solid #0d3556',
        height: '44px',
      }}>
        <div style={{
          maxWidth: '1200px', margin: '0 auto', height: '100%',
          display: 'flex', alignItems: 'center', padding: '0 12px',
        }}>
          {/* Logo */}
          <Link href="/" style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            textDecoration: 'none', paddingRight: '18px', flexShrink: 0,
          }}>
            <Image
              src="/images/logo.png"
              alt="The Scene"
              width={28}
              height={28}
              style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}
              priority
            />
            <span style={{
              fontSize: '17px', fontWeight: 800, letterSpacing: '0.5px',
              color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.4)',
            }}>
              theScene
            </span>
          </Link>

          {/* Desktop tabs */}
          <div className="nav-desktop" style={{ marginLeft: 0, height: '100%', borderLeft: '1px solid #4a4a4a' }}>
            {PRIMARY_LINKS.filter(link => !link.membersOnly || user).map(link => (
              <Link
                key={link.href}
                href={link.href}
                style={{ ...tabStyle(isActive(link.href)), height: '100%', display: 'inline-flex', alignItems: 'center' }}
              >
                {link.label}
              </Link>
            ))}

            {user && (
              <div ref={moreRef} style={{ position: 'relative', height: '100%' }}>
                <button
                  onClick={() => setMoreOpen(!moreOpen)}
                  style={{
                    ...tabStyle(moreActive || moreOpen),
                    height: '100%',
                    border: 'none',
                    borderRight: '1px solid #1a1a1a',
                    borderLeft: '1px solid #4a4a4a',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontFamily: 'inherit',
                  }}
                >
                  More <span style={{ fontSize: '9px', opacity: 0.8 }}>▾</span>
                </button>
                {moreOpen && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, minWidth: '180px',
                    background: '#fff', border: '1px solid #888',
                    borderTop: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.25)',
                  }}>
                    {MORE_LINKS.map(l => (
                      <Link
                        key={l.href}
                        href={l.href}
                        onClick={() => setMoreOpen(false)}
                        style={dropdownLinkStyle(isActive(l.href))}
                      >
                        {l.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right side — search + notifications + auth/profile */}
          <div className="nav-desktop" style={{ marginLeft: 'auto', gap: '10px', alignItems: 'center' }}>
            {user && (
              <div style={{ width: '220px' }}>
                <GlobalSearch />
              </div>
            )}
            {user && <NotificationBell />}
            {user ? (
              <div ref={profileRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  title="Profile menu"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '3px 8px 3px 3px', background: 'rgba(255,255,255,0.12)',
                    border: '1px solid #4a8cbe', borderRadius: '3px', cursor: 'pointer',
                  }}
                >
                  <span style={{
                    width: '26px', height: '26px', borderRadius: '2px', overflow: 'hidden',
                    background: '#555', display: 'inline-block',
                    backgroundImage: avatarUrl ? `url(${avatarUrl})` : 'none',
                    backgroundSize: 'cover', backgroundPosition: 'center',
                  }} />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>Me ▾</span>
                </button>
                {profileOpen && (
                  <div style={{
                    position: 'absolute', top: '100%', right: 0, minWidth: '200px',
                    background: '#fff', border: '1px solid #888',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.25)', marginTop: '2px',
                  }}>
                    {PROFILE_LINKS.map(l => (
                      <Link
                        key={l.href}
                        href={l.href}
                        onClick={() => setProfileOpen(false)}
                        style={dropdownLinkStyle(isActive(l.href))}
                      >
                        {l.label}
                      </Link>
                    ))}
                    <div style={{ borderTop: '1px solid #e4e4e4' }}>
                      <button
                        onClick={handleSignOut}
                        style={{
                          width: '100%', textAlign: 'left', padding: '8px 14px',
                          fontSize: '12px', fontWeight: 600, color: '#c02b2b',
                          background: 'none', border: 'none', cursor: 'pointer',
                          fontFamily: 'inherit',
                        }}
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '6px' }}>
                <Link href="/auth/login" style={{
                  padding: '5px 12px', fontSize: '12px', fontWeight: 700,
                  color: '#fff', background: 'rgba(255,255,255,0.12)',
                  border: '1px solid #4a8cbe', borderRadius: '3px', textDecoration: 'none',
                }}>
                  Sign In
                </Link>
                <Link href="/auth/register" className="btn-neon" style={{ padding: '5px 14px', fontSize: '12px' }}>
                  Join
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="nav-mobile-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            style={{ marginLeft: 'auto' }}
          >
            <span style={{ transform: menuOpen ? 'rotate(45deg) translateY(6px)' : 'none' }} />
            <span style={{ opacity: menuOpen ? 0 : 1 }} />
            <span style={{ transform: menuOpen ? 'rotate(-45deg) translateY(-6px)' : 'none' }} />
          </button>
        </div>
      </div>

      {/* Sky-blue accent rule beneath the nav */}
      <div className="accent-rule" style={{ height: '2px' }} />

      {/* Sub-bar — "Home" breadcrumb + quick search on desktop */}
      <div style={{
        background: 'linear-gradient(180deg, #ebebeb 0%, #d5d5d5 100%)',
        borderBottom: '1px solid #b5b5b5',
        height: '22px',
      }}>
        <div style={{
          maxWidth: '1200px', margin: '0 auto', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 14px', fontSize: '11px', color: '#444',
        }}>
          <span style={{ fontWeight: 600 }}>
            <Link href="/" style={{ color: '#444', fontWeight: 600 }}>Home</Link>
          </span>
          <span style={{ color: '#2c3e50' }}>
            the car community · since 2026
          </span>
        </div>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div
          className="nav-mobile-menu"
          style={{
            position: 'fixed', top: '66px', left: 0, right: 0, bottom: 0,
            background: '#f0f0f0', borderTop: '1px solid #b5b5b5',
            overflowY: 'auto', display: 'flex', flexDirection: 'column',
          }}
        >
          {/* Profile / auth block */}
          <div style={{ padding: '14px', borderBottom: '1px solid #c4c4c4', background: '#fff' }}>
            {user ? (
              <Link
                href="/settings"
                onClick={() => setMenuOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '8px', background: '#eaf4fb',
                  border: '1px solid #2c79c4', borderRadius: '2px',
                  color: '#222',
                }}
              >
                <div style={{
                  width: '44px', height: '44px', borderRadius: '2px', overflow: 'hidden',
                  background: '#ddd', border: '1px solid #888',
                  backgroundImage: avatarUrl ? `url(${avatarUrl})` : 'none',
                  backgroundSize: 'cover', backgroundPosition: 'center',
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '14px', fontWeight: 700 }}>My Profile</p>
                  <p style={{ fontSize: '12px', color: '#2c3e50', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user.email || 'Tap to open settings'}
                  </p>
                </div>
                <span style={{ color: '#3a5876' }}>›</span>
              </Link>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <Link href="/auth/login" onClick={() => setMenuOpen(false)} className="btn-outline" style={{ flex: 1, justifyContent: 'center', padding: '10px' }}>Sign In</Link>
                <Link href="/auth/register" onClick={() => setMenuOpen(false)} className="btn-neon" style={{ flex: 1, justifyContent: 'center', padding: '10px' }}>Join</Link>
              </div>
            )}
          </div>

          <div style={{ padding: '8px 10px' }}>
            <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#2c3e50', padding: '10px 6px 6px' }}>Main</p>
            {PRIMARY_LINKS.filter(link => !link.membersOnly || user).map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                style={{
                  display: 'block', padding: '12px 10px', fontSize: '14px', fontWeight: 600,
                  color: isActive(link.href) ? '#2c79c4' : '#222',
                  background: isActive(link.href) ? '#eaf4fb' : 'transparent',
                  borderBottom: '1px solid #e4e4e4',
                }}
              >
                {link.label}
              </Link>
            ))}

            {user && (
              <>
                <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#2c3e50', padding: '16px 6px 6px' }}>More</p>
                {MORE_LINKS.map(l => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setMenuOpen(false)}
                    style={{
                      display: 'block', padding: '12px 10px', fontSize: '14px', fontWeight: 600,
                      color: isActive(l.href) ? '#2c79c4' : '#222',
                      background: isActive(l.href) ? '#eaf4fb' : 'transparent',
                      borderBottom: '1px solid #e4e4e4',
                    }}
                  >
                    {l.label}
                  </Link>
                ))}

                <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#2c3e50', padding: '16px 6px 6px' }}>You</p>
                {PROFILE_LINKS.map(l => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setMenuOpen(false)}
                    style={{
                      display: 'block', padding: '12px 10px', fontSize: '14px', fontWeight: 600,
                      color: isActive(l.href) ? '#2c79c4' : '#222',
                      background: isActive(l.href) ? '#eaf4fb' : 'transparent',
                      borderBottom: '1px solid #e4e4e4',
                    }}
                  >
                    {l.label}
                  </Link>
                ))}
              </>
            )}
          </div>

          {user && (
            <div style={{ marginTop: 'auto', padding: '14px', borderTop: '1px solid #c4c4c4', background: '#fff' }}>
              <button onClick={handleSignOut} className="btn-danger" style={{ width: '100%', justifyContent: 'center', padding: '10px' }}>
                Sign Out
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}
