'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Stats {
  totalUsers: number
  onlineNow: number
  premiumUsers: number
  totalVehicles: number
  totalEvents: number
  totalClubs: number
  totalPosts: number
  totalProps: number
  totalSightings: number
  newUsersToday: number
  newUsersWeek: number
  newUsersMonth: number
}

interface RecentUser {
  username: string
  display_name: string
  avatar_url: string
  location: string
  created_at: string
  is_online: boolean
  subscription_tier: string
}

interface TopCity {
  location: string
  count: number
}

interface TopVehicle {
  year: number
  make: string
  model: string
  color: string
  props_count: number
  view_count: number
  owner_username: string
  slug: string
}

interface Report {
  id: string
  target_type: string
  reason: string
  status: string
  created_at: string
  reporter: { username: string }
}

export default function AdminDashboard() {
  const supabase = createClient()
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([])
  const [topCities, setTopCities] = useState<TopCity[]>([])
  const [topVehicles, setTopVehicles] = useState<TopVehicle[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '', category: 'update', is_pinned: false })
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false)
  const [announcementSaving, setAnnouncementSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/auth/login'; return }

      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (profile?.role !== 'admin') {
        setLoading(false)
        return
      }

      setAuthorized(true)

      // Fetch all stats in parallel
      const [
        { count: totalUsers },
        { count: onlineNow },
        { count: premiumUsers },
        { count: totalVehicles },
        { count: totalEvents },
        { count: totalClubs },
        { count: totalPosts },
        { count: totalSightings },
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_online', true),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('subscription_tier', 'premium'),
        supabase.from('vehicles').select('id', { count: 'exact', head: true }),
        supabase.from('events').select('id', { count: 'exact', head: true }),
        supabase.from('clubs').select('id', { count: 'exact', head: true }),
        supabase.from('posts').select('id', { count: 'exact', head: true }),
        supabase.from('sightings').select('id', { count: 'exact', head: true }),
      ])

      // New users by time period
      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
      const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString()
      const monthAgo = new Date(now.getTime() - 30 * 86400000).toISOString()

      const [{ count: newToday }, { count: newWeek }, { count: newMonth }] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', todayStart),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', monthAgo),
      ])

      // Total props
      const { data: propsData } = await supabase.from('props').select('id', { count: 'exact', head: true })

      setStats({
        totalUsers: totalUsers || 0,
        onlineNow: onlineNow || 0,
        premiumUsers: premiumUsers || 0,
        totalVehicles: totalVehicles || 0,
        totalEvents: totalEvents || 0,
        totalClubs: totalClubs || 0,
        totalPosts: totalPosts || 0,
        totalProps: 0,
        totalSightings: totalSightings || 0,
        newUsersToday: newToday || 0,
        newUsersWeek: newWeek || 0,
        newUsersMonth: newMonth || 0,
      })

      // Recent users
      const { data: recent } = await supabase
        .from('profiles')
        .select('username, display_name, avatar_url, location, created_at, is_online, subscription_tier')
        .order('created_at', { ascending: false })
        .limit(20)
      setRecentUsers((recent || []) as RecentUser[])

      // Top cities
      const { data: allProfiles } = await supabase.from('profiles').select('location').not('location', 'is', null)
      const cityMap: Record<string, number> = {}
      allProfiles?.forEach((p: any) => {
        if (p.location) {
          const loc = p.location.trim()
          cityMap[loc] = (cityMap[loc] || 0) + 1
        }
      })
      const sorted = Object.entries(cityMap).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([location, count]) => ({ location, count }))
      setTopCities(sorted)

      // Top vehicles by props
      const { data: topV } = await supabase
        .from('vehicles')
        .select('year, make, model, color, props_count, view_count, slug, owner:profiles!vehicles_owner_id_fkey(username)')
        .eq('is_public', true)
        .order('props_count', { ascending: false })
        .limit(10)
      setTopVehicles((topV || []).map((v: any) => ({ ...v, owner_username: v.owner?.username })))

      // Pending reports
      const { data: reps } = await supabase
        .from('reports')
        .select('id, target_type, reason, status, created_at, reporter:profiles!reports_reporter_id_fkey(username)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(20)
      setReports((reps || []) as unknown as Report[])

      // Announcements
      const { data: anns } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)
      setAnnouncements(anns || [])

      setLoading(false)
    }
    load()
  }, [])

  const handleCreateAnnouncement = async () => {
    if (!announcementForm.title || !announcementForm.content) return
    setAnnouncementSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase.from('announcements').insert({
      author_id: user.id,
      title: announcementForm.title,
      content: announcementForm.content,
      category: announcementForm.category,
      is_pinned: announcementForm.is_pinned,
    }).select().single()

    if (!error && data) {
      setAnnouncements([data, ...announcements])
      setAnnouncementForm({ title: '', content: '', category: 'update', is_pinned: false })
      setShowAnnouncementForm(false)
    }
    setAnnouncementSaving(false)
  }

  const handleDeleteAnnouncement = async (id: string) => {
    await supabase.from('announcements').delete().eq('id', id)
    setAnnouncements(announcements.filter(a => a.id !== id))
  }

  const handleTogglePin = async (id: string, currentPin: boolean) => {
    await supabase.from('announcements').update({ is_pinned: !currentPin }).eq('id', id)
    setAnnouncements(announcements.map(a => a.id === id ? { ...a, is_pinned: !currentPin } : a))
  }

  const handleTogglePublish = async (id: string, currentPublished: boolean) => {
    await supabase.from('announcements').update({ is_published: !currentPublished }).eq('id', id)
    setAnnouncements(announcements.map(a => a.id === id ? { ...a, is_published: !currentPublished } : a))
  }

  if (loading) return <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '80px 32px', textAlign: 'center' }} className="text-muted-light">Loading dashboard...</div>

  if (!authorized) {
    return (
      <div style={{ maxWidth: '500px', margin: '0 auto', padding: '80px 32px', textAlign: 'center' }}>
        <div className="glass" style={{ padding: '48px 32px' }}>
          <h1 className="text-2xl font-bold" style={{ marginBottom: '8px' }}>Access Denied</h1>
          <p className="text-muted-light">You must be an administrator to view this page.</p>
        </div>
      </div>
    )
  }

  const conversionRate = stats && stats.totalUsers > 0 ? ((stats.premiumUsers / stats.totalUsers) * 100).toFixed(1) : '0'
  const monthlyRevenue = stats ? (stats.premiumUsers * 6.99).toFixed(2) : '0'
  const annualProjection = stats ? (stats.premiumUsers * 6.99 * 12).toFixed(2) : '0'

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'announcements', label: 'News & Updates' },
    { id: 'users', label: 'Users' },
    { id: 'geography', label: 'Geography' },
    { id: 'content', label: 'Content' },
    { id: 'reports', label: `Reports (${reports.length})` },
    { id: 'revenue', label: 'Revenue' },
  ]

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '80px 32px 40px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <h1 className="text-3xl font-bold">Admin <span className="text-neon-light">Dashboard</span></h1>
          <p className="text-muted-light" style={{ marginTop: '4px', fontSize: '0.85rem' }}>The Scene command center</p>
        </div>
        <a
          href="/api/admin/export-members"
          className="btn-neon"
          download
          style={{ fontSize: '12px' }}
          title="Download CSV of all members (name, location, phone, email, primary car, clubs)"
        >
          Export Members CSV
        </a>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: '8px 18px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
              background: activeTab === t.id ? 'rgba(44, 121, 196, 0.2)' : '#f0f0f0',
              color: activeTab === t.id ? '#5fa8dd' : '#555555',
              outline: activeTab === t.id ? '1px solid rgba(44, 121, 196, 0.3)' : '1px solid #e4e4e4',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ANNOUNCEMENTS TAB */}
      {activeTab === 'announcements' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 className="font-bold text-foreground" style={{ fontSize: '1rem' }}>News & Updates</h2>
            <button onClick={() => setShowAnnouncementForm(!showAnnouncementForm)} className="btn-neon" style={{ fontSize: '12px', padding: '8px 16px' }}>
              {showAnnouncementForm ? 'Cancel' : '+ New Post'}
            </button>
          </div>

          {/* Create form */}
          {showAnnouncementForm && (
            <div className="glass" style={{ padding: '24px', marginBottom: '20px' }}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: '#666666', marginBottom: '6px' }}>Title *</label>
                <input value={announcementForm.title} onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })} className="input" placeholder="What's new?" maxLength={128} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: '#666666', marginBottom: '6px' }}>Content *</label>
                <textarea value={announcementForm.content} onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })} className="input" rows={4} placeholder="Write your update..." maxLength={2000} />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: '#666666', marginBottom: '6px' }}>Category</label>
                  <select value={announcementForm.category} onChange={(e) => setAnnouncementForm({ ...announcementForm, category: e.target.value })} className="input" style={{ width: '180px' }}>
                    <option value="update">Update</option>
                    <option value="feature">New Feature</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="outage">Outage</option>
                    <option value="news">News</option>
                    <option value="event">Event</option>
                  </select>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '20px' }}>
                  <input type="checkbox" checked={announcementForm.is_pinned} onChange={(e) => setAnnouncementForm({ ...announcementForm, is_pinned: e.target.checked })} />
                  <span style={{ fontSize: '13px', color: '#555555' }}>Pin to top</span>
                </label>
              </div>
              <button onClick={handleCreateAnnouncement} disabled={announcementSaving || !announcementForm.title || !announcementForm.content} className="btn-neon" style={{ fontSize: '12px', padding: '10px 20px', opacity: announcementSaving ? 0.5 : 1 }}>
                {announcementSaving ? 'Publishing...' : 'Publish'}
              </button>
            </div>
          )}

          {/* List */}
          {announcements.length === 0 ? (
            <div className="glass" style={{ padding: '40px', textAlign: 'center' }}>
              <p className="text-muted" style={{ fontSize: '13px' }}>No announcements yet. Click "+ New Post" to create one.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {announcements.map(a => (
                <div key={a.id} className="glass" style={{ padding: '18px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(44, 121, 196, 0.1)', border: '1px solid rgba(44, 121, 196, 0.2)', color: '#5fa8dd' }}>{a.category}</span>
                        {a.is_pinned && <span style={{ fontSize: '10px', color: '#90caf9', fontWeight: 600 }}>Pinned</span>}
                        {!a.is_published && <span style={{ fontSize: '10px', color: '#ef4444', fontWeight: 600 }}>Draft</span>}
                        <span style={{ fontSize: '11px', color: '#555555' }}>{new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a1a', marginBottom: '4px' }}>{a.title}</h4>
                      <p style={{ fontSize: '13px', color: '#555555', lineHeight: 1.5 }}>{a.content.length > 150 ? a.content.slice(0, 150) + '...' : a.content}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      <button onClick={() => handleTogglePin(a.id, a.is_pinned)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 600, padding: '4px 8px', opacity: 0.6, color: '#555555' }} title={a.is_pinned ? 'Unpin' : 'Pin'}>{a.is_pinned ? 'Unpin' : 'Pin'}</button>
                      <button onClick={() => handleTogglePublish(a.id, a.is_published)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 600, padding: '4px 8px', opacity: 0.6, color: '#555555' }} title={a.is_published ? 'Unpublish' : 'Publish'}>{a.is_published ? 'Hide' : 'Show'}</button>
                      <button onClick={() => handleDeleteAnnouncement(a.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 600, padding: '4px 8px', opacity: 0.6, color: '#ef4444' }} title="Delete">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && stats && (
        <>
          {/* Key metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))', gap: '12px', marginBottom: '24px' }}>
            {[
              { label: 'Total Members', value: stats.totalUsers, color: '#5fa8dd' },
              { label: 'Online Now', value: stats.onlineNow, color: '#22c55e' },
              { label: 'Premium', value: stats.premiumUsers, color: '#90caf9' },
              { label: 'Vehicles', value: stats.totalVehicles, color: '#3b82f6' },
              { label: 'Events', value: stats.totalEvents, color: '#ec4899' },
              { label: 'Clubs', value: stats.totalClubs, color: '#14b8a6' },
            ].map(m => (
              <div key={m.label} className="glass" style={{ padding: '20px', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: m.color, lineHeight: 1 }}>{m.value}</div>
                <div className="text-muted" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '6px' }}>{m.label}</div>
              </div>
            ))}
          </div>

          {/* Growth */}
          <div className="glass" style={{ padding: '24px', marginBottom: '24px' }}>
            <h2 className="font-bold text-foreground" style={{ fontSize: '1rem', marginBottom: '16px' }}>Growth</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div style={{ textAlign: 'center' }}>
                <div className="text-neon-light font-bold" style={{ fontSize: '1.8rem' }}>{stats.newUsersToday}</div>
                <div className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Today</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div className="text-neon-light font-bold" style={{ fontSize: '1.8rem' }}>{stats.newUsersWeek}</div>
                <div className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>This Week</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div className="text-neon-light font-bold" style={{ fontSize: '1.8rem' }}>{stats.newUsersMonth}</div>
                <div className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>This Month</div>
              </div>
            </div>
          </div>

          {/* Platform stats */}
          <div className="glass" style={{ padding: '24px' }}>
            <h2 className="font-bold text-foreground" style={{ fontSize: '1rem', marginBottom: '16px' }}>Platform Activity</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '12px' }}>
              {[
                { label: 'Sightings', value: stats.totalSightings },
                { label: 'Conversion', value: `${conversionRate}%` },
              ].map(s => (
                <div key={s.label} style={{ padding: '16px', background: '#f0f0f0', borderRadius: '8px', textAlign: 'center', border: '1px solid #f5f5f5' }}>
                  <div className="text-foreground font-bold" style={{ fontSize: '1.3rem' }}>{s.value}</div>
                  <div className="text-muted" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* USERS TAB */}
      {activeTab === 'users' && (
        <div className="glass" style={{ padding: '24px' }}>
          <h2 className="font-bold text-foreground" style={{ fontSize: '1rem', marginBottom: '16px' }}>Recent Signups</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e4e4e4' }}>
                  <th style={{ textAlign: 'left', padding: '10px 12px', color: '#555555', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>User</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', color: '#555555', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Location</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', color: '#555555', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Tier</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', color: '#555555', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Status</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', color: '#555555', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Joined</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map(u => (
                  <tr key={u.username} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '10px 12px' }}>
                      <Link href={`/user/${u.username}`} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', overflow: 'hidden', background: '#e4e4e4', flexShrink: 0 }}>
                          {u.avatar_url ? <img src={u.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#555555' }}>{u.username?.charAt(0).toUpperCase()}</div>}
                        </div>
                        <span className="text-foreground font-semibold">{u.display_name || u.username}</span>
                      </Link>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#555555' }}>{u.location || '--'}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: u.subscription_tier === 'premium' ? 'rgba(95, 168, 221, 0.15)' : '#f5f5f5', color: u.subscription_tier === 'premium' ? '#90caf9' : '#555555' }}>
                        {u.subscription_tier || 'free'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      {u.is_online ? <span style={{ color: '#22c55e', fontSize: '12px' }}>● Online</span> : <span style={{ color: '#555555', fontSize: '12px' }}>Offline</span>}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#555555' }}>
                      {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* GEOGRAPHY TAB */}
      {activeTab === 'geography' && (
        <div className="glass" style={{ padding: '24px' }}>
          <h2 className="font-bold text-foreground" style={{ fontSize: '1rem', marginBottom: '16px' }}>Top Locations</h2>
          {topCities.length === 0 ? (
            <p className="text-muted" style={{ fontSize: '13px' }}>No location data yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {topCities.map((c, i) => {
                const maxCount = topCities[0]?.count || 1
                const pct = (c.count / maxCount) * 100
                return (
                  <div key={c.location} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <span className="text-muted" style={{ fontSize: '14px', fontWeight: 700, width: '24px', textAlign: 'right' }}>{i + 1}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                        <span className="text-foreground" style={{ fontSize: '13px', fontWeight: 500 }}>{c.location}</span>
                        <span className="text-purple-light font-bold" style={{ fontSize: '13px' }}>{c.count}</span>
                      </div>
                      <div style={{ height: '5px', background: '#f5f5f5', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: i < 3 ? '#5fa8dd' : '#4a5568', borderRadius: '3px', transition: 'width 0.5s ease' }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* CONTENT TAB */}
      {activeTab === 'content' && (
        <div className="glass" style={{ padding: '24px' }}>
          <h2 className="font-bold text-foreground" style={{ fontSize: '1rem', marginBottom: '16px' }}>Top Vehicles by Props</h2>
          {topVehicles.length === 0 ? (
            <p className="text-muted" style={{ fontSize: '13px' }}>No vehicles yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {topVehicles.map((v, i) => (
                <Link key={i} href={`/user/${v.owner_username}/${v.slug}`} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '10px', borderRadius: '8px', transition: 'background 0.2s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                >
                  <span className="text-muted" style={{ fontSize: '14px', fontWeight: 700, width: '24px', textAlign: 'right' }}>{i + 1}</span>
                  <div style={{ flex: 1 }}>
                    <span className="text-foreground font-semibold" style={{ fontSize: '14px' }}>{v.year} {v.make} {v.model}</span>
                    <span className="text-muted-light" style={{ fontSize: '12px', marginLeft: '8px' }}>{v.color}</span>
                    <span className="text-muted" style={{ fontSize: '11px', marginLeft: '8px' }}>by @{v.owner_username}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
                    <span className="text-neon-light font-bold">{v.props_count} props</span>
                    <span className="text-muted">{v.view_count} views</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* REPORTS TAB */}
      {activeTab === 'reports' && (
        <div className="glass" style={{ padding: '24px' }}>
          <h2 className="font-bold text-foreground" style={{ fontSize: '1rem', marginBottom: '16px' }}>Pending Reports</h2>
          {reports.length === 0 ? (
            <p className="text-muted" style={{ fontSize: '13px' }}>No pending reports. All clear!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {reports.map(r => (
                <div key={r.id} style={{ padding: '14px', background: 'rgba(239,68,68,0.05)', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span className="text-foreground font-semibold" style={{ fontSize: '13px' }}>{r.target_type} report</span>
                    <span className="text-muted" style={{ fontSize: '11px' }}>{new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                  <p className="text-muted-light" style={{ fontSize: '13px' }}>Reason: {r.reason}</p>
                  <p className="text-muted" style={{ fontSize: '11px', marginTop: '4px' }}>Reported by @{r.reporter?.username}</p>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    <button
                      onClick={async () => {
                        await supabase.from('reports').update({ status: 'resolved' }).eq('id', r.id)
                        setReports(reports.filter(rep => rep.id !== r.id))
                      }}
                      style={{ padding: '6px 14px', borderRadius: '6px', background: 'rgba(34,197,94,0.15)', border: 'none', color: '#22c55e', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Resolve
                    </button>
                    <button
                      onClick={async () => {
                        await supabase.from('reports').update({ status: 'dismissed' }).eq('id', r.id)
                        setReports(reports.filter(rep => rep.id !== r.id))
                      }}
                      style={{ padding: '6px 14px', borderRadius: '6px', background: '#f5f5f5', border: '1px solid #e4e4e4', color: '#555555', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* REVENUE TAB */}
      {activeTab === 'revenue' && stats && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div className="glass" style={{ padding: '24px', textAlign: 'center', border: '1px solid rgba(95, 168, 221, 0.2)' }}>
              <span style={{ fontSize: '11px', color: '#90caf9', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Monthly Revenue</span>
              <div className="text-neon-light font-bold" style={{ fontSize: '2.5rem', marginTop: '8px' }}>${monthlyRevenue}</div>
              <div className="text-muted" style={{ fontSize: '11px', marginTop: '4px' }}>{stats.premiumUsers} premium x $6.99</div>
            </div>
            <div className="glass" style={{ padding: '24px', textAlign: 'center' }}>
              <span style={{ fontSize: '11px', color: '#5fa8dd', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Annual Projection</span>
              <div className="text-purple-light font-bold" style={{ fontSize: '2.5rem', marginTop: '8px' }}>${annualProjection}</div>
              <div className="text-muted" style={{ fontSize: '11px', marginTop: '4px' }}>at current rate</div>
            </div>
            <div className="glass" style={{ padding: '24px', textAlign: 'center' }}>
              <span style={{ fontSize: '11px', color: '#22c55e', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Conversion Rate</span>
              <div className="text-success font-bold" style={{ fontSize: '2.5rem', marginTop: '8px' }}>{conversionRate}%</div>
              <div className="text-muted" style={{ fontSize: '11px', marginTop: '4px' }}>free to premium</div>
            </div>
          </div>

          <div className="glass" style={{ padding: '24px' }}>
            <h2 className="font-bold text-foreground" style={{ fontSize: '1rem', marginBottom: '16px' }}>Revenue Milestones</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { target: 50, label: '$350/mo', annual: '$4,200/yr' },
                { target: 100, label: '$699/mo', annual: '$8,388/yr' },
                { target: 250, label: '$1,748/mo', annual: '$20,970/yr' },
                { target: 500, label: '$3,495/mo', annual: '$41,940/yr' },
                { target: 1000, label: '$6,990/mo', annual: '$83,880/yr' },
                { target: 2000, label: '$13,980/mo', annual: '$167,760/yr' },
              ].map(m => {
                const pct = Math.min((stats.premiumUsers / m.target) * 100, 100)
                const hit = stats.premiumUsers >= m.target
                return (
                  <div key={m.target}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span className={hit ? 'text-success' : 'text-muted-light'} style={{ fontSize: '13px', fontWeight: 500 }}>
                        {hit ? 'DONE:' : ''} {m.target} subscribers -- {m.label}
                      </span>
                      <span className="text-muted" style={{ fontSize: '12px' }}>{m.annual}</span>
                    </div>
                    <div style={{ height: '6px', background: '#f5f5f5', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: hit ? '#22c55e' : '#2c79c4', borderRadius: '3px', transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
