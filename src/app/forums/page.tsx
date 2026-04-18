import Link from 'next/link'
import { FORUM_CATEGORIES } from './data'

export const metadata = {
  title: 'Forums',
  description: 'Community forums — tech, shows, introductions, and the off-topic lounge.',
}

export default function ForumsIndex() {
  const totalThreads = FORUM_CATEGORIES.flatMap(c => c.children).reduce((s, f) => s + f.threads, 0)
  const totalPosts = FORUM_CATEGORIES.flatMap(c => c.children).reduce((s, f) => s + f.posts, 0)

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '14px 12px 40px' }}>
      {/* Breadcrumb */}
      <div className="forum-breadcrumb">
        <Link href="/">Home</Link>
        <span className="sep">›</span>
        <span>Forums</span>
      </div>

      {/* Page heading */}
      <section className="section-block" style={{ marginBottom: '14px' }}>
        <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#1a1a1a' }}>theScene Forums</h1>
            <p style={{ fontSize: '13px', color: '#4c4c4c', marginTop: '2px' }}>
              {totalThreads.toLocaleString()} threads · {totalPosts.toLocaleString()} posts
            </p>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <Link href="/auth/register" className="btn-neon">New Thread</Link>
            <Link href="/feed" className="btn-outline">Back to Feed</Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      {FORUM_CATEGORIES.map(cat => (
        <section key={cat.id} className="section-block" style={{ marginBottom: '14px' }}>
          <div className="section-head">
            <h2>{cat.title}</h2>
            <span style={{ color: '#c9c9c9', fontSize: '11px', fontWeight: 400 }}>{cat.description}</span>
          </div>
          <div style={{ padding: '0' }}>
            <table className="forum-table">
              <thead>
                <tr>
                  <th style={{ width: '58%' }}>Sub-Forum</th>
                  <th style={{ width: '60px', textAlign: 'center' }}>Threads</th>
                  <th style={{ width: '60px', textAlign: 'center' }}>Posts</th>
                  <th>Last Post</th>
                </tr>
              </thead>
              <tbody>
                {cat.children.map(sub => (
                  <tr key={sub.slug}>
                    <td>
                      <span className="forum-cell-title">
                        <Link href={`/forums/${sub.slug}`}>{sub.title}</Link>
                      </span>
                      <span className="forum-cell-desc">{sub.description}</span>
                    </td>
                    <td className="forum-num">{sub.threads.toLocaleString()}</td>
                    <td className="forum-num">{sub.posts.toLocaleString()}</td>
                    <td>
                      <div className="forum-lastpost">
                        <Link href={`/forums/${sub.slug}/${sub.lastPost.threadSlug}`} style={{ color: '#1a1a1a', fontWeight: 700 }}>
                          {sub.lastPost.threadTitle}
                        </Link>
                        <div>
                          by <strong>{sub.lastPost.username}</strong> · {sub.lastPost.when}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      {/* Footer disclaimer — this prototype is unauthenticated mock data */}
      <p style={{ fontSize: '11px', color: '#666', textAlign: 'center', marginTop: '12px', fontStyle: 'italic' }}>
        Forums prototype — threads and posts shown here are placeholder content while we dial in the layout.
      </p>
    </div>
  )
}
