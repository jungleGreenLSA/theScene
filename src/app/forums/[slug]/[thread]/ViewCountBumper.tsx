'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props { threadId: string }

export default function ViewCountBumper({ threadId }: Props) {
  const bumpedRef = useRef(false)

  useEffect(() => {
    if (bumpedRef.current) return
    bumpedRef.current = true
    const supabase = createClient()
    supabase.rpc('increment_thread_view', { p_thread_id: threadId }).then(() => {})
  }, [threadId])

  return null
}
