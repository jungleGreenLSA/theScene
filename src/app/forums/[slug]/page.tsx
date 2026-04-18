import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSubForum, getThreadsForForum } from '../data'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const forum = getSubForum(slug)
  return {
    title: forum ? forum.title : 'Forum',
    description: forum?.description,
  }
}

export default async function SubForumPage({ params }: Props) {
  const { slug } = await params
  const forum = getSubForum(slug)
  if (!forum) notFound()

  const threads = getThreadsForForum(slug)
  const pinned = threads.filter(t => t.pinned)
  const regular = threads.filter(t => !t.pinned)

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
            <p style={{ fontSize: '13px', color: '#4c4c4c', marginTop: '2px' }}>{forum.description}</p>
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <Link href="/auth/register" className="btn-neon">New Thread</Link>
            <div className="forum-pagination">
              <span className="current">1</span>
              <a href="#">2</a>
              <a href="#">3</a>
              <a href="#">»</a>
            </div>
          </div>
        </div>
      </section>

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
            <tr key={thread.slug} style={{ background: '#fff8eb' }}>
              <td>
                <span className="forum-cell-title">
                  <span className="forum-pill">Pinned</span>
                  {thread.locked && <span className="forum-pill" style={{ background: '#555' }}>Locked</span>}
                  <Link href={`/forums/${forum.slug}/${thread.slug}`}>{thread.title}</Link>
                </span>
                <span className="forum-cell-desc">
                  by <strong>{thread.author}</strong> · {thread.createdAt}
                </span>
              </td>
              <td className="forum-num">{thread.replies}</td>
              <td className="forum-num">{thread.views.toLocaleString()}</td>
              <td>
                <div className="forum-lastpost">
                  by <strong>{thread.lastReply.username}</strong>
                  <div>{thread.lastReply.when}</div>
                </div>
              </td>
            </tr>
          ))}
          {regular.map(thread => (
            <tr key={thread.slug}>
              <td>
                <span className="forum-cell-title">
                  <Link href={`/forums/${forum.slug}/${thread.slug}`}>{thread.title}</Link>
                </span>
                <span className="forum-cell-desc">
                  by <strong>{thread.author}</strong> · {thread.createdAt}
                </span>
              </td>
              <td className="forum-num">{thread.replies}</td>
              <td className="forum-num">{thread.views.toLocaleString()}</td>
              <td>
                <div className="forum-lastpost">
                  by <strong>{thread.lastReply.username}</strong>
                  <div>{thread.lastReply.when}</div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', flexWrap: 'wrap', gap: '10px' }}>
        <div className="forum-pagination">
          <span className="current">1</span>
          <a href="#">2</a>
          <a href="#">3</a>
          <a href="#">»</a>
        </div>
        <Link href="/forums" style={{ fontSize: '12px', color: '#1c58b8', fontWeight: 700 }}>
          ‹ Back to Forums
        </Link>
      </div>

      <p style={{ fontSize: '11px', color: '#666', textAlign: 'center', marginTop: '12px', fontStyle: 'italic' }}>
        Forums prototype — threads shown are placeholder content while we dial in the layout.
      </p>
    </div>
  )
}
