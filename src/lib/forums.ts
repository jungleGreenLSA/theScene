// Server-side data access for the /forums surface. All reads go through
// functions here so the pages stay declarative. Writes happen in the
// respective route's client component (new-thread form, reply composer)
// via the client-side Supabase helper.

import { createClient } from '@/lib/supabase/server'

export interface Category {
  id: string
  slug: string
  title: string
  description: string | null
  position: number
}

export interface SubForum {
  id: string
  category_id: string
  slug: string
  title: string
  description: string | null
  position: number
  is_admin_only: boolean
}

export interface SubForumStats {
  sub_forum_id: string
  thread_count: number
  post_count: number
  last_thread_title: string | null
  last_thread_slug: string | null
  last_post_username: string | null
  last_post_at: string | null
}

export interface Thread {
  id: string
  sub_forum_id: string
  slug: string
  title: string
  author_id: string
  author_username: string | null
  is_pinned: boolean
  is_locked: boolean
  reply_count: number
  view_count: number
  last_post_at: string
  last_post_username: string | null
  created_at: string
}

export interface Post {
  id: string
  thread_id: string
  author_id: string
  author_username: string | null
  author_rank: string | null
  author_post_count: number
  author_avatar_url: string | null
  author_location: string | null
  author_signature: string | null
  author_member_since: string | null
  content: string
  quote_of_id: string | null
  quote_of_author: string | null
  quote_of_excerpt: string | null
  created_at: string
  updated_at: string
}

// -------------------- reads --------------------

export async function listCategoriesAndForums(): Promise<{
  categories: Category[]
  subForumsByCategory: Record<string, SubForum[]>
  statsBySubForum: Record<string, SubForumStats>
}> {
  const supabase = await createClient()

  const [{ data: categories }, { data: subs }] = await Promise.all([
    supabase.from('forum_categories').select('*').order('position'),
    supabase.from('sub_forums').select('*').order('position'),
  ])

  const catList = (categories || []) as Category[]
  const subList = (subs || []) as SubForum[]

  const subForumsByCategory: Record<string, SubForum[]> = {}
  for (const s of subList) {
    (subForumsByCategory[s.category_id] ||= []).push(s)
  }

  // Stats: for each sub-forum, get the latest thread plus aggregate counts.
  // Computed from forum_threads rather than a view so the migration stays
  // simple; volumes here are small.
  const statsBySubForum: Record<string, SubForumStats> = {}
  for (const s of subList) {
    const { data: threadRows } = await supabase
      .from('forum_threads')
      .select('id, title, slug, last_post_at, last_post_by, reply_count, is_hidden')
      .eq('sub_forum_id', s.id)
      .eq('is_hidden', false)
      .order('last_post_at', { ascending: false })

    const rows = threadRows || []
    const threadCount = rows.length
    const postCount = rows.reduce((sum, r) => sum + (r.reply_count || 0), 0) + threadCount
    const latest = rows[0]
    let lastUsername: string | null = null
    if (latest?.last_post_by) {
      const { data: p } = await supabase
        .from('profiles').select('username').eq('id', latest.last_post_by).single()
      lastUsername = p?.username || null
    }

    statsBySubForum[s.id] = {
      sub_forum_id: s.id,
      thread_count: threadCount,
      post_count: postCount,
      last_thread_title: latest?.title || null,
      last_thread_slug: latest?.slug || null,
      last_post_username: lastUsername,
      last_post_at: latest?.last_post_at || null,
    }
  }

  return { categories: catList, subForumsByCategory, statsBySubForum }
}

export async function getSubForumBySlug(slug: string): Promise<SubForum | null> {
  const supabase = await createClient()
  const { data } = await supabase.from('sub_forums').select('*').eq('slug', slug).maybeSingle()
  return (data as SubForum) || null
}

export async function listThreads(subForumId: string): Promise<Thread[]> {
  const supabase = await createClient()
  const { data: threads } = await supabase
    .from('forum_threads')
    .select('id, sub_forum_id, slug, title, author_id, is_pinned, is_locked, reply_count, view_count, last_post_at, last_post_by, created_at')
    .eq('sub_forum_id', subForumId)
    .eq('is_hidden', false)
    .order('is_pinned', { ascending: false })
    .order('last_post_at', { ascending: false })

  const rows = (threads || [])
  if (rows.length === 0) return []

  // Batch-lookup usernames for author + last_post_by
  const userIds = new Set<string>()
  for (const t of rows) {
    userIds.add(t.author_id)
    if (t.last_post_by) userIds.add(t.last_post_by)
  }
  const { data: profiles } = await supabase
    .from('profiles').select('id, username').in('id', Array.from(userIds))
  const usernameById = new Map((profiles || []).map(p => [p.id, p.username as string]))

  return rows.map((t): Thread => ({
    id: t.id,
    sub_forum_id: t.sub_forum_id,
    slug: t.slug,
    title: t.title,
    author_id: t.author_id,
    author_username: usernameById.get(t.author_id) || null,
    is_pinned: t.is_pinned,
    is_locked: t.is_locked,
    reply_count: t.reply_count,
    view_count: t.view_count,
    last_post_at: t.last_post_at,
    last_post_username: t.last_post_by ? (usernameById.get(t.last_post_by) || null) : null,
    created_at: t.created_at,
  }))
}

