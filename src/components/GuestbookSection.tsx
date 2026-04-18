'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import MentionTextarea from '@/components/MentionTextarea'

// Renders @mentions as links to /user/[username].
function renderMentions(text: string): (string | React.ReactElement)[] {
  const out: (string | React.ReactElement)[] = []
  const re = /@([a-zA-Z0-9_]{3,30})/g
  let last = 0
  let i = 0
  for (const m of text.matchAll(re)) {
    const start = m.index ?? 0
    if (start > last) out.push(text.slice(last, start))
    out.push(<Link key={i++} href={`/user/${m[1]}`} style={{ color: '#f97316', fontWeight: 600 }}>@{m[1]}</Link>)
    last = start + m[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

// Basic profanity filter
const BLOCKED_WORDS = [
  'fuck', 'shit', 'ass', 'bitch', 'damn', 'dick', 'pussy', 'cunt', 'nigger', 'faggot',
  'retard', 'trump', 'biden', 'maga', 'liberal', 'conservative', 'democrat', 'republican',
  'porn', 'xxx', 'viagra', 'casino', 'crypto scam',
]

function containsBlockedContent(text: string): boolean {
  const lower = text.toLowerCase()
  return BLOCKED_WORDS.some(word => lower.includes(word))
}

interface GuestbookEntry {
  id: string
  content: string
  created_at: string
  author: {
    username: string
    display_name: string | null
    avatar_url: string | null
  }
}

interface GuestbookSectionProps {
  vehicleId: string
  entries: GuestbookEntry[]
}

export default function GuestbookSection({ vehicleId, entries: initialEntries }: GuestbookSectionProps) {
  const [entries, setEntries] = useState(initialEntries)
  const [newEntry, setNewEntry] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!newEntry.trim()) return

    if (containsBlockedContent(newEntry)) {
      setError('Your message contains content that is not allowed. Keep it car-related and respectful.')
      return
    }

    if (newEntry.length > 120) {
      setError('Guestbook entries must be under 120 characters.')
      return
    }

    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      window.location.href = '/auth/login'
      return
    }

    const { data, error: insertError } = await supabase
      .from('guestbook_entries')
      .insert({
        vehicle_id: vehicleId,
        author_id: user.id,
        content: newEntry.trim(),
      })
      .select(`
        *,
        author:profiles(username, display_name, avatar_url)
      `)
      .single()

    if (insertError) {
      setError(insertError.message)
    } else if (data) {
      setEntries([data, ...entries])
      setNewEntry('')
    }
    setLoading(false)
  }

  return (
    <div className="glass" style={{ padding: '24px', marginBottom: '20px' }}>
      <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#e2e4e9', marginBottom: '16px' }}>Guestbook</h2>

      {/* Entry form */}
      <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '8px' }}>
          <MentionTextarea
            value={newEntry}
            onChange={setNewEntry}
            rows={2}
            placeholder="Leave a quick note — tag someone with @username"
            maxLength={120}
            style={{ resize: 'none' }}
          />
        </div>
        {error && (
          <p style={{ fontSize: '13px', color: '#ef4444', marginBottom: '8px' }}>{error}</p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: newEntry.length > 100 ? (newEntry.length > 115 ? '#ef4444' : '#fb923c') : '#6b7280' }}>{120 - newEntry.length}</span>
          <button type="submit" disabled={loading || !newEntry.trim()} style={{
            padding: '8px 20px', borderRadius: '8px', background: '#e87817', border: '1px solid #f97316',
            color: 'white', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
            opacity: loading || !newEntry.trim() ? 0.5 : 1,
          }}>
            {loading ? 'Posting...' : 'Sign Guestbook'}
          </button>
        </div>
      </form>

      {/* Entries */}
      {entries.length === 0 ? (
        <p style={{ fontSize: '13px', color: '#8892a4', textAlign: 'center', padding: '16px' }}>No guestbook entries yet. Be the first!</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {entries.map((entry) => (
            <div key={entry.id} style={{ display: 'flex', gap: '12px', paddingBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <Link href={`/user/${entry.author?.username}`} style={{ flexShrink: 0 }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', background: 'rgba(26,26,46,0.5)', backgroundImage: entry.author?.avatar_url ? `url(${entry.author.avatar_url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {!entry.author?.avatar_url && <span style={{ fontSize: '11px', color: '#6b7280' }}>{entry.author?.username?.charAt(0).toUpperCase() || '?'}</span>}
                </div>
              </Link>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Link href={`/user/${entry.author?.username}`} style={{ fontSize: '13px', fontWeight: 600, color: '#e2e4e9' }}>
                    {entry.author?.display_name || entry.author?.username}
                  </Link>
                  <span style={{ fontSize: '11px', color: '#6b7280' }}>
                    {new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <p style={{ fontSize: '14px', color: '#9ca3af', marginTop: '4px', whiteSpace: 'pre-wrap' }}>{renderMentions(entry.content)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
