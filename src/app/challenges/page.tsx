'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Challenge {
  id: string
  title: string
  description: string
  category: string
  start_date: string
  end_date: string
  cover_image_url: string
  is_active: boolean
  entries: { id: string; image_url: string; vote_count: number; user: { username: string } }[]
}

export default function ChallengesPage() {
  const supabase = createClient()
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('challenges')
        .select('*, entries:challenge_entries(id, image_url, vote_count, user:profiles!challenge_entries_user_id_fkey(username))')
        .eq('is_active', true)
        .order('end_date', { ascending: true })
        .limit(10)
      setChallenges((data || []) as unknown as Challenge[])
      setLoading(false)
    }
    fetch()
  }, [])

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '80px 32px 40px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 className="text-3xl font-bold">Monthly <span className="text-neon-light">Challenges</span></h1>
        <p className="text-muted-light" style={{ marginTop: '4px', fontSize: '0.85rem' }}>Enter. Vote. Win. Monthly photo challenges with community voting.</p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[1,2].map(i => <div key={i} className="glass animate-pulse" style={{ height: '200px' }} />)}
        </div>
      ) : challenges.length === 0 ? (
        <div className="glass" style={{ padding: '48px 32px', textAlign: 'center' }}>
          <h2 className="text-xl font-bold" style={{ marginBottom: '8px' }}>No active challenges</h2>
          <p className="text-muted-light" style={{ fontSize: '0.9rem' }}>Check back soon! Monthly challenges will be posted by the team.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {challenges.map((c) => {
            const daysLeft = Math.ceil((new Date(c.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            const entryCount = c.entries?.length || 0
            return (
              <div key={c.id} className="glass overflow-hidden">
                <div style={{ height: '180px', background: 'linear-gradient(135deg, rgba(44, 121, 196, 0.15), rgba(95, 168, 221, 0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  {c.cover_image_url ? (
                    <img src={c.cover_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : null}
                  {daysLeft > 0 && (
                    <div style={{ position: 'absolute', top: '12px', right: '12px', background: '#ffffff', borderRadius: '8px', padding: '6px 14px' }}>
                      <span style={{ fontSize: '12px', color: daysLeft <= 3 ? '#ef4444' : '#90caf9', fontWeight: 700 }}>{daysLeft} day{daysLeft !== 1 ? 's' : ''} left</span>
                    </div>
                  )}
                </div>
                <div style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <h2 className="font-bold text-foreground" style={{ fontSize: '1.3rem', marginBottom: '6px' }}>{c.title}</h2>
                      <p className="text-muted-light" style={{ fontSize: '14px', lineHeight: 1.6, maxWidth: '600px' }}>{c.description}</p>
                      {c.category && (
                        <span style={{ display: 'inline-block', marginTop: '8px', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', padding: '3px 10px', borderRadius: '4px', background: 'rgba(44, 121, 196, 0.1)', border: '1px solid rgba(44, 121, 196, 0.2)', color: '#5fa8dd' }}>{c.category}</span>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p className="text-foreground font-bold" style={{ fontSize: '1.5rem' }}>{entryCount}</p>
                      <p className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>entries</p>
                    </div>
                  </div>

                  {/* Entry thumbnails */}
                  {c.entries && c.entries.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
                      {c.entries.slice(0, 8).map((entry) => (
                        <div key={entry.id} style={{ width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, background: '#e4e4e4', position: 'relative' }}>
                          <img src={entry.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <div style={{ position: 'absolute', bottom: '2px', right: '4px', fontSize: '10px', color: '#90caf9', fontWeight: 700, textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>{entry.vote_count}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
                    <button className="btn-neon" style={{ fontSize: '12px', padding: '10px 20px' }}>Enter Challenge</button>
                    <button className="btn-outline" style={{ fontSize: '12px', padding: '10px 20px' }}>View All Entries</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
