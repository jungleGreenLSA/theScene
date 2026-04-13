'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Post {
  id: string
  content: string
  props_count: number
  comment_count: number
  created_at: string
  author: {
    username: string
    display_name: string
    avatar_url: string
  }
  images: { image_url: string; sort_order: number }[]
}

export default function FeedPage() {
  const supabase = createClient()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    const fetchPosts = async () => {
      const { data } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles(username, display_name, avatar_url),
          images:post_images(image_url, sort_order)
        `)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .limit(48)

      setPosts((data || []) as Post[])
      setLoading(false)
    }
    fetchPosts()
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Feed</h1>
          <p className="text-muted-light text-sm mt-1">Latest from The Scene community</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex glass overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 text-xs font-semibold transition-colors ${viewMode === 'grid' ? 'bg-purple/20 text-purple-light' : 'text-muted'}`}
            >
              ▦ Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 text-xs font-semibold transition-colors ${viewMode === 'list' ? 'bg-purple/20 text-purple-light' : 'text-muted'}`}
            >
              ☰ List
            </button>
          </div>
          <Link href="/feed/new" className="btn-primary text-xs">
            New Post
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="aspect-square bg-surface-light rounded-lg animate-pulse" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="glass p-16 text-center">
          <span className="text-5xl block mb-4">📸</span>
          <h2 className="text-xl font-bold mb-2">No posts yet</h2>
          <p className="text-muted-light mb-6">Be the first to share something with The Scene.</p>
          <Link href="/feed/new" className="btn-neon">Create a Post</Link>
        </div>
      ) : viewMode === 'grid' ? (
        /* ===== INSTAGRAM-STYLE GRID ===== */
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {posts.map((post) => (
            <button
              key={post.id}
              onClick={() => setSelectedPost(post)}
              className="aspect-square bg-surface-light rounded-lg overflow-hidden relative group"
            >
              {post.images && post.images.length > 0 ? (
                <img
                  src={post.images[0].image_url}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-4">
                  <p className="text-sm text-muted-light line-clamp-4 text-center">{post.content}</p>
                </div>
              )}
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                <span className="text-white text-sm font-semibold">🤙 {post.props_count || 0}</span>
                <span className="text-white text-sm font-semibold">💬 {post.comment_count || 0}</span>
              </div>
              {/* Multi-image indicator */}
              {post.images && post.images.length > 1 && (
                <div className="absolute top-2 right-2 bg-black/50 rounded px-1.5 py-0.5 text-[10px] text-white">
                  +{post.images.length - 1}
                </div>
              )}
            </button>
          ))}
        </div>
      ) : (
        /* ===== FACEBOOK-STYLE LIST ===== */
        <div className="max-w-2xl mx-auto space-y-6">
          {posts.map((post) => (
            <article key={post.id} className="glass p-6 card-hover">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-surface-light flex items-center justify-center overflow-hidden">
                  {post.author?.avatar_url ? (
                    <img src={post.author.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm text-muted">
                      {post.author?.username?.charAt(0).toUpperCase() || '?'}
                    </span>
                  )}
                </div>
                <div>
                  <Link href={`/user/${post.author?.username}`} className="text-sm font-semibold text-foreground hover:text-purple-light">
                    {post.author?.display_name || post.author?.username}
                  </Link>
                  <p className="text-xs text-muted">
                    {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {post.content && (
                <p className="text-foreground mb-4 leading-relaxed">{post.content}</p>
              )}

              {post.images && post.images.length > 0 && (
                <div className={`grid gap-2 mb-4 ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  {post.images.slice(0, 4).map((img, i) => (
                    <div key={i} className="rounded-lg overflow-hidden bg-surface-light aspect-video">
                      <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-6 pt-3 border-t border-border">
                <button className="reaction flex items-center gap-2 text-sm text-muted-light hover:text-neon-light py-1">
                  🤙 <span>{post.props_count || 0}</span>
                </button>
                <button className="reaction flex items-center gap-2 text-sm text-muted-light hover:text-purple-light py-1">
                  🔥 <span>Fire</span>
                </button>
                <button className="reaction flex items-center gap-2 text-sm text-muted-light hover:text-purple-light py-1">
                  💬 <span>{post.comment_count || 0}</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* ===== POST DETAIL MODAL (opens when clicking grid item) ===== */}
      {selectedPost && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedPost(null)} />
          <div className="relative glass max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedPost(null)}
              className="absolute top-4 right-4 text-muted-light hover:text-foreground text-2xl z-10"
            >
              &times;
            </button>

            {/* Images */}
            {selectedPost.images && selectedPost.images.length > 0 && (
              <div className="bg-surface-light">
                <img
                  src={selectedPost.images[0].image_url}
                  alt=""
                  className="w-full max-h-[50vh] object-contain"
                />
                {selectedPost.images.length > 1 && (
                  <div className="flex gap-2 p-3 overflow-x-auto">
                    {selectedPost.images.map((img, i) => (
                      <img key={i} src={img.image_url} alt="" className="w-20 h-20 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity" />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Content */}
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-surface-light flex items-center justify-center overflow-hidden">
                  {selectedPost.author?.avatar_url ? (
                    <img src={selectedPost.author.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm text-muted">
                      {selectedPost.author?.username?.charAt(0).toUpperCase() || '?'}
                    </span>
                  )}
                </div>
                <div>
                  <Link href={`/user/${selectedPost.author?.username}`} className="text-sm font-semibold text-foreground hover:text-purple-light">
                    {selectedPost.author?.display_name || selectedPost.author?.username}
                  </Link>
                  <p className="text-xs text-muted">
                    {new Date(selectedPost.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {selectedPost.content && (
                <p className="text-foreground leading-relaxed mb-4">{selectedPost.content}</p>
              )}

              <div className="flex items-center gap-6 pt-4 border-t border-border">
                <button className="reaction flex items-center gap-2 text-sm text-muted-light hover:text-neon-light">
                  🤙 <span>{selectedPost.props_count || 0} Props</span>
                </button>
                <button className="reaction flex items-center gap-2 text-sm text-muted-light hover:text-neon-light">
                  🔥 <span>Fire</span>
                </button>
                <button className="reaction flex items-center gap-2 text-sm text-muted-light hover:text-neon-light">
                  🔧 <span>Wrench</span>
                </button>
                <button className="reaction flex items-center gap-2 text-sm text-muted-light hover:text-neon-light">
                  🏆 <span>Trophy</span>
                </button>
                <button className="reaction flex items-center gap-2 text-sm text-muted-light hover:text-neon-light">
                  🏁 <span>Checkered</span>
                </button>
              </div>

              {/* Comment section placeholder */}
              <div className="mt-6 pt-4 border-t border-border">
                <h3 className="text-sm font-semibold text-foreground mb-3">Comments</h3>
                <div className="flex gap-2">
                  <input className="input flex-1" placeholder="Add a comment..." />
                  <button className="btn-primary text-xs">Post</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
