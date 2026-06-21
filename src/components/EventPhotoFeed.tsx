'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface PhotoPost {
  id: string
  image_url: string
  caption: string
  props_count: number
  comment_count: number
  created_at: string
  author: {
    username: string
    display_name: string
    avatar_url: string
  }
  vehicle: {
    year: number
    make: string
    model: string
    color: string
    slug: string
    owner_id: string
  } | null
}

export default function EventPhotoFeed({ photoPosts }: { photoPosts: PhotoPost[] }) {
  const supabase = createClient()
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null)
  const [commentText, setCommentText] = useState('')
  const [propCounts, setPropCounts] = useState<Record<string, number>>(
    Object.fromEntries(photoPosts.map(p => [p.id, p.props_count || 0]))
  )

  const handleProp = async (photoId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      window.location.href = '/auth/login'
      return
    }

    const { error } = await supabase.from('props').insert({
      user_id: user.id,
      target_type: 'event_photo',
      target_id: photoId,
      reaction: 'props',
    })

    if (!error) {
      setPropCounts(prev => ({ ...prev, [photoId]: (prev[photoId] || 0) + 1 }))
    }
  }

  const handleComment = async (photoId: string) => {
    if (!commentText.trim()) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      window.location.href = '/auth/login'
      return
    }

    await supabase.from('event_photo_comments').insert({
      photo_post_id: photoId,
      author_id: user.id,
      content: commentText.trim(),
    })

    setCommentText('')
  }

  if (photoPosts.length === 0) {
    return (
      <div className="glass p-8 text-center">
        <p className="text-muted-light">No photos have been shared from this event yet. Be the first!</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {photoPosts.map((post) => (
        <div key={post.id} className="glass overflow-hidden card-hover">
          {/* Attribution header */}
          <div className="p-4 flex items-center gap-3 border-b border-border">
            <Link href={`/user/${post.author?.username}`} className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-surface-light overflow-hidden flex items-center justify-center">
                {post.author?.avatar_url ? (
                  <img src={post.author.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm text-muted">{post.author?.username?.charAt(0).toUpperCase()}</span>
                )}
              </div>
            </Link>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground">
                <Link href={`/user/${post.author?.username}`} className="font-semibold hover:text-teal-light">
                  {post.author?.display_name || post.author?.username}
                </Link>
                {post.vehicle && (
                  <>
                    {' '}
                    <span className="text-muted-light">—</span>
                    {' '}
                    <Link href={`/user/${post.author?.username}/${post.vehicle.slug}`} className="text-teal hover:text-teal-light">
                      <span className="spec">{post.vehicle.year} {post.vehicle.make} {post.vehicle.model}</span>
                    </Link>
                  </>
                )}
                {' '}
                <span className="text-muted-light">posted a photo</span>
              </p>
              <p className="text-xs text-muted">
                {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                {' at '}
                {new Date(post.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </p>
            </div>
          </div>

          {/* Photo */}
          <div className="bg-surface-light">
            <img
              src={post.image_url}
              alt={post.caption || 'Event photo'}
              className="w-full max-h-[500px] object-contain cursor-pointer"
              onClick={() => setExpandedPhoto(expandedPhoto === post.id ? null : post.id)}
            />
          </div>

          {/* Caption & Actions */}
          <div className="p-4">
            {post.caption && (
              <p className="text-sm text-foreground mb-3">{post.caption}</p>
            )}

            <div className="flex items-center gap-5 pt-2 border-t border-border">
              <button onClick={() => handleProp(post.id)} className="reaction flex items-center gap-2 text-sm text-muted-light hover:text-teal py-1" style={{ minHeight: '44px' }}>
                <span><span className="spec">{propCounts[post.id] || 0}</span> Props</span>
              </button>
              <button
                onClick={() => setExpandedPhoto(expandedPhoto === post.id ? null : post.id)}
                className="reaction flex items-center gap-2 text-sm text-muted-light hover:text-teal py-1"
                style={{ minHeight: '44px' }}
              >
                <span><span className="spec">{post.comment_count || 0}</span> Comments</span>
              </button>
            </div>

            {/* Expanded comment section */}
            {expandedPhoto === post.id && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="input flex-1"
                    placeholder="Add a comment..."
                    maxLength={500}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleComment(post.id) }}
                  />
                  <button
                    onClick={() => handleComment(post.id)}
                    className="btn-primary text-xs"
                    disabled={!commentText.trim()}
                  >
                    Post
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
