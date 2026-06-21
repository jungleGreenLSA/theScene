'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function FollowButton({ targetUserId, targetUsername }: { targetUserId: string; targetUsername: string }) {
  const supabase = createClient()
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isOwnProfile, setIsOwnProfile] = useState(false)

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      if (user.id === targetUserId) { setIsOwnProfile(true); return }

      const { data } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
        .single()

      if (data) setIsFollowing(true)
    }
    check()
  }, [targetUserId])

  if (isOwnProfile) return null

  const handleFollow = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/auth/login'; return }

    setLoading(true)
    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', targetUserId)
      setIsFollowing(false)
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: targetUserId })
      setIsFollowing(true)
    }
    setLoading(false)
  }

  return (
    <button
      onClick={handleFollow}
      disabled={loading}
      aria-pressed={isFollowing}
      style={{
        padding: '8px 20px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer', border: 'none',
        transition: 'all 0.2s', opacity: loading ? 0.5 : 1,
        background: isFollowing ? '#f5f5f5' : '#2c79c4',
        color: isFollowing ? '#555555' : 'white',
        outline: isFollowing ? '1px solid #e4e4e4' : 'none',
      }}
    >
      {isFollowing ? 'Following' : 'Follow'}
    </button>
  )
}
