'use client'

import Link from 'next/link'
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

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-[#0c0c14]/97 border-b border-border' : 'bg-[#0c0c14]/70 backdrop-blur-xl'
    }`}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 32px' }} className="h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <span className="text-xl font-bold tracking-wider uppercase">
            THE<span className="text-purple">SCENE</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/explore" className="text-sm text-muted-light hover:text-purple-light transition-colors uppercase tracking-wider font-medium">
            Explore
          </Link>
          <Link href="/feed" className="text-sm text-muted-light hover:text-purple-light transition-colors uppercase tracking-wider font-medium">
            Feed
          </Link>
          <Link href="/events" className="text-sm text-muted-light hover:text-purple-light transition-colors uppercase tracking-wider font-medium">
            Events
          </Link>
          <Link href="/clubs" className="text-sm text-muted-light hover:text-purple-light transition-colors uppercase tracking-wider font-medium">
            Clubs
          </Link>
        </div>

        {/* Auth buttons */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <Link href="/garage/setup" className="text-sm text-muted-light hover:text-neon-light transition-colors uppercase tracking-wider font-medium">
                My Garage
              </Link>
              <Link href="/settings" className="text-sm text-muted-light hover:text-neon-light transition-colors uppercase tracking-wider font-medium">
                Settings
              </Link>
              <button onClick={handleSignOut} className="btn-outline text-xs py-2 px-4">
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="btn-outline text-xs py-2 px-4">
                Sign In
              </Link>
              <Link href="/pricing" className="btn-primary text-xs py-2 px-4">
                Join The Scene
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`block w-6 h-0.5 bg-foreground transition-all ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block w-6 h-0.5 bg-foreground transition-all ${menuOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-6 h-0.5 bg-foreground transition-all ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#0c0c14]/97 border-t border-border px-4 pb-4 space-y-3">
          <Link href="/explore" className="block py-2 text-sm text-muted-light uppercase tracking-wider" onClick={() => setMenuOpen(false)}>Explore</Link>
          <Link href="/feed" className="block py-2 text-sm text-muted-light uppercase tracking-wider" onClick={() => setMenuOpen(false)}>Feed</Link>
          <Link href="/events" className="block py-2 text-sm text-muted-light uppercase tracking-wider" onClick={() => setMenuOpen(false)}>Events</Link>
          <Link href="/clubs" className="block py-2 text-sm text-muted-light uppercase tracking-wider" onClick={() => setMenuOpen(false)}>Clubs</Link>
          {user ? (
            <>
              <Link href="/garage/setup" className="block py-2 text-sm text-neon-light uppercase tracking-wider" onClick={() => setMenuOpen(false)}>My Garage</Link>
              <Link href="/settings" className="block py-2 text-sm text-muted-light uppercase tracking-wider" onClick={() => setMenuOpen(false)}>Settings</Link>
              <button onClick={handleSignOut} className="w-full btn-outline text-xs py-2">Sign Out</button>
            </>
          ) : (
            <div className="flex gap-2 pt-2">
              <Link href="/auth/login" className="flex-1 btn-outline text-xs py-2 text-center" onClick={() => setMenuOpen(false)}>Sign In</Link>
              <Link href="/pricing" className="flex-1 btn-primary text-xs py-2 text-center" onClick={() => setMenuOpen(false)}>Join</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}
