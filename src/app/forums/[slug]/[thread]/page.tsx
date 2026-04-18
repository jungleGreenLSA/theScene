import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSubForum, getThread, getPostsForThread } from '../../data'

interface Props {
  params: Promise<{ slug: string; thread: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug, thread } = await params
  const forum = getSubForum(slug)
  const t = getThread(slug, thread)
  return {
    title: t ? `${t.title} — ${forum?.title}` : 'Thread',
  }
}

export default async function ThreadPage({ params }: Props) {
  const { slug, thread: threadSlug } = await params
  const forum = getSubForum(slug)
  const thread = getThread(slug, threadSlug)
  if (!forum || !thread) notFound()

  const posts = getPostsForThread(threadSlug)

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '14px 12px 40px' }}>
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
              {thread.pinned && <span className="forum-pill">Pinned</span>}
              {thread.locked && <span className="forum-pill" style={{ background: '#555' }}>Locked</span>}
              {thread.title}
            </h1>
            <p style={{ fontSize: '12px', color: '#4c4c4c', marginTop: '2px' }}>
              Started by <strong style={{ color: '#1a1a1a' }}>{thread.author}</strong> on {thread.createdAt} · {thread.replies} replies · {thread.views.toLocaleString()} views
            </p>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <Link href="/auth/register" className="btn-neon">Reply</Link>
            <Link href={`/forums/${forum.slug}`} className="btn-outline">Back to {forum.title}</Link>
          </div>
        </div>
      </section>

      {/* Posts */}
      {posts.map((post, idx) => (
        <article key={post.id} className="forum-post">
          <aside className="forum-post-meta">
            <div
              className="forum-post-avatar"
              style={{ backgroundColor: post.avatarColor }}
              aria-label={`${post.username} avatar`}
            />
            <Link href={`/user/${post.username}`} className="forum-post-username">
              {post.username}
            </Link>
            <span className="forum-post-rank">{post.rank}</span>
            <div>
              <div className="forum-post-stat">
                <span>Member since</span>
                <strong>{post.memberSince}</strong>
              </div>
              <div className="forum-post-stat">
                <span>Posts</span>
                <strong>{post.postCount.toLocaleString()}</strong>
              </div>
              <div className="forum-post-stat">
                <span>Location</span>
                <strong>{post.location}</strong>
              </div>
            </div>
          </aside>

          <div className="forum-post-body">
            <div className="forum-post-date">
              <span>
                <strong>#{idx + 1}</strong> · Posted {post.createdAt}
              </span>
              <span style={{ fontSize: '11px', color: '#888' }}>
                <a href="#" style={{ color: '#1c58b8' }}>Quote</a>
                <span style={{ margin: '0 6px', color: '#c4c4c4' }}>|</span>
                <a href="#" style={{ color: '#1c58b8' }}>Report</a>
              </span>
            </div>

            <div className="forum-post-content">
              {post.quote && (
                <blockquote>
                  <cite>Originally posted by {post.quote.from}</cite>
                  {post.quote.text}
                </blockquote>
              )}
              {post.content.split('\n\n').map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>

            {post.signature && (
              <div className="forum-sig">
                {post.signature.split('\n').map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>
            )}
          </div>
        </article>
      ))}

      {/* Bottom bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <div className="forum-pagination">
          <span className="current">1</span>
          <a href="#">2</a>
          <a href="#">»</a>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <Link href="/auth/register" className="btn-neon">Reply</Link>
          <Link href={`/forums/${forum.slug}`} className="btn-outline">Back to {forum.title}</Link>
        </div>
      </div>

      <p style={{ fontSize: '11px', color: '#666', textAlign: 'center', marginTop: '14px', fontStyle: 'italic' }}>
        Forums prototype — posts shown are placeholder content while we dial in the layout.
      </p>
    </div>
  )
}
