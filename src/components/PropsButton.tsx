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
      className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all ${
        propped
          ? 'bg-neon/20 border border-neon/40 text-neon-light'
          : 'bg-surface border border-border text-muted-light hover:border-neon/40 hover:text-neon-light'
      } ${animating ? 'scale-110' : ''}`}
    >
      <span className={`text-lg ${animating ? 'animate-bounce' : ''}`}>🤙</span>
      <span>{count} Props</span>
    </button>
  )
}
