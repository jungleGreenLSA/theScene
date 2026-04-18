'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function SaveButton({ targetType, targetId }: { targetType: string; targetId: string }) {
  const supabase = createClient()
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/auth/login'; return }

    // Check premium
    const { data: profile } = await supabase.from('profiles').select('subscription_tier').eq('id', user.id).single()
    if (profile?.subscription_tier !== 'premium') {
      window.location.href = '/pricing'
      return
    }

    setLoading(true)

    // Get or create collection
    let { data: collection } = await supabase.from('collections').select('id').eq('user_id', user.id).eq('name', 'Saved').single()
    if (!collection) {
      const { data: newCol } = await supabase.from('collections').insert({ user_id: user.id, name: 'Saved' }).select().single()
      collection = newCol
    }

    if (!collection) { setLoading(false); return }

    if (saved) {
      await supabase.from('collection_items').delete().eq('collection_id', collection.id).eq('target_type', targetType).eq('target_id', targetId)
      setSaved(false)
    } else {
      await supabase.from('collection_items').insert({ collection_id: collection.id, target_type: targetType, target_id: targetId })
      setSaved(true)
    }
    setLoading(false)
  }

  return (
    <button
      onClick={handleSave}
      disabled={loading}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        fontSize: '12px', fontWeight: 600, color: saved ? '#f97316' : '#8892a4',
        padding: '4px 8px',
        opacity: loading ? 0.5 : 1, transition: 'color 0.15s',
      }}
      title={saved ? 'Unsave' : 'Save to collection (Premium)'}
    >
      {saved ? 'Saved' : 'Save'}
    </button>
  )
}
