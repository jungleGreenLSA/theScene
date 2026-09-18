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

const CATEGORY_STYLES: Record<string, { color: string; bg: string; border: string; label: string }> = {
  update: { color: 'var(--color-accent)', bg: 'rgba(242,169,0,0.08)', border: 'rgba(242,169,0,0.2)', label: 'Update' },
  feature: { color: 'var(--color-accent-light)', bg: 'rgba(242,169,0,0.08)', border: 'rgba(242,169,0,0.2)', label: 'New Feature' },
  maintenance: { color: 'var(--color-steel)', bg: 'rgba(142,163,184,0.08)', border: 'rgba(142,163,184,0.2)', label: 'Maintenance' },
  outage: { color: 'var(--color-danger)', bg: 'rgba(229,72,77,0.08)', border: 'rgba(229,72,77,0.2)', label: 'Outage' },
  news: { color: 'var(--color-success)', bg: 'rgba(86,194,113,0.08)', border: 'rgba(86,194,113,0.2)', label: 'News' },
  event: { color: 'var(--color-accent)', bg: 'rgba(242,169,0,0.08)', border: 'rgba(242,169,0,0.2)', label: 'Event' },
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
    <div className="panel" style={{ padding: '20px', marginBottom: '16px', border: '1px solid rgba(242,169,0,0.15)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <p className="eyebrow" style={{ marginBottom: 0 }}>News &amp; Updates</p>
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
                  {style.label}
                </span>
                {a.is_pinned && (
                  <span style={{ fontSize: '10px', color: 'var(--color-accent-light)', fontWeight: 600 }}>Pinned</span>
                )}
                <span style={{ fontSize: '11px', color: 'var(--color-muted)', marginLeft: 'auto' }}>{timeAgo(a.created_at)}</span>
              </div>

              {/* Title */}
              <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-foreground)', marginBottom: '6px' }}>{a.title}</h4>

              {/* Content */}
              <p style={{ fontSize: '13px', color: 'var(--color-muted-light)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
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
              <p style={{ fontSize: '11px', color: 'var(--color-muted)', marginTop: '8px' }}>
                Posted by {a.author?.display_name || a.author?.username || 'Admin'}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
