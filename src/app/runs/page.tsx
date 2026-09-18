'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface CrewRun {
  id: string
  title: string
  slug: string
  description: string
  run_date: string
  start_location: string
  start_city: string
  start_state: string
  end_location: string
  end_city: string
  end_state: string
  estimated_distance: string
  estimated_duration: string
  cover_image_url: string
  rsvp_count: number
  max_participants: number
  status: string
  organizer: { username: string; display_name: string; avatar_url: string }
}

export default function RunsPage() {
  const supabase = createClient()
  const [runs, setRuns] = useState<CrewRun[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('crew_runs')
        .select('*, organizer:profiles!crew_runs_organizer_id_fkey(username, display_name, avatar_url)')
        .in('status', ['published', 'active'])
        .order('run_date', { ascending: true })
        .limit(20)
      setRuns((data || []) as unknown as CrewRun[])
      setLoading(false)
    }
    fetch()
  }, [])

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '80px 16px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <p className="eyebrow" style={{ marginBottom: '4px' }}>The Scene</p>
          <h1 className="text-3xl font-bold">Crew <span style={{ color: 'var(--color-accent)' }}>Runs</span></h1>
          <p className="text-muted-light" style={{ marginTop: '4px', fontSize: '0.85rem' }}>Group drives, caravans, and road trips. Find your crew and roll out.</p>
        </div>
        <Link href="/events/create" className="btn-primary" style={{ fontSize: '12px', minHeight: '44px' }}>Plan a Run</Link>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '16px' }}>
          {[1,2,3].map(i => <div key={i} className="panel animate-pulse" style={{ height: '260px' }} />)}
        </div>
      ) : runs.length === 0 ? (
        <div className="panel" style={{ padding: '48px 32px', textAlign: 'center' }}>
          <h2 className="text-xl font-bold" style={{ marginBottom: '8px' }}>No crew runs planned</h2>
          <p className="text-muted-light" style={{ fontSize: '0.9rem', marginBottom: '16px' }}>Be the first to organize a group drive!</p>
          <Link href="/events/create" className="btn-primary" style={{ minHeight: '44px' }}>Plan a Run</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '16px' }}>
          {runs.map((run) => {
            const d = new Date(run.run_date)
            return (
              <div key={run.id} className="panel overflow-hidden card-hover">
                <div style={{ height: '140px', background: 'linear-gradient(135deg, rgba(242,169,0,0.08), rgba(142,163,184,0.08))', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  {run.cover_image_url ? (
                    <img src={run.cover_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', maxWidth: '100%' }} />
                  ) : null}
                  <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(15,16,18,0.9)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '6px 12px', textAlign: 'center' }}>
                    <div className="spec" style={{ fontSize: '10px', color: 'var(--color-accent)' }}>{d.toLocaleDateString('en-US', { month: 'short' })}</div>
                    <div className="spec" style={{ fontSize: '20px', color: 'var(--color-foreground)', lineHeight: 1 }}>{d.getDate()}</div>
                  </div>
                </div>
                <div style={{ padding: '16px' }}>
                  <h3 className="font-bold text-foreground" style={{ fontSize: '1rem', marginBottom: '8px' }}>{run.title}</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: 'var(--color-muted-light)' }}>
                    <span>Start: {run.start_location || `${run.start_city}, ${run.start_state}`}</span>
                    {(run.end_location || run.end_city) && (
                      <span>End: {run.end_location || `${run.end_city}, ${run.end_state}`}</span>
                    )}
                    {run.estimated_distance && <span>Distance: <span className="spec">{run.estimated_distance}</span></span>}
                    {run.estimated_duration && <span>Duration: <span className="spec">{run.estimated_duration}</span></span>}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--color-border)' }}>
                    <span className="spec text-muted" style={{ fontSize: '12px' }}>{run.rsvp_count}{run.max_participants ? `/${run.max_participants}` : ''} going</span>
                    <Link href={`/user/${run.organizer?.username}`} className="text-muted" style={{ fontSize: '11px' }}>by @{run.organizer?.username}</Link>
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
