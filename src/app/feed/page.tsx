'use client'

import { useEffect, useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import DailySuggestion from '@/components/DailySuggestion'
import Announcements from '@/components/Announcements'
import TrendingBuilds from '@/components/TrendingBuilds'
import NearbyMembers from '@/components/NearbyMembers'
import WeeklyDigest from '@/components/WeeklyDigest'
import FeedComposer from '@/components/FeedComposer'
import Timeline from '@/components/Timeline'

// Wrap the actual page in a Suspense boundary so Next can statically
// prerender /feed without the useSearchParams() hook blowing up the
// build (Next 16 requires any client-side search-param reader to live
// under Suspense — the CSR bailout).
export default function FeedPage() {
  return (
    <Suspense fallback={<div style={{ maxWidth: '1100px', margin: '0 auto', padding: '80px 32px 40px', color: '#555555' }}>Loading feed...</div>}>
      <FeedPageContent />
    </Suspense>
  )
}

function FeedPageContent() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const tagFilter = searchParams.get('tag')
  const [latestMembers, setLatestMembers] = useState<any[]>([])
  const [postsRefresh, setPostsRefresh] = useState(0)

  useEffect(() => {
    const fetchSidebar = async () => {
      const { data: members } = await supabase
        .from('profiles')
        .select('username, display_name, first_name, avatar_url, location, created_at')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(8)

      setLatestMembers(members || [])
    }
    fetchSidebar()
  }, [])

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '80px 32px 40px' }}>
      <style>{`
        @media (max-width: 768px) {
          .feed-sidebar { display: none !important; }
          .feed-main { flex: 1 1 100% !important; }
        }
      `}</style>

      {/* Page header — sits above both columns so the sidebar's first card
          lines up with the main column's first card on desktop. */}
      <div style={{ marginBottom: '20px' }}>
        <h1 className="text-3xl font-bold">Feed</h1>
        <p className="text-muted-light" style={{ marginTop: '4px', fontSize: '0.85rem' }}>
          What&apos;s happening on The Scene
        </p>
      </div>

      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>

        {/* Main feed */}
        <div className="feed-main" style={{ flex: '1 1 600px', minWidth: 0 }}>
          <Announcements />
          <WeeklyDigest />
          <DailySuggestion />
          <div style={{ marginTop: '16px' }} />
          {!tagFilter && <FeedComposer onPosted={() => setPostsRefresh(n => n + 1)} />}
          <Timeline refreshKey={postsRefresh} filterTag={tagFilter} />
        </div>

        {/* Sidebar — aligns with the main column top on desktop,
            hidden on mobile via the feed-sidebar media query above. */}
        <div className="feed-sidebar" style={{ flex: '0 0 280px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Latest rides */}
          <div className="glass" style={{ padding: '20px' }}>
            <h3 className="font-bold text-foreground" style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '14px' }}>
              Latest Rides
            </h3>
            {latestMembers.length === 0 ? (
              <p className="text-muted" style={{ fontSize: '12px' }}>No members yet. Be the first!</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {latestMembers.map((m) => (
                  <Link key={m.username} href={`/user/${m.username}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px', borderRadius: '6px', transition: 'background 0.2s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  >
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', background: '#e4e4e4' }}>
                        {m.avatar_url ? (
                          <img src={m.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#555555' }}>
                            {m.username?.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p className="text-foreground" style={{ fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {m.first_name || m.display_name || m.username}
                      </p>
                      {m.location && (
                        <p className="text-muted" style={{ fontSize: '10px' }}>from {m.location}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <NearbyMembers />
          <TrendingBuilds />

          {/* Quick links */}
          <div className="glass" style={{ padding: '20px' }}>
            <h3 className="font-bold text-foreground" style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '14px' }}>
              Quick Links
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Link href="/explore" style={{ fontSize: '13px', color: '#555555', display: 'flex', alignItems: 'center', gap: '8px' }}>Explore Builds</Link>
              <Link href="/events" style={{ fontSize: '13px', color: '#555555', display: 'flex', alignItems: 'center', gap: '8px' }}>Events</Link>
              <Link href="/clubs" style={{ fontSize: '13px', color: '#555555', display: 'flex', alignItems: 'center', gap: '8px' }}>Clubs</Link>
              <Link href="/garage/setup" style={{ fontSize: '13px', color: '#fb923c', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>Build Your Garage</Link>
            </div>
          </div>

          {/* CTA */}
          <div className="glass" style={{ padding: '20px', textAlign: 'center', border: '1px solid rgba(232,120,23,0.2)' }}>
            <p className="text-foreground font-semibold" style={{ fontSize: '14px', marginBottom: '8px' }}>Unlock More with Premium</p>
            <p className="text-muted" style={{ fontSize: '12px', marginBottom: '12px' }}>Unlimited garage, analytics, and more.</p>
            <Link href="/pricing" className="btn-primary" style={{ fontSize: '11px', padding: '8px 16px', width: '100%', justifyContent: 'center', display: 'flex' }}>
              Upgrade
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
