'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface FollowUser {
  id: string
  username: string
  display_name: string
  avatar_url: string
  location: string
}

export default function FollowLists({ userId }: { userId: string }) {
  const supabase = createClient()
  const [tab, setTab] = useState<'followers' | 'following' | null>(null)
  const [followers, setFollowers] = useState<FollowUser[]>([])
  const [following, setFollowing] = useState<FollowUser[]>([])
  const [followerCount, setFollowerCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)

  useEffect(() => {
    const fetchCounts = async () => {
      const { count: fc } = await supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', userId)
      const { count: fgc } = await supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', userId)
      setFollowerCount(fc || 0)
      setFollowingCount(fgc || 0)
    }
    fetchCounts()
  }, [userId])

  const loadFollowers = async () => {
    if (tab === 'followers') { setTab(null); return }
    const { data } = await supabase
      .from('follows')
      .select('follower:profiles!follows_follower_id_fkey(id, username, display_name, avatar_url, location)')
      .eq('following_id', userId)
      .limit(50)
    setFollowers((data || []).map((d: any) => d.follower).filter(Boolean))
    setTab('followers')
  }

  const loadFollowing = async () => {
    if (tab === 'following') { setTab(null); return }
    const { data } = await supabase
      .from('follows')
      .select('following:profiles!follows_following_id_fkey(id, username, display_name, avatar_url, location)')
      .eq('follower_id', userId)
      .limit(50)
    setFollowing((data || []).map((d: any) => d.following).filter(Boolean))
    setTab('following')
  }

  const list = tab === 'followers' ? followers : following

  return (
    <div>
      {/* Counts as clickable buttons */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <button
          onClick={loadFollowers}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0', fontSize: '14px', minHeight: '44px' }}
          aria-expanded={tab === 'followers'}
        >
          <strong className="spec" style={{ color: tab === 'followers' ? '#2dd4bf' : '#e4e1ed' }}>{followerCount}</strong>
          <span className="text-muted-light" style={{ marginLeft: '4px', color: tab === 'followers' ? '#2dd4bf' : undefined }}>followers</span>
        </button>
        <button
          onClick={loadFollowing}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0', fontSize: '14px', minHeight: '44px' }}
          aria-expanded={tab === 'following'}
        >
          <strong className="spec" style={{ color: tab === 'following' ? '#2dd4bf' : '#e4e1ed' }}>{followingCount}</strong>
          <span className="text-muted-light" style={{ marginLeft: '4px', color: tab === 'following' ? '#2dd4bf' : undefined }}>following</span>
        </button>
      </div>

      {/* Expanded list */}
      {tab && (
        <div className="glass" style={{ marginTop: '12px', padding: '16px', maxHeight: '300px', overflowY: 'auto' }}>
          <h4 className="eyebrow" style={{ marginBottom: '12px' }}>
            {tab === 'followers' ? 'Followers' : 'Following'}
          </h4>
          {list.length === 0 ? (
            <p className="text-muted" style={{ fontSize: '13px' }}>None yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {list.map((u) => (
                <Link key={u.id} href={`/user/${u.username}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', borderRadius: '6px', transition: 'background 0.15s' }} className="card-hover">
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', background: '#1b1b23', border: '1px solid rgba(255,255,255,0.08)' }}>
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#2dd4bf', fontWeight: 700 }}>
                          {u.username?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-foreground" style={{ fontSize: '13px', fontWeight: 600 }}>{u.display_name || u.username}</p>
                    {u.location && <p className="text-muted" style={{ fontSize: '11px' }}>{u.location}</p>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
