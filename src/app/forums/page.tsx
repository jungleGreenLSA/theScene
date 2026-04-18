import Link from 'next/link'
import { listCategoriesAndForums, formatRelative } from '@/lib/forums'
import { createClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'Forums',
  description: 'Community forums — tech, shows, introductions, and the off-topic lounge.',
}

export const dynamic = 'force-dynamic'

export default async function ForumsIndex() {
  const { categories, subForumsByCategory, statsBySubForum } = await listCategoriesAndForums()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const totalThreads = Object.values(statsBySubForum).reduce((s, x) => s + x.thread_count, 0)
  const totalPosts = Object.values(statsBySubForum).reduce((s, x) => s + x.post_count, 0)

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '14px 12px 40px' }}>
      <div className="forum-breadcrumb">
        <Link href="/">Home</Link>
        <span className="sep">›</span>
        <span>Forums</span>
      </div>

      <section className="section-block" style={{ marginBottom: '14px' }}>
        <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#1a1a1a' }}>theScene Forums</h1>
            <p style={{ fontSize: '13px', color: '#4c4c4c', marginTop: '2px' }}>
              {totalThreads.toLocaleString()} threads · {totalPosts.toLocaleString()} posts
            </p>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {user ? (
              <Link href="/forums/introductions/new" className="btn-neon">Start a Thread</Link>
            ) : (
              <Link href="/auth/register" className="btn-neon">Join to Post</Link>
            )}
            <Link href="/feed" className="btn-outline">Back to Feed</Link>
          </div>
        </div>
      </section>

      {categories.map(cat => {
        const subs = subForumsByCategory[cat.id] || []
        return (
          <section key={cat.id} className="section-block" style={{ marginBottom: '14px' }}>
            <div className="section-head">
              <h2>{cat.title}</h2>
              {cat.description && <span style={{ color: '#c9c9c9', fontSize: '11px', fontWeight: 400 }}>{cat.description}</span>}
            </div>
            <div style={{ padding: 0 }}>
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
                  {subs.map(sub => {
                    const stats = statsBySubForum[sub.id]
                    return (
                      <tr key={sub.id}>
                        <td>
                          <span className="forum-cell-title">
                            <Link href={`/forums/${sub.slug}`}>{sub.title}</Link>
                          </span>
                          {sub.description && <span className="forum-cell-desc">{sub.description}</span>}
                        </td>
                        <td className="forum-num">{stats?.thread_count?.toLocaleString() ?? 0}</td>
                        <td className="forum-num">{stats?.post_count?.toLocaleString() ?? 0}</td>
                        <td>
                          {stats?.last_thread_title ? (
                            <div className="forum-lastpost">
                              <Link href={`/forums/${sub.slug}/${stats.last_thread_slug}`} style={{ color: '#1a1a1a', fontWeight: 700 }}>
                                {stats.last_thread_title}
                              </Link>
                              <div>
                                by <strong>{stats.last_post_username || '—'}</strong> · {stats.last_post_at ? formatRelative(stats.last_post_at) : '—'}
                              </div>
                            </div>
                          ) : (
                            <span style={{ fontSize: '11px', color: '#888', fontStyle: 'italic' }}>No threads yet</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )
      })}
    </div>
  )
}
