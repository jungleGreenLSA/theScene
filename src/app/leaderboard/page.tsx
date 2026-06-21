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

  const rankColors = ['#8a6d00', '#333333', '#a05a00']

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '80px 32px 40px' }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h1 className="text-3xl font-bold">Event <span className="text-neon-light">Leaderboard</span></h1>
        <p className="text-muted-light" style={{ marginTop: '4px', fontSize: '0.85rem' }}>Who shows up the most? The car meet MVPs.</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
        {[2024, 2025, 2026].map(y => (
          <button key={y} onClick={() => setYear(y)} style={{
            padding: '8px 20px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer',
            background: year === y ? 'rgba(44, 121, 196, 0.2)' : '#f0f0f0',
            color: year === y ? 'var(--color-link)' : '#555555',
            outline: year === y ? '1px solid rgba(44, 121, 196, 0.3)' : '1px solid #e4e4e4',
          }}>{y}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[1,2,3,4,5].map(i => <div key={i} className="glass animate-pulse" style={{ height: '60px' }} />)}
        </div>
      ) : leaders.length === 0 ? (
        <div className="glass" style={{ padding: '48px 32px', textAlign: 'center' }}>
          <h2 className="text-xl font-bold" style={{ marginBottom: '8px' }}>No data yet for {year}</h2>
          <p className="text-muted-light" style={{ fontSize: '0.9rem' }}>Start attending events to get on the leaderboard!</p>
        </div>
      ) : (
        <div className="glass" style={{ padding: '4px', overflow: 'hidden' }}>
          {leaders.map((l, i) => (
            <Link key={l.user_id} href={`/user/${l.username}`} style={{
              display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 20px',
              borderBottom: i < leaders.length - 1 ? '1px solid #f5f5f5' : 'none',
              transition: 'background 0.2s',
            }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
            >
              {/* Rank */}
              <div style={{ width: '32px', textAlign: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: i < 3 ? '18px' : '16px', fontWeight: 700, color: i < 3 ? rankColors[i] : '#555555' }}>{i + 1}</span>
              </div>

              {/* Avatar */}
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', background: '#e4e4e4', flexShrink: 0, border: i < 3 ? '2px solid rgba(44, 121, 196, 0.4)' : 'none' }}>
                {l.avatar_url ? (
                  <img src={l.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: '#555555' }}>{l.username?.charAt(0).toUpperCase()}</div>
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="text-foreground font-semibold" style={{ fontSize: '14px' }}>{l.display_name || l.username}</p>
                {l.location && <p className="text-muted" style={{ fontSize: '11px' }}>{l.location}</p>}
              </div>

              {/* Count */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p className="text-neon-light font-bold" style={{ fontSize: '1.2rem' }}>{l.event_count}</p>
                <p className="text-muted" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>events</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
