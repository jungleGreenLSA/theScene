'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface PropsButtonProps {
  vehicleId: string
  initialCount: number
}

export default function PropsButton({ vehicleId, initialCount }: PropsButtonProps) {
  const [count, setCount] = useState(initialCount)
  const [propped, setPropped] = useState(false)
  const [animating, setAnimating] = useState(false)
  const supabase = createClient()

  const handleProps = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      window.location.href = '/auth/login'
      return
    }

    if (propped) {
      // Remove prop
      await supabase
        .from('props')
        .delete()
        .eq('user_id', user.id)
        .eq('target_type', 'vehicle')
        .eq('target_id', vehicleId)

      setCount(c => c - 1)
      setPropped(false)
    } else {
      // Add prop
      const { error } = await supabase.from('props').insert({
        user_id: user.id,
        target_type: 'vehicle',
        target_id: vehicleId,
        reaction: 'props',
      })

      if (!error) {
        setCount(c => c + 1)
        setPropped(true)
        setAnimating(true)
        setTimeout(() => setAnimating(false), 600)
      }
    }
  }

  return (
    <button
      onClick={handleProps}
      style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '0', background: 'none', border: 'none',
        fontSize: '14px', fontWeight: 600, cursor: 'pointer',
        color: propped ? '#fb923c' : '#8892a4',
        transition: 'all 0.2s',
        transform: animating ? 'scale(1.1)' : 'scale(1)',
      }}
    >
      <span style={{ fontSize: '16px' }}>🤙</span>
      <span>{count} Props</span>
    </button>
  )
}
