import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSubForumBySlug, listThreads, formatRelative } from '@/lib/forums'
import { createClient } from '@/lib/supabase/server'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const forum = await getSubForumBySlug(slug)
  return {
    title: forum ? forum.title : 'Forum',
    description: forum?.description || undefined,
  }
}

export const dynamic = 'force-dynamic'

export default async function SubForumPage({ params }: Props) {
  const { slug } = await params
  const forum = await getSubForumBySlug(slug)
  if (!forum) notFound()

  const threads = await listThreads(forum.id)
  const pinned = threads.filter(t => t.is_pinned)
  const regular = threads.filter(t => !t.is_pinned)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '14px 12px 40px' }}>
      <div className="forum-breadcrumb">
        <Link href="/">Home</Link>
        <span className="sep">›</span>
        <Link href="/forums">Forums</Link>
        <span className="sep">›</span>
        <span>{forum.title}</span>
      </div>

      <section className="section-block" style={{ marginBottom: '14px' }}>
        <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#1a1a1a' }}>{forum.title}</h1>
            {forum.description && <p style={{ fontSize: '13px', color: '#4c4c4c', marginTop: '2px' }}>{forum.description}</p>}
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {user ? (
              <Link href={`/forums/${forum.slug}/new`} className="btn-neon">New Thread</Link>
            ) : (
              <Link href={`/auth/login?next=/forums/${forum.slug}`} className="btn-neon">Sign in to Post</Link>
            )}
          </div>
        </div>
      </section>

      {threads.length === 0 ? (
        <div className="section-block" style={{ padding: '40px 20px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: '#4c4c4c', marginBottom: '10px' }}>
            No threads yet. Be the first to post.
          </p>
          {user ? (
            <Link href={`/forums/${forum.slug}/new`} className="btn-neon">Start the first thread</Link>
          ) : (
            <Link href="/auth/register" className="btn-neon">Join to post</Link>
          )}
        </div>
      ) : (
        <table className="forum-table">
          <thead>
            <tr>
              <th style={{ width: '60%' }}>Thread · Started by</th>
              <th style={{ width: '80px', textAlign: 'center' }}>Replies</th>
              <th style={{ width: '80px', textAlign: 'center' }}>Views</th>
              <th>Last Post</th>
            </tr>
          </thead>
          <tbody>
            {pinned.map(thread => (
              <tr key={thread.id} style={{ background: '#fff8eb' }}>
                <td>
                  <span className="forum-cell-title">
                    <span className="forum-pill">Pinned</span>
                    {thread.is_locked && <span className="forum-pill" style={{ background: '#555' }}>Locked</span>}
                    <Link href={`/forums/${forum.slug}/${thread.slug}`}>{thread.title}</Link>
                  </span>
                  <span className="forum-cell-desc">
                    by <strong>{thread.author_username || '—'}</strong> · {formatRelative(thread.created_at)}
                  </span>
                </td>
                <td className="forum-num">{thread.reply_count}</td>
                <td className="forum-num">{thread.view_count.toLocaleString()}</td>
                <td>
                  <div className="forum-lastpost">
                    by <strong>{thread.last_post_username || '—'}</strong>
                    <div>{formatRelative(thread.last_post_at)}</div>
                  </div>
                </td>
              </tr>
            ))}
            {regular.map(thread => (
              <tr key={thread.id}>
                <td>
                  <span className="forum-cell-title">
                    {thread.is_locked && <span className="forum-pill" style={{ background: '#555' }}>Locked</span>}
                    <Link href={`/forums/${forum.slug}/${thread.slug}`}>{thread.title}</Link>
                  </span>
                  <span className="forum-cell-desc">
                    by <strong>{thread.author_username || '—'}</strong> · {formatRelative(thread.created_at)}
                  </span>
                </td>
                <td className="forum-num">{thread.reply_count}</td>
                <td className="forum-num">{thread.view_count.toLocaleString()}</td>
                <td>
                  <div className="forum-lastpost">
                    by <strong>{thread.last_post_username || '—'}</strong>
                    <div>{formatRelative(thread.last_post_at)}</div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
        <Link href="/forums" style={{ fontSize: '12px', color: '#1c58b8', fontWeight: 700 }}>
          ‹ Back to Forums
        </Link>
      </div>
    </div>
  )
}
