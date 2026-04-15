'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Announcement {
  id: string
  title: string
  content: string
  category: string
  is_pinned: boolean
  created_at: string
  author: { username: string; display_name: string; avatar_url: string }
}

const CATEGORY_STYLES: Record<string, { icon: string; color: string; bg: string; border: string; label: string }> = {
  update: { icon: '🆕', color: '#a78bfa', bg: 'rgba(124,58,237,0.08)', border: 'rgba(124,58,237,0.2)', label: 'Update' },
  feature: { icon: '✨', color: '#fb923c', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.2)', label: 'New Feature' },
  maintenance: { icon: '🔧', color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)', label: 'Maintenance' },
  outage: { icon: '⚠️', color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', label: 'Outage' },
  news: { icon: '📢', color: '#22c55e', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.2)', label: 'News' },
  event: { icon: '📅', color: '#ec4899', bg: 'rgba(236,72,153,0.08)', border: 'rgba(236,72,153,0.2)', label: 'Event' },
}

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function Announcements() {
  const supabase = createClient()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('announcements')
        .select('*, author:profiles!announcements_author_id_fkey(username, display_name, avatar_url)')
        .eq('is_published', true)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(5)
      setAnnouncements((data || []) as unknown as Announcement[])
    }
    fetch()
  }, [])

  if (announcements.length === 0) return null

  const toggleExpand = (id: string) => {
    const next = new Set(expanded)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setExpanded(next)
  }

  return (
    <div className="glass" style={{ padding: '20px', marginBottom: '16px', border: '1px solid rgba(124,58,237,0.15)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <span style={{ fontSize: '16px' }}>📋</span>
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#e2e4e9', letterSpacing: '0.5px' }}>News & Updates</h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {announcements.map((a) => {
          const style = CATEGORY_STYLES[a.category] || CATEGORY_STYLES.update
          const isExpanded = expanded.has(a.id)
          const isLong = a.content.length > 200

          return (
            <div key={a.id} style={{
              padding: '14px 16px',
              borderRadius: '8px',
              background: style.bg,
              border: `1px solid ${style.border}`,
            }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px',
                  padding: '2px 8px', borderRadius: '4px',
                  background: style.bg, border: `1px solid ${style.border}`, color: style.color,
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                }}>
                  {style.icon} {style.label}
                </span>
                {a.is_pinned && (
                  <span style={{ fontSize: '10px', color: '#fb923c', fontWeight: 600 }}>📌 Pinned</span>
                )}
                <span style={{ fontSize: '11px', color: '#6b7280', marginLeft: 'auto' }}>{timeAgo(a.created_at)}</span>
              </div>

              {/* Title */}
              <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#e2e4e9', marginBottom: '6px' }}>{a.title}</h4>

              {/* Content */}
              <p style={{ fontSize: '13px', color: '#9ca3af', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {isLong && !isExpanded ? a.content.slice(0, 200) + '...' : a.content}
              </p>

              {isLong && (
                <button
                  onClick={() => toggleExpand(a.id)}
                  style={{ background: 'none', border: 'none', color: style.color, fontSize: '12px', fontWeight: 600, cursor: 'pointer', marginTop: '6px', padding: 0 }}
                >
                  {isExpanded ? 'Show less' : 'Read more'}
                </button>
              )}

              {/* Author */}
              <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '8px' }}>
                Posted by {a.author?.display_name || a.author?.username || 'Admin'}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
