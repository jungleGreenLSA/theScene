'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => { subscription.unsubscribe(); window.removeEventListener('scroll', handleScroll) }
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-[#0c0c14]/97 border-b border-border' : 'bg-[#0c0c14]/70 backdrop-blur-xl'
    }`}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }} className="h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Image src="/images/logo.png" alt="The Scene" width={40} height={40} className="rounded-full" />
          <span className="hidden sm:inline" style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '1px', color: '#e2e4e9' }}>THE<span style={{ color: '#a78bfa' }}>SCENE</span></span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-5" style={{ fontSize: '13px' }}>
          <Link href="/explore" style={{ color: '#9ca3af', fontWeight: 600 }} className="hover:text-purple-light transition-colors">Explore</Link>
          <Link href="/feed" style={{ color: '#9ca3af', fontWeight: 600 }} className="hover:text-purple-light transition-colors">Feed</Link>
          <Link href="/events" style={{ color: '#9ca3af', fontWeight: 600 }} className="hover:text-purple-light transition-colors">Events</Link>
          <Link href="/clubs" style={{ color: '#9ca3af', fontWeight: 600 }} className="hover:text-purple-light transition-colors">Clubs</Link>
          <Link href="/spot" style={{ color: '#fb923c', fontWeight: 600 }} className="hover:text-neon-light transition-colors">Spot</Link>
          <Link href="/wwyd" style={{ color: '#9ca3af', fontWeight: 600 }} className="hover:text-neon-light transition-colors">WWYD</Link>
        </div>

        {/* Right side */}
        <div className="hidden lg:flex items-center gap-3">
          {user ? (
            <>
              <Link href="/garage/setup" style={{ fontSize: '13px', color: '#fb923c', fontWeight: 600 }} className="hover:text-neon-light transition-colors">Garage</Link>
              <Link href="/analytics" style={{ fontSize: '13px', color: '#a78bfa', fontWeight: 600 }} className="hover:text-purple-bright transition-colors">Analytics</Link>
              <Link href="/settings" style={{ fontSize: '13px', color: '#9ca3af', fontWeight: 600 }} className="hover:text-foreground transition-colors">Settings</Link>
              <button onClick={handleSignOut} style={{ padding: '7px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af', cursor: 'pointer' }}>
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" style={{ padding: '6px 14px', borderRadius: '6px', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#9ca3af' }}>
                Sign In
              </Link>
              <Link href="/pricing" style={{ padding: '6px 14px', borderRadius: '6px', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', background: '#7c3aed', border: '1px solid #a78bfa', color: 'white' }}>
                Join
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="lg:hidden flex flex-col gap-1 p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`block w-5 h-0.5 bg-foreground transition-all ${menuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
          <span className={`block w-5 h-0.5 bg-foreground transition-all ${menuOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-5 h-0.5 bg-foreground transition-all ${menuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden bg-[#0c0c14]/97 border-t border-border" style={{ padding: '12px 24px 16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <Link href="/explore" onClick={() => setMenuOpen(false)} style={{ padding: '8px 0', fontSize: '13px', color: '#9ca3af', fontWeight: 500 }}>Explore</Link>
            <Link href="/feed" onClick={() => setMenuOpen(false)} style={{ padding: '8px 0', fontSize: '13px', color: '#9ca3af', fontWeight: 500 }}>Feed</Link>
            <Link href="/events" onClick={() => setMenuOpen(false)} style={{ padding: '8px 0', fontSize: '13px', color: '#9ca3af', fontWeight: 500 }}>Events</Link>
            <Link href="/clubs" onClick={() => setMenuOpen(false)} style={{ padding: '8px 0', fontSize: '13px', color: '#9ca3af', fontWeight: 500 }}>Clubs</Link>
            <Link href="/spot" onClick={() => setMenuOpen(false)} style={{ padding: '8px 0', fontSize: '13px', color: '#fb923c', fontWeight: 500 }}>Spot a Ride</Link>
            <Link href="/wwyd" onClick={() => setMenuOpen(false)} style={{ padding: '8px 0', fontSize: '13px', color: '#9ca3af', fontWeight: 500 }}>What Would You Do?</Link>
            <Link href="/runs" onClick={() => setMenuOpen(false)} style={{ padding: '8px 0', fontSize: '13px', color: '#9ca3af', fontWeight: 500 }}>Crew Runs</Link>
            <Link href="/challenges" onClick={() => setMenuOpen(false)} style={{ padding: '8px 0', fontSize: '13px', color: '#9ca3af', fontWeight: 500 }}>Challenges</Link>
            <Link href="/leaderboard" onClick={() => setMenuOpen(false)} style={{ padding: '8px 0', fontSize: '13px', color: '#9ca3af', fontWeight: 500 }}>Leaderboard</Link>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '4px', paddingTop: '8px' }}>
              {user ? (
                <>
                  <Link href="/garage/setup" onClick={() => setMenuOpen(false)} style={{ padding: '8px 0', fontSize: '13px', color: '#fb923c', fontWeight: 600, display: 'block' }}>My Garage</Link>
                  <Link href="/analytics" onClick={() => setMenuOpen(false)} style={{ padding: '8px 0', fontSize: '13px', color: '#a78bfa', fontWeight: 500, display: 'block' }}>Analytics</Link>
                  <Link href="/journal" onClick={() => setMenuOpen(false)} style={{ padding: '8px 0', fontSize: '13px', color: '#a78bfa', fontWeight: 500, display: 'block' }}>Build Journal</Link>
                  <Link href="/collections" onClick={() => setMenuOpen(false)} style={{ padding: '8px 0', fontSize: '13px', color: '#a78bfa', fontWeight: 500, display: 'block' }}>Collections</Link>
                  <Link href="/settings" onClick={() => setMenuOpen(false)} style={{ padding: '8px 0', fontSize: '13px', color: '#9ca3af', fontWeight: 500, display: 'block' }}>Settings</Link>
                  <button onClick={handleSignOut} style={{ marginTop: '8px', width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#6b7280', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Sign Out</button>
                </>
              ) : (
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <Link href="/auth/login" onClick={() => setMenuOpen(false)} style={{ flex: 1, textAlign: 'center', padding: '10px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#9ca3af', fontSize: '12px', fontWeight: 600 }}>Sign In</Link>
                  <Link href="/pricing" onClick={() => setMenuOpen(false)} style={{ flex: 1, textAlign: 'center', padding: '10px', borderRadius: '6px', background: '#7c3aed', border: '1px solid #a78bfa', color: 'white', fontSize: '12px', fontWeight: 600 }}>Join</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
