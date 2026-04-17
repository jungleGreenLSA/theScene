'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import ActivityFeed from '@/components/ActivityFeed'
import DailySuggestion from '@/components/DailySuggestion'
import Announcements from '@/components/Announcements'
import TrendingBuilds from '@/components/TrendingBuilds'
import NearbyMembers from '@/components/NearbyMembers'
import WeeklyDigest from '@/components/WeeklyDigest'

export default function FeedPage() {
  const supabase = createClient()
  const [latestMembers, setLatestMembers] = useState<any[]>([])
  const [onlineCount, setOnlineCount] = useState(0)

  useEffect(() => {
    const fetchSidebar = async () => {
      // Latest members
      const { data: members } = await supabase
        .from('profiles')
        .select('username, display_name, first_name, avatar_url, location, is_online, created_at')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(8)

      setLatestMembers(members || [])

      // Online count
      const { count } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('is_online', true)

      setOnlineCount(count || 0)
    }
    fetchSidebar()
  }, [])

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '80px 32px 40px' }}>
      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>

        {/* Main feed */}
        <div style={{ flex: '1 1 600px', minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h1 className="text-3xl font-bold">Feed</h1>
              <p className="text-muted-light" style={{ marginTop: '4px', fontSize: '0.85rem' }}>
                What&apos;s happening on The Scene
                {onlineCount > 0 && <span className="text-success" style={{ marginLeft: '8px' }}>● {onlineCount} online now</span>}
              </p>
            </div>
          </div>

          <Announcements />
          <WeeklyDigest />
          <DailySuggestion />
          <div style={{ marginTop: '16px' }} />
          <ActivityFeed />
        </div>

        {/* Sidebar */}
        <div style={{ flex: '0 0 280px', display: 'flex', flexDirection: 'column', gap: '16px', alignSelf: 'flex-start', position: 'sticky', top: '72px' }}>
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
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', background: 'rgba(26,26,46,0.5)' }}>
                        {m.avatar_url ? (
                          <img src={m.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#6b7280' }}>
                            {m.username?.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      {m.is_online && (
                        <div style={{ position: 'absolute', bottom: -1, right: -1, width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e', border: '2px solid #0c0c14' }} />
                      )}
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
              <Link href="/explore" style={{ fontSize: '13px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '8px' }}>🔍 Explore Builds</Link>
              <Link href="/events" style={{ fontSize: '13px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '8px' }}>📅 Events</Link>
              <Link href="/clubs" style={{ fontSize: '13px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '8px' }}>🏁 Clubs</Link>
              <Link href="/garage/setup" style={{ fontSize: '13px', color: '#fb923c', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>🏠 Build Your Garage</Link>
            </div>
          </div>

          {/* CTA */}
          <div className="glass" style={{ padding: '20px', textAlign: 'center', border: '1px solid rgba(124,58,237,0.2)' }}>
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