export async function getThreadBySlug(subForumId: string, threadSlug: string): Promise<Thread | null> {
  const supabase = await createClient()
  const { data: t } = await supabase
    .from('forum_threads')
    .select('*')
    .eq('sub_forum_id', subForumId)
    .eq('slug', threadSlug)
    .maybeSingle()
  if (!t) return null

  const userIds = new Set<string>([t.author_id])
  if (t.last_post_by) userIds.add(t.last_post_by)
  const { data: profiles } = await supabase
    .from('profiles').select('id, username').in('id', Array.from(userIds))
  const usernameById = new Map((profiles || []).map(p => [p.id, p.username as string]))

  return {
    id: t.id,
    sub_forum_id: t.sub_forum_id,
    slug: t.slug,
    title: t.title,
    author_id: t.author_id,
    author_username: usernameById.get(t.author_id) || null,
    is_pinned: t.is_pinned,
    is_locked: t.is_locked,
    reply_count: t.reply_count,
    view_count: t.view_count,
    last_post_at: t.last_post_at,
    last_post_username: t.last_post_by ? (usernameById.get(t.last_post_by) || null) : null,
    created_at: t.created_at,
  }
}

export async function listPosts(threadId: string): Promise<Post[]> {
  const supabase = await createClient()
  const { data: posts } = await supabase
    .from('forum_posts')
    .select('id, thread_id, author_id, content, quote_of_id, created_at, updated_at, is_hidden')
    .eq('thread_id', threadId)
    .eq('is_hidden', false)
    .order('created_at', { ascending: true })

  const rows = posts || []
  if (rows.length === 0) return []

  // Bring in author info and quoted-post info
  const authorIds = Array.from(new Set(rows.map(r => r.author_id)))
  const quoteIds = rows.map(r => r.quote_of_id).filter((x): x is string => !!x)

  const [{ data: profiles }, { data: quoted }] = await Promise.all([
    supabase.from('profiles')
      .select('id, username, avatar_url, location, forum_signature, forum_post_count, forum_rank, created_at')
      .in('id', authorIds),
    quoteIds.length
      ? supabase.from('forum_posts')
          .select('id, author_id, content')
          .in('id', quoteIds)
      : Promise.resolve({ data: [] as { id: string; author_id: string; content: string }[] }),
  ])

  const profileById = new Map((profiles || []).map(p => [p.id, p]))
  const quotedAuthorIds = Array.from(new Set((quoted || []).map(q => q.author_id)))
  const { data: quotedAuthors } = quotedAuthorIds.length
    ? await supabase.from('profiles').select('id, username').in('id', quotedAuthorIds)
    : { data: [] as { id: string; username: string }[] }
  const quotedAuthorById = new Map((quotedAuthors || []).map(p => [p.id, p.username as string]))
  const quoteById = new Map((quoted || []).map(q => [q.id, q]))

  return rows.map((r): Post => {
    const p = profileById.get(r.author_id)
    const q = r.quote_of_id ? quoteById.get(r.quote_of_id) : null
    const quoteAuthor = q ? (quotedAuthorById.get(q.author_id) || null) : null
    const quoteExcerpt = q ? (q.content.length > 240 ? q.content.slice(0, 237) + '...' : q.content) : null
    return {
      id: r.id,
      thread_id: r.thread_id,
      author_id: r.author_id,
      author_username: p?.username || null,
      author_rank: p?.forum_rank || null,
      author_post_count: p?.forum_post_count || 0,
      author_avatar_url: p?.avatar_url || null,
      author_location: p?.location || null,
      author_signature: p?.forum_signature || null,
      author_member_since: p?.created_at || null,
      content: r.content,
      quote_of_id: r.quote_of_id,
      quote_of_author: quoteAuthor,
      quote_of_excerpt: quoteExcerpt,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }
  })
}

// -------------------- helpers --------------------

export function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
}

export function formatMemberSince(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

export function formatRelative(iso: string): string {
  const then = new Date(iso).getTime()
  const now = Date.now()
  const diff = Math.max(0, now - then)
  const mins = Math.round(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function avatarColorForUsername(username: string | null): string {
  if (!username) return '#888'
  // Deterministic tint based on a simple hash so each member's post-meta
  // avatar fallback stays consistent across page loads.
  let hash = 0
  for (let i = 0; i < username.length; i++) hash = (hash * 31 + username.charCodeAt(i)) | 0
  const palette = ['#e87817', '#1c58b8', '#158a3a', '#b31e8f', '#b37c00', '#0e7d8e', '#7c3aed']
  return palette[Math.abs(hash) % palette.length]
}
