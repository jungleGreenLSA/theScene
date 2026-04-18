import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  getSubForumBySlug,
  getThreadBySlug,
  listPosts,
  formatRelative,
  formatMemberSince,
  avatarColorForUsername,
} from '@/lib/forums'
import { createClient } from '@/lib/supabase/server'
import ReplyComposer from './ReplyComposer'
import ThreadModTools from './ThreadModTools'
import ViewCountBumper from './ViewCountBumper'

interface Props {
  params: Promise<{ slug: string; thread: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug, thread } = await params
  const forum = await getSubForumBySlug(slug)
  if (!forum) return { title: 'Thread' }
  const t = await getThreadBySlug(forum.id, thread)
  return { title: t ? `${t.title} — ${forum.title}` : 'Thread' }
}

export const dynamic = 'force-dynamic'

export default async function ThreadPage({ params }: Props) {
  const { slug, thread: threadSlug } = await params
  const forum = await getSubForumBySlug(slug)
  if (!forum) notFound()

  const thread = await getThreadBySlug(forum.id, threadSlug)
  if (!thread) notFound()

  const posts = await listPosts(thread.id)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let isAdmin = false
  if (user) {
    const { data: me } = await supabase.from('profiles').select('username').eq('id', user.id).maybeSingle()
    isAdmin = me?.username === 'squizzle'
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '14px 12px 40px' }}>
      <ViewCountBumper threadId={thread.id} />

      <div className="forum-breadcrumb">
        <Link href="/">Home</Link>
        <span className="sep">›</span>
        <Link href="/forums">Forums</Link>
        <span className="sep">›</span>
        <Link href={`/forums/${forum.slug}`}>{forum.title}</Link>
        <span className="sep">›</span>
        <span>{thread.title}</span>
      </div>

      <section className="section-block" style={{ marginBottom: '14px' }}>
        <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: '18px', fontWeight: 800, color: '#1a1a1a' }}>
              {thread.is_pinned && <span className="forum-pill">Pinned</span>}
              {thread.is_locked && <span className="forum-pill" style={{ background: '#555' }}>Locked</span>}
              {thread.title}
            </h1>
            <p style={{ fontSize: '12px', color: '#4c4c4c', marginTop: '2px' }}>
              Started by <strong style={{ color: '#1a1a1a' }}>{thread.author_username || '—'}</strong> on {new Date(thread.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {thread.reply_count} {thread.reply_count === 1 ? 'reply' : 'replies'} · {thread.view_count.toLocaleString()} views
            </p>
          </div>
          {isAdmin && (
            <ThreadModTools threadId={thread.id} isPinned={thread.is_pinned} isLocked={thread.is_locked} />
          )}
        </div>
      </section>

      {posts.map((post, idx) => {
        const avatarStyle: React.CSSProperties = post.author_avatar_url
          ? { backgroundImage: `url(${post.author_avatar_url})` }
          : { backgroundColor: avatarColorForUsername(post.author_username) }
        return (
          <article key={post.id} className="forum-post">
            <aside className="forum-post-meta">
              <div
                className="forum-post-avatar"
                style={avatarStyle}
                aria-label={`${post.author_username || 'user'} avatar`}
              />
              {post.author_username ? (
                <Link href={`/user/${post.author_username}`} className="forum-post-username">
                  {post.author_username}
                </Link>
              ) : (
                <span className="forum-post-username">(deleted)</span>
              )}
              <span className="forum-post-rank">{post.author_rank || 'Member'}</span>
              <div>
                <div className="forum-post-stat">
                  <span>Member since</span>
                  <strong>{formatMemberSince(post.author_member_since)}</strong>
                </div>
                <div className="forum-post-stat">
                  <span>Posts</span>
                  <strong>{post.author_post_count.toLocaleString()}</strong>
                </div>
                {post.author_location && (
                  <div className="forum-post-stat">
                    <span>Location</span>
                    <strong>{post.author_location}</strong>
                  </div>
                )}
              </div>
            </aside>

            <div className="forum-post-body">
              <div className="forum-post-date">
                <span>
                  <strong>#{idx + 1}</strong> · Posted {formatRelative(post.created_at)}
                  {post.updated_at !== post.created_at && (
                    <span style={{ color: '#888', fontStyle: 'italic', marginLeft: '6px' }}>
                      (edited {formatRelative(post.updated_at)})
                    </span>
                  )}
                </span>
              </div>
              <div className="forum-post-content">
                {post.quote_of_id && post.quote_of_excerpt && (
                  <blockquote>
                    <cite>Originally posted by {post.quote_of_author || 'someone'}</cite>
                    {post.quote_of_excerpt}
                  </blockquote>
                )}
                {post.content.split('\n\n').map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
              {post.author_signature && (
                <div className="forum-sig">
                  {post.author_signature.split('\n').map((line, i) => (
                    <div key={i}>{line}</div>
                  ))}
                </div>
              )}
            </div>
          </article>
        )
      })}

      {/* Reply composer — only signed-in users, and only on unlocked threads
          unless the viewer is an admin. */}
      {user && (!thread.is_locked || isAdmin) ? (
        <ReplyComposer threadId={thread.id} forumSlug={forum.slug} threadSlug={thread.slug} />
      ) : !user ? (
        <div className="section-block" style={{ padding: '16px', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', color: '#4c4c4c', marginBottom: '10px' }}>
            Sign in to reply to this thread.
          </p>
          <Link href={`/auth/login?next=/forums/${forum.slug}/${thread.slug}`} className="btn-neon">
            Sign In
          </Link>
        </div>
      ) : (
        <div className="section-block" style={{ padding: '16px', textAlign: 'center', color: '#4c4c4c', fontSize: '13px' }}>
          This thread is locked. No new replies.
        </div>
      )}

      <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <Link href={`/forums/${forum.slug}`} style={{ fontSize: '12px', color: '#1c58b8', fontWeight: 700 }}>
          ‹ Back to {forum.title}
        </Link>
      </div>
    </div>
  )
}
