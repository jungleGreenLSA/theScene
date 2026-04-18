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
  const [tier, setTier] = useState('free')

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase.from('profiles').select('username, subscription_tier').eq('id', user.id).single()
      if (profile) {
        setUsername(profile.username)
        setTier(profile.subscription_tier || 'free')
      }

      const { data: v } = await supabase.from('vehicles').select('*').eq('owner_id', user.id).order('created_at', { ascending: false })
      setVehicles(v || [])
      setLoading(false)
    }
    load()
  }, [])

  const maxVehicles = tier === 'premium' ? 999 : 2
  const canAddMore = vehicles.length < maxVehicles

  if (loading) return <div style={{ maxWidth: '800px', margin: '0 auto', padding: '80px 32px', textAlign: 'center', color: '#8892a4' }}>Loading your garage...</div>

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '80px 32px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#e2e4e9' }}>My <span style={{ color: '#fb923c' }}>Garage</span></h1>
          <p style={{ fontSize: '14px', color: '#8892a4', marginTop: '4px' }}>{vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} {tier !== 'premium' && `(${maxVehicles} max on free tier)`}</p>
        </div>
        {canAddMore ? (
          <Link href="/garage/setup" style={{ padding: '10px 24px', borderRadius: '8px', background: '#f97316', border: '1px solid #fb923c', color: '#0c0c14', fontSize: '13px', fontWeight: 700 }}>
            + Add Vehicle
          </Link>
        ) : (
          <Link href="/pricing" style={{ padding: '10px 24px', borderRadius: '8px', background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa', fontSize: '12px', fontWeight: 600 }}>
            Upgrade for more
          </Link>
        )}
      </div>

      {vehicles.length === 0 ? (
        <div className="glass" style={{ padding: '48px 32px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#e2e4e9', marginBottom: '8px' }}>Your garage is empty</h2>
          <p style={{ fontSize: '14px', color: '#8892a4', marginBottom: '20px' }}>Add your first ride and start showing it off!</p>
          <Link href="/garage/setup" style={{ padding: '12px 28px', borderRadius: '8px', background: '#f97316', color: '#0c0c14', fontSize: '14px', fontWeight: 700 }}>Add Your First Vehicle</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {vehicles.map(v => (
            <div key={v.id} className="glass" style={{ overflow: 'hidden' }}>
              <div style={{ display: 'flex', gap: '0' }}>
                {/* Image */}
                <div style={{ width: '250px', aspectRatio: '16 / 9', background: 'rgba(26,26,46,0.5)', flexShrink: 0, position: 'relative' }}>
                  {v.primary_image_url ? (
                    <img src={v.primary_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : null}
                  {!v.is_public && (
                    <span style={{ position: 'absolute', top: '8px', left: '8px', fontSize: '10px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(239,68,68,0.2)', color: '#ef4444', fontWeight: 600 }}>Private</span>
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#e2e4e9' }}>{v.year} {v.make} {v.model}</h3>
                      <p style={{ fontSize: '14px', color: '#a78bfa', marginTop: '2px' }}>{v.color}</p>
                    </div>
                    <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', padding: '4px 10px', borderRadius: '20px', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', color: '#a78bfa' }}>
                      {v.build_status?.replace('_', ' ')}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#6b7280', marginBottom: '14px' }}>
                    <span>{v.props_count || 0} props</span>
                    <span>{v.view_count || 0} views</span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <Link href={`/user/${username}/${v.slug}`} style={{ padding: '8px 16px', borderRadius: '6px', background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa', fontSize: '12px', fontWeight: 600 }}>
                      View
                    </Link>
                    <Link href={`/garage/${v.id}/edit`} style={{ padding: '8px 16px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af', fontSize: '12px', fontWeight: 600 }}>
                      Edit
                    </Link>
                    <Link href={`/garage/${v.id}/photos`} style={{ padding: '8px 16px', borderRadius: '6px', background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.3)', color: '#fb923c', fontSize: '12px', fontWeight: 600 }}>
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
