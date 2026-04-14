'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Vehicle {
  id: string
  year: number
  make: string
  model: string
  props_count: number
  view_count: number
}

interface Viewer {
  viewer_id: string
  username: string
  display_name: string
  avatar_url: string
  view_count: number
  last_viewed: string
}

export default function AnalyticsPage() {
  const supabase = createClient()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<string>('')
  const [viewers, setViewers] = useState<Viewer[]>([])
  const [stats, setStats] = useState({ total: 0, unique: 0, explore: 0, search: 0, direct: 0, qr: 0, feed: 0 })
  const [loading, setLoading] = useState(true)
  const [isPremium, setIsPremium] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase.from('profiles').select('subscription_tier').eq('id', user.id).single()
      setIsPremium(profile?.subscription_tier === 'premium')

      const { data: v } = await supabase.from('vehicles').select('id, year, make, model, props_count, view_count').eq('owner_id', user.id)
      setVehicles(v || [])
      if (v && v.length > 0) {
        setSelectedVehicle(v[0].id)
        await loadAnalytics(v[0].id)
      }
      setLoading(false)
    }
    load()
  }, [])

  const loadAnalytics = async (vehicleId: string) => {
    // Get recent viewers
    const { data: views } = await supabase
      .from('garage_views')
      .select('viewer_id, created_at, source, viewer:profiles!garage_views_viewer_id_fkey(username, display_name, avatar_url)')
      .eq('vehicle_id', vehicleId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (views) {
      // Aggregate by viewer
      const viewerMap: Record<string, Viewer> = {}
      let explore = 0, search = 0, direct = 0, qr = 0, feed = 0

      views.forEach((v: any) => {
        if (v.source === 'explore') explore++
        if (v.source === 'search') search++
        if (v.source === 'direct') direct++
        if (v.source === 'qr_code') qr++
        if (v.source === 'feed') feed++

        if (v.viewer_id && v.viewer) {
          if (!viewerMap[v.viewer_id]) {
            viewerMap[v.viewer_id] = {
              viewer_id: v.viewer_id,
              username: v.viewer.username,
              display_name: v.viewer.display_name,
              avatar_url: v.viewer.avatar_url,
              view_count: 0,
              last_viewed: v.created_at,
            }
          }
          viewerMap[v.viewer_id].view_count++
        }
      })

      setViewers(Object.values(viewerMap).sort((a, b) => b.view_count - a.view_count))
      setStats({ total: views.length, unique: Object.keys(viewerMap).length, explore, search, direct, qr, feed })
    }
  }

  const handleVehicleChange = async (id: string) => {
    setSelectedVehicle(id)
    await loadAnalytics(id)
  }

  if (loading) {
    return <div style={{ maxWidth: '800px', margin: '0 auto', padding: '80px 32px 40px', textAlign: 'center' }} className="text-muted-light">Loading analytics...</div>
  }

  if (!isPremium) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '80px 32px 40px', textAlign: 'center' }}>
        <div className="glass" style={{ padding: '48px 32px' }}>
          <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>📊</span>
          <h1 className="text-2xl font-bold" style={{ marginBottom: '8px' }}>Garage Analytics</h1>
          <p className="text-muted-light" style={{ marginBottom: '24px', lineHeight: 1.6 }}>
            See who&apos;s viewing your garage, where your traffic comes from, and how your props trend over time. Upgrade to Premium to unlock analytics.
          </p>
          <Link href="/pricing" className="btn-neon" style={{ fontSize: '13px' }}>Upgrade to Premium</Link>
        </div>
      </div>
    )
  }

  const selectedV = vehicles.find(v => v.id === selectedVehicle)

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '80px 32px 40px' }}>
      <h1 className="text-3xl font-bold" style={{ marginBottom: '8px' }}>Garage <span className="text-purple-light">Analytics</span></h1>
      <p className="text-muted-light" style={{ fontSize: '0.85rem', marginBottom: '24px' }}>See who&apos;s checking out your builds</p>

      {/* Vehicle selector */}
      {vehicles.length > 1 && (
        <select
          value={selectedVehicle}
          onChange={(e) => handleVehicleChange(e.target.value)}
          className="input"
          style={{ marginBottom: '24px', maxWidth: '400px' }}
        >
          {vehicles.map(v => (
            <option key={v.id} value={v.id}>{v.year} {v.make} {v.model}</option>
          ))}
        </select>
      )}

      {/* Overview stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '12px', marginBottom: '24px' }}>
        <div className="glass" style={{ padding: '20px', textAlign: 'center' }}>
          <div className="text-purple-light font-bold" style={{ fontSize: '2rem' }}>{selectedV?.view_count || 0}</div>
          <div className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Views</div>
        </div>
        <div className="glass" style={{ padding: '20px', textAlign: 'center' }}>
          <div className="text-neon-light font-bold" style={{ fontSize: '2rem' }}>{selectedV?.props_count || 0}</div>
          <div className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Props</div>
        </div>
        <div className="glass" style={{ padding: '20px', textAlign: 'center' }}>
          <div className="text-foreground font-bold" style={{ fontSize: '2rem' }}>{stats.unique}</div>
          <div className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Unique Viewers</div>
        </div>
      </div>

      {/* Traffic sources */}
      <div className="glass" style={{ padding: '24px', marginBottom: '24px' }}>
        <h2 className="font-bold text-foreground" style={{ fontSize: '1rem', marginBottom: '16px' }}>📈 Traffic Sources (Last 30 Days)</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { label: 'Explore', count: stats.explore, color: '#a78bfa' },
            { label: 'Search', count: stats.search, color: '#fb923c' },
            { label: 'Direct Link', count: stats.direct, color: '#22c55e' },
            { label: 'QR Code', count: stats.qr, color: '#3b82f6' },
            { label: 'Feed', count: stats.feed, color: '#ec4899' },
          ].map((source) => {
            const pct = stats.total > 0 ? (source.count / stats.total) * 100 : 0
            return (
              <div key={source.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span className="text-muted-light" style={{ fontSize: '13px' }}>{source.label}</span>
                  <span className="text-foreground font-semibold" style={{ fontSize: '13px' }}>{source.count} ({Math.round(pct)}%)</span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.04)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: source.color, borderRadius: '3px', transition: 'width 0.5s ease' }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent viewers */}
      <div className="glass" style={{ padding: '24px' }}>
        <h2 className="font-bold text-foreground" style={{ fontSize: '1rem', marginBottom: '16px' }}>👀 Who Viewed Your Garage</h2>
        {viewers.length === 0 ? (
          <p className="text-muted" style={{ fontSize: '13px' }}>No tracked views yet. Views from logged-in members will appear here.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {viewers.slice(0, 20).map((v) => (
              <Link key={v.viewer_id} href={`/user/${v.username}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', borderRadius: '8px', transition: 'background 0.2s' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
              >
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', background: 'rgba(26,26,46,0.5)', flexShrink: 0 }}>
                  {v.avatar_url ? (
                    <img src={v.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: '#6b7280' }}>{v.username?.charAt(0).toUpperCase()}</div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <p className="text-foreground font-semibold" style={{ fontSize: '13px' }}>{v.display_name || v.username}</p>
                  <p className="text-muted" style={{ fontSize: '11px' }}>@{v.username}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p className="text-purple-light font-bold" style={{ fontSize: '14px' }}>{v.view_count}x</p>
                  <p className="text-muted" style={{ fontSize: '10px' }}>last {new Date(v.last_viewed).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
