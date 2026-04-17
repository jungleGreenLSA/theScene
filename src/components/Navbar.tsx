'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

const NAV_LINKS = [
  { href: '/explore', label: 'Explore', membersOnly: true },
  { href: '/garage', label: 'My Garage', membersOnly: true },
  { href: '/feed', label: 'Feed', membersOnly: false },
  { href: '/events', label: 'Events', membersOnly: true },
  { href: '/clubs', label: 'Clubs', membersOnly: true },
  { href: '/marketplace', label: 'Market', membersOnly: true },
  { href: '/spot', label: 'Spot', membersOnly: true },
  { href: '/wwyd', label: 'WWYD', membersOnly: true },
]

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const loadUser = async () => {
      // Use getSession first (reads from local storage, faster)
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

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-[#0c0c14]/97 border-b border-border' : 'bg-[#0c0c14]/70 backdrop-blur-xl'
    }`}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }} className="h-14 flex items-center justify-between">
        {/* Logo text */}
        <Link href="/" style={{ flexShrink: 0, fontSize: '16px', fontWeight: 700, letterSpacing: '1.5px', color: '#e2e4e9' }}>
          THE<span style={{ color: '#a78bfa' }}>SCENE</span>
        </Link>

        {/* Desktop Nav + Right side grouped */}
        <div className="hidden lg:flex items-center gap-1" style={{ marginLeft: 'auto' }}>
          {NAV_LINKS.filter(link => !link.membersOnly || user).map(link => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                transition: 'all 0.2s',
                color: isActive(link.href) ? '#a78bfa' : '#8892a4',
                background: isActive(link.href) ? 'rgba(124,58,237,0.1)' : 'transparent',
              }}
            >
              {link.label}
            </Link>
          ))}
          <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.08)', margin: '0 8px' }} />
          {user ? (
            <>
              <Link href="/analytics" style={{ fontSize: '13px', fontWeight: 600, color: isActive('/analytics') ? '#a78bfa' : '#8892a4', padding: '6px 10px' }}>Analytics</Link>
              <Link href="/settings" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 12px 4px 4px', borderRadius: '20px', background: isActive('/settings') ? 'rgba(124,58,237,0.1)' : 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', transition: 'all 0.2s' }}>
                <div style={{ width: '26px', height: '26px', borderRadius: '50%', overflow: 'hidden', background: 'rgba(26,26,46,0.8)', flexShrink: 0, backgroundImage: avatarUrl ? `url(${avatarUrl})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {!avatarUrl && <span style={{ fontSize: '10px', color: '#6b7280' }}>👤</span>}
                </div>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#9ca3af' }}>My Profile</span>
              </Link>
              <button onClick={handleSignOut} title="Sign Out" style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#8892a4', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', transition: 'all 0.2s' }}>
                🚪
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" style={{ padding: '7px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af' }}>Sign In</Link>
              <Link href="/pricing" style={{ padding: '7px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, background: '#7c3aed', border: '1px solid #a78bfa', color: 'white' }}>Join</Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="lg:hidden flex flex-col gap-1 p-2" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
          <span className={`block w-5 h-0.5 bg-foreground transition-all ${menuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
          <span className={`block w-5 h-0.5 bg-foreground transition-all ${menuOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-5 h-0.5 bg-foreground transition-all ${menuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden bg-[#0c0c14]/97 border-t border-border" style={{ padding: '12px 24px 16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {[...NAV_LINKS,
              { href: '/runs', label: 'Crew Runs', membersOnly: true },
              { href: '/challenges', label: 'Challenges', membersOnly: true },
              { href: '/leaderboard', label: 'Leaderboard', membersOnly: true },
            ].filter(link => !link.membersOnly || user).map(link => (
              <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}
                style={{ padding: '10px 12px', borderRadius: '6px', fontSize: '14px', fontWeight: 500, color: isActive(link.href) ? '#a78bfa' : '#9ca3af', background: isActive(link.href) ? 'rgba(124,58,237,0.1)' : 'transparent' }}>
                {link.label}
              </Link>
            ))}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '6px', paddingTop: '8px' }}>
              {user ? (
                <>
                  <Link href="/analytics" onClick={() => setMenuOpen(false)} style={{ padding: '10px 12px', borderRadius: '6px', fontSize: '14px', fontWeight: 500, color: '#a78bfa', display: 'block' }}>Analytics</Link>
                  <Link href="/journal" onClick={() => setMenuOpen(false)} style={{ padding: '10px 12px', borderRadius: '6px', fontSize: '14px', fontWeight: 500, color: '#a78bfa', display: 'block' }}>Build Journal</Link>
                  <Link href="/collections" onClick={() => setMenuOpen(false)} style={{ padding: '10px 12px', borderRadius: '6px', fontSize: '14px', fontWeight: 500, color: '#a78bfa', display: 'block' }}>Collections</Link>
                  <Link href="/settings" onClick={() => setMenuOpen(false)} style={{ padding: '10px 12px', borderRadius: '6px', fontSize: '14px', fontWeight: 500, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(26,26,46,0.8)', backgroundImage: avatarUrl ? `url(${avatarUrl})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {!avatarUrl && <span style={{ fontSize: '8px', color: '#6b7280' }}>👤</span>}
                    </div>
                    My Profile
                  </Link>
                  <button onClick={handleSignOut} style={{ marginTop: '8px', width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#6b7280', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Sign Out</button>
                </>
              ) : (
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <Link href="/auth/login" onClick={() => setMenuOpen(false)} style={{ flex: 1, textAlign: 'center', padding: '10px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#9ca3af', fontSize: '13px', fontWeight: 600 }}>Sign In</Link>
                  <Link href="/pricing" onClick={() => setMenuOpen(false)} style={{ flex: 1, textAlign: 'center', padding: '10px', borderRadius: '6px', background: '#7c3aed', border: '1px solid #a78bfa', color: 'white', fontSize: '13px', fontWeight: 600 }}>Join</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
