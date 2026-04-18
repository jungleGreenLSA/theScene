import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getSubForumBySlug } from '@/lib/forums'
import { createClient } from '@/lib/supabase/server'
import NewThreadForm from './NewThreadForm'

interface Props {
  params: Promise<{ slug: string }>
}

export const dynamic = 'force-dynamic'

export default async function NewThreadPage({ params }: Props) {
  const { slug } = await params
  const forum = await getSubForumBySlug(slug)
  if (!forum) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/auth/login?next=/forums/${slug}/new`)

  // Admin-only sub-forums (e.g. Announcements) gate thread creation.
  if (forum.is_admin_only) {
    const { data: me } = await supabase.from('profiles').select('username').eq('id', user.id).maybeSingle()
    if (me?.username !== 'squizzle') {
      return (
        <div style={{ maxWidth: '700px', margin: '0 auto', padding: '40px 12px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '10px' }}>Announcements is admin-only</h1>
          <p style={{ fontSize: '13px', color: '#4c4c4c', marginBottom: '16px' }}>
            Only the moderator can start threads in {forum.title}. Post in a different sub-forum instead.
          </p>
          <Link href={`/forums/${slug}`} className="btn-outline">Back to {forum.title}</Link>
        </div>
      )
    }
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '14px 12px 40px' }}>
      <div className="forum-breadcrumb">
        <Link href="/">Home</Link>
        <span className="sep">›</span>
        <Link href="/forums">Forums</Link>
        <span className="sep">›</span>
        <Link href={`/forums/${forum.slug}`}>{forum.title}</Link>
        <span className="sep">›</span>
        <span>New Thread</span>
      </div>

      <section className="section-block">
        <div className="section-head">
          <h2>Start a Thread in {forum.title}</h2>
        </div>
        <div style={{ padding: '16px' }}>
          <NewThreadForm forumSlug={forum.slug} subForumId={forum.id} userId={user.id} />
        </div>
      </section>
    </div>
  )
}
