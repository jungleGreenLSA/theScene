'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface LeaderEntry {
  user_id: string
  username: string
  display_name: string
  avatar_url: string
  location: string
  event_count: number
}

export default function LeaderboardPage() {
  const supabase = createClient()
  const [leaders, setLeaders] = useState<LeaderEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(new Date().getFullYear())

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      const { data } = await supabase.rpc('get_event_leaderboard', { p_year: year })
      setLeaders((data || []) as LeaderEntry[])
      setLoading(false)
    }
    fetch()
  }, [year])

  const rankColors = ['#fbbf24', 'var(--color-foreground-soft)', '#d97706']

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '80px 16px 40px' }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <p className="eyebrow" style={{ marginBottom: '8px' }}>Community</p>
        <h1 className="text-3xl font-bold">Event <span className="gradient-text">Leaderboard</span></h1>
        <p className="text-muted-light" style={{ marginTop: '4px', fontSize: '0.85rem' }}>Who shows up the most? The car meet MVPs.</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
        {[2024, 2025, 2026].map(y => (
          <button key={y} onClick={() => setYear(y)} style={{
            padding: '10px 24px', minHeight: '44px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer',
            background: year === y ? 'rgba(242,169,0,0.15)' : 'var(--color-surface-lowest)',
            color: year === y ? 'var(--color-accent)' : 'var(--color-muted)',
            outline: year === y ? '1px solid rgba(242,169,0,0.35)' : '1px solid var(--color-border)',
          }}><span className="spec" style={{ fontSize: '13px', color: 'inherit' }}>{y}</span></button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[1,2,3,4,5].map(i => <div key={i} className="panel animate-pulse" style={{ height: '60px' }} />)}
        </div>
      ) : leaders.length === 0 ? (
        <div className="panel" style={{ padding: '48px 32px', textAlign: 'center' }}>
          <h2 className="text-xl font-bold" style={{ marginBottom: '8px' }}>No data yet for {year}</h2>
          <p className="text-muted-light" style={{ fontSize: '0.9rem' }}>Start attending events to get on the leaderboard!</p>
        </div>
      ) : (
        <div className="panel" style={{ padding: '4px', overflow: 'hidden' }}>
          {leaders.map((l, i) => (
            <Link key={l.user_id} href={`/user/${l.username}`} style={{
              display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 20px',
              borderBottom: i < leaders.length - 1 ? '1px solid var(--color-surface-light)' : 'none',
              transition: 'background 0.2s',
            }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-light)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
            >
              {/* Rank */}
              <div style={{ width: '32px', textAlign: 'center', flexShrink: 0 }}>
                <span className="spec" style={{ fontSize: i < 3 ? '18px' : '16px', color: i < 3 ? rankColors[i] : 'var(--color-muted)' }}>{i + 1}</span>
              </div>

              {/* Avatar */}
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', background: 'var(--color-surface-light)', flexShrink: 0, border: i < 3 ? '2px solid rgba(242,169,0,0.4)' : 'none' }}>
                {l.avatar_url ? (
                  <img src={l.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: 'var(--color-muted)' }}>{l.username?.charAt(0).toUpperCase()}</div>
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="text-foreground font-semibold" style={{ fontSize: '14px' }}>{l.display_name || l.username}</p>
                {l.location && <p className="text-muted" style={{ fontSize: '11px' }}>{l.location}</p>}
              </div>

              {/* Count */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p className="font-bold spec" style={{ fontSize: '1.2rem', color: 'var(--color-accent)' }}>{l.event_count}</p>
                <p className="eyebrow" style={{ fontSize: '10px' }}>events</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
