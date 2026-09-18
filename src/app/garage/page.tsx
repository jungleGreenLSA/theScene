'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Vehicle {
  id: string
  year: number
  make: string
  model: string
  color: string
  slug: string
  build_status: string
  primary_image_url: string
  props_count: number
  view_count: number
  is_public: boolean
}

export default function MyGaragePage() {
  const supabase = createClient()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase.from('profiles').select('username').eq('id', user.id).single()
      if (profile) {
        setUsername(profile.username)
      }

      const { data: v } = await supabase.from('vehicles').select('*').eq('owner_id', user.id).order('created_at', { ascending: false })
      setVehicles(v || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div style={{ maxWidth: '800px', margin: '0 auto', padding: '80px 32px', textAlign: 'center', color: 'var(--color-muted-light)' }}>Loading your garage…</div>

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '80px 24px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <p className="eyebrow" style={{ marginBottom: '4px' }}>My Collection</p>
          <h1 style={{ fontSize: 'clamp(22px, 5vw, 28px)', fontWeight: 700, color: 'var(--color-foreground)' }}>My <span className="gradient-text">Garage</span></h1>
          <p style={{ fontSize: '13px', color: 'var(--color-muted-light)', marginTop: '4px' }}>
            <span className="spec">{vehicles.length}</span>
            <span style={{ marginLeft: '4px' }}>vehicle{vehicles.length !== 1 ? 's' : ''}</span>
          </p>
        </div>
        <Link href="/garage/setup" className="btn-teal" style={{ fontSize: '13px', whiteSpace: 'nowrap' }}>
            + Add Vehicle
          </Link>
      </div>

      {vehicles.length === 0 ? (
        <div className="panel" style={{ padding: '56px 32px', textAlign: 'center' }}>
          <p className="eyebrow" style={{ marginBottom: '12px' }}>No vehicles yet</p>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-foreground)', marginBottom: '8px' }}>Your garage is empty</h2>
          <p style={{ fontSize: '14px', color: 'var(--color-muted-light)', marginBottom: '24px' }}>Add your first ride and start showing it off!</p>
          <Link href="/garage/setup" className="btn-primary" style={{ fontSize: '14px' }}>Add Your First Vehicle</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {vehicles.map(v => (
            <div key={v.id} className="panel card-hover" style={{ overflow: 'hidden' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                {/* Image — fluid width on mobile, fixed sidebar on desktop */}
                <div style={{ width: 'min(260px, 100%)', aspectRatio: '16 / 9', background: 'var(--color-surface-lowest)', flexShrink: 0, position: 'relative' }}>
                  {v.primary_image_url ? (
                    <img src={v.primary_image_url} alt={`${v.year} ${v.make} ${v.model}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '12px', color: 'var(--color-muted)', fontFamily: 'var(--font-mono, monospace)' }}>No photo</span>
                    </div>
                  )}
                  {!v.is_public && (
                    <span style={{ position: 'absolute', top: '8px', left: '8px', fontSize: '9px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(229,72,77,0.2)', color: 'var(--color-danger)', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: 'var(--font-mono, monospace)' }}>Private</span>
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: '200px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                      <div>
                        <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-foreground)' }}>
                          <span className="spec" style={{ fontSize: '11px', color: 'var(--color-muted-light)', display: 'block', marginBottom: '1px' }}>{v.year}</span>
                          {v.make} {v.model}
                        </h3>
                        <p className="spec" style={{ fontSize: '13px', color: 'var(--color-accent)', marginTop: '2px' }}>{v.color}</p>
                      </div>
                      {/* chip-purple kept as decorative identity badge */}
                      <span className="chip chip-purple" style={{ flexShrink: 0 }}>
                        {v.build_status?.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
                        <span className="spec" style={{ color: 'var(--color-foreground)' }}>{v.props_count || 0}</span>
                        <span style={{ marginLeft: '3px' }}>props</span>
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
                        <span className="spec" style={{ color: 'var(--color-foreground)' }}>{v.view_count || 0}</span>
                        <span style={{ marginLeft: '3px' }}>views</span>
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <Link href={`/user/${username}/${v.slug}`} className="btn-teal" style={{ padding: '8px 16px', fontSize: '12px', minHeight: '36px' }}>
                      View
                    </Link>
                    <Link href={`/garage/${v.id}/edit`} className="btn-outline" style={{ padding: '8px 16px', fontSize: '12px', minHeight: '36px' }}>
                      Edit
                    </Link>
                    <Link href={`/garage/${v.id}/photos`} className="btn-outline" style={{ padding: '8px 16px', fontSize: '12px', minHeight: '36px' }}>
                      Photos
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
