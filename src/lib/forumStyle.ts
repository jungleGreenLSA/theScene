// Helper functions used by the forum-mimicry rendering (avatar tints,
// relative timestamps, member-since labels). These are pure view helpers
// — no DB access — so they're safe to import from client or server.

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

// Deterministic tint for fallback avatars so each username renders the
// same color across sessions.
export function avatarColorForUsername(username: string | null): string {
  if (!username) return '#888'
  let hash = 0
  for (let i = 0; i < username.length; i++) hash = (hash * 31 + username.charCodeAt(i)) | 0
  const palette = ['#e87817', '#1c58b8', '#158a3a', '#b31e8f', '#b37c00', '#0e7d8e', '#7c3aed']
  return palette[Math.abs(hash) % palette.length]
}

// Rank label based on how many forum-style posts a user has. Mirrors the
// forum_rank_for_count function in migration 025 so the label is
// consistent whether we read from profiles.forum_rank or compute it
// from profiles.forum_post_count client-side.
export function rankForPostCount(n: number | null | undefined): string {
  const count = n || 0
  if (count >= 1000) return 'Veteran'
  if (count >= 250) return 'Regular'
  if (count >= 50) return 'Enthusiast'
  if (count >= 10) return 'Contributor'
  return 'Member'
}
