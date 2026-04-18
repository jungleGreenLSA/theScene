'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Props {
  threadId: string
  isPinned: boolean
  isLocked: boolean
}

export default function ThreadModTools({ threadId, isPinned, isLocked }: Props) {
  const [pinned, setPinned] = useState(isPinned)
  const [locked, setLocked] = useState(isLocked)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const toggle = async (field: 'is_pinned' | 'is_locked', next: boolean) => {
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('forum_threads').update({ [field]: next }).eq('id', threadId)
    if (!error) {
      if (field === 'is_pinned') setPinned(next)
      if (field === 'is_locked') setLocked(next)
      router.refresh()
    }
    setSaving(false)
  }

  return (
    <div style={{ display: 'flex', gap: '6px' }}>
      <button
        onClick={() => toggle('is_pinned', !pinned)}
        disabled={saving}
        className={pinned ? 'btn-neon' : 'btn-outline'}
        style={{ padding: '5px 12px', fontSize: '11px' }}
      >
        {pinned ? 'Unpin' : 'Pin'}
      </button>
      <button
        onClick={() => toggle('is_locked', !locked)}
        disabled={saving}
        className={locked ? 'btn-danger' : 'btn-outline'}
        style={{ padding: '5px 12px', fontSize: '11px' }}
      >
        {locked ? 'Unlock' : 'Lock'}
      </button>
    </div>
  )
}
