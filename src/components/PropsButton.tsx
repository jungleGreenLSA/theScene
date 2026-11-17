'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type TargetType = 'vehicle' | 'event' | 'sighting' | 'event_photo' | 'post'

interface Props {
  targetType: TargetType
  targetId: string
  initialCount?: number
  size?: 'sm' | 'md'
}

export default function PropsButton({ targetType, targetId, initialCount = 0, size = 'md' }: Props) {
  const [count, setCount] = useState(initialCount)
  const [propped, setPropped] = useState(false)
  const [animating, setAnimating] = useState(false)
  const [busy, setBusy] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const [{ count: c }, { data: { user } }] = await Promise.all([
        supabase.from('props').select('id', { count: 'exact', head: true }).eq('target_type', targetType).eq('target_id', targetId),
        supabase.auth.getUser(),
      ])
      setCount(c || 0)
      if (user) {
        const { data } = await supabase.from('props').select('id').eq('user_id', user.id).eq('target_type', targetType).eq('target_id', targetId).maybeSingle()
        setPropped(!!data)
      }
    }
    init()
  }, [targetType, targetId])

  const handleProps = async () => {
    if (busy) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/auth/login'; return }

    setBusy(true)
    if (propped) {
      const { error } = await supabase.from('props').delete().eq('user_id', user.id).eq('target_type', targetType).eq('target_id', targetId)
      if (!error) { setCount(c => Math.max(0, c - 1)); setPropped(false) }
    } else {
      const { error } = await supabase.from('props').insert({ user_id: user.id, target_type: targetType, target_id: targetId, reaction: 'props' })
      if (!error) { setCount(c => c + 1); setPropped(true); setAnimating(true); setTimeout(() => setAnimating(false), 600) }
      else if (error.message.toLowerCase().includes('check constraint')) {
        alert(`Props on ${targetType} requires migration 016 to be applied in Supabase.`)
      }
    }
    setBusy(false)
  }

  const fontSize = size === 'sm' ? '13px' : '14px'

  return (
    <button
      onClick={handleProps}
      disabled={busy}
      style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '0', background: 'none', border: 'none',
        fontSize, fontWeight: 600, cursor: busy ? 'default' : 'pointer',
        color: propped ? '#fb923c' : '#666666',
        transition: 'all 0.2s',
        transform: animating ? 'scale(1.15)' : 'scale(1)',
        opacity: busy ? 0.6 : 1,
      }}
    >
      <span>👍 {count} Props</span>
    </button>
  )
}
