'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useFocusTrap } from '@/lib/useFocusTrap'

interface Vehicle { id: string; year: number; make: string; model: string; color: string | null; slug: string }

interface Props {
  sightingId: string
  spotterId: string
  alreadyClaimed: boolean
  onClaimed?: () => void
}

export default function ClaimSightingButton({ sightingId, spotterId, alreadyClaimed, onClaimed }: Props) {
  const supabase = createClient()
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const dialogRef = useRef<HTMLDivElement>(null)
  useFocusTrap(open, dialogRef, () => setOpen(false))

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setCurrentUserId(user.id)
      const { data } = await supabase.from('vehicles').select('id, year, make, model, color, slug').eq('owner_id', user.id).eq('is_public', true)
      setVehicles((data || []) as Vehicle[])
    })
  }, [])

  const claim = async (vehicleId: string) => {
    setBusy(true)
    const { error, count } = await supabase.from('sightings').update({ claimed_vehicle_id: vehicleId }, { count: 'exact' }).eq('id', sightingId)
    setBusy(false)
    if (error) { setMessage('Claim failed: ' + error.message); return }
    if (count === 0) { setMessage('Blocked — apply migration 019 in Supabase to enable claiming.'); return }
    setOpen(false)
    setMessage('')
    onClaimed?.()
  }

  // Don't show if: not logged in, user is the spotter, sighting already claimed, or user has no vehicles
  if (!currentUserId || currentUserId === spotterId || alreadyClaimed || vehicles.length === 0) return null

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{ padding: '6px 12px', borderRadius: '6px', background: 'rgba(95, 168, 221, 0.1)', border: '1px solid rgba(95, 168, 221, 0.3)', color: 'var(--color-link)', fontSize: '11px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
      >
        Claim this ride
      </button>

      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setOpen(false)}>
          <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="claim-sighting-title" className="glass overlay-pop" style={{ width: '100%', maxWidth: '420px', padding: '24px' }} onClick={(e) => e.stopPropagation()}>
            <h3 id="claim-sighting-title" style={{ fontSize: '18px', fontWeight: 700, color: '#1a1a1a', marginBottom: '6px' }}>Is this one of your rides?</h3>
            <p style={{ fontSize: '12px', color: '#2c3e50', marginBottom: '16px' }}>Pick the vehicle in this sighting. Only you (as the owner) can claim it.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
              {vehicles.map(v => (
                <button
                  key={v.id}
                  disabled={busy}
                  onClick={() => claim(v.id)}
                  style={{ padding: '12px 14px', borderRadius: '8px', background: '#f0f0f0', border: '1px solid #d4d4d4', color: '#1a1a1a', fontSize: '13px', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
                >
                  {v.year} {v.make} {v.model}{v.color ? ` · ${v.color}` : ''}
                </button>
              ))}
            </div>
            {message && <p role="alert" style={{ fontSize: '12px', color: 'var(--color-danger)', marginBottom: '10px' }}>{message}</p>}
            <button onClick={() => setOpen(false)} style={{ width: '100%', padding: '10px', borderRadius: '6px', background: '#f5f5f5', border: '1px solid #e4e4e4', color: '#2c3e50', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}
    </>
  )
}
