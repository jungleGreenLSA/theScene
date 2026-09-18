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
    <Suspense fallback={<div style={{ maxWidth: '1100px', margin: '0 auto', padding: '80px 32px 40px' }} className="text-muted">Loading feed...</div>}>
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
          <div className="panel" style={{ padding: '20px' }}>
            <h3 className="eyebrow" style={{ marginBottom: '14px' }}>
              Latest Rides
            </h3>
            {latestMembers.length === 0 ? (
              <p className="text-muted" style={{ fontSize: '12px' }}>No members yet. Be the first!</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {latestMembers.map((m) => (
                  <Link key={m.username} href={`/user/${m.username}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px', borderRadius: '6px', transition: 'background 0.2s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-light)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  >
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', background: 'var(--color-surface-light)' }}>
                        {m.avatar_url ? (
                          <img src={m.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: 'var(--color-muted)' }}>
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
          <div className="panel" style={{ padding: '20px' }}>
            <h3 className="eyebrow" style={{ marginBottom: '14px' }}>
              Quick Links
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Link href="/explore" style={{ fontSize: '13px', color: 'var(--color-muted-light)', display: 'flex', alignItems: 'center', gap: '8px' }}>Explore Builds</Link>
              <Link href="/events" style={{ fontSize: '13px', color: 'var(--color-muted-light)', display: 'flex', alignItems: 'center', gap: '8px' }}>Events</Link>
              <Link href="/clubs" style={{ fontSize: '13px', color: 'var(--color-muted-light)', display: 'flex', alignItems: 'center', gap: '8px' }}>Clubs</Link>
              <Link href="/garage/setup" style={{ fontSize: '13px', color: 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>Build Your Garage</Link>
            </div>
          </div>

          {/* Member tools — every one of these is included */}
          <div className="panel" style={{ padding: '20px' }}>
            <h3 className="eyebrow" style={{ marginBottom: '14px' }}>
              Your Tools
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Link href="/journal" style={{ fontSize: '13px', color: 'var(--color-foreground-soft)' }}>Build Journal</Link>
              <Link href="/analytics" style={{ fontSize: '13px', color: 'var(--color-foreground-soft)' }}>Garage Analytics</Link>
              <Link href="/collections" style={{ fontSize: '13px', color: 'var(--color-foreground-soft)' }}>Saved Collections</Link>
              <Link href="/marketplace/create" style={{ fontSize: '13px', color: 'var(--color-foreground-soft)' }}>Sell a Part or Car</Link>
              <Link href="/events/create" style={{ fontSize: '13px', color: 'var(--color-foreground-soft)' }}>Host an Event</Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
