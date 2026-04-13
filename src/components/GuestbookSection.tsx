'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

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
      setError('Your message contains content that is not allowed. Please keep it car-related and respectful.')
      return
    }

    if (newEntry.length > 500) {
      setError('Guestbook entries must be under 500 characters.')
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
    <div className="glass p-6">
      <h2 className="text-lg font-bold text-foreground mb-4">📖 Guestbook</h2>

      {/* Entry form */}
      <form onSubmit={handleSubmit} className="mb-6">
        <textarea
          value={newEntry}
          onChange={(e) => setNewEntry(e.target.value)}
          className="input mb-2"
          rows={3}
          placeholder="Leave a message... (keep it car-related and respectful)"
          maxLength={500}
        />
        {error && (
          <p className="text-sm text-danger mb-2">{error}</p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted">{newEntry.length}/500</span>
          <button type="submit" disabled={loading || !newEntry.trim()} className="btn-primary text-xs disabled:opacity-50">
            {loading ? 'Posting...' : 'Sign Guestbook'}
          </button>
        </div>
      </form>

      {/* Entries */}
      {entries.length === 0 ? (
        <p className="text-muted-light text-sm text-center py-4">No guestbook entries yet. Be the first!</p>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <div key={entry.id} className="flex gap-3 pb-4 border-b border-border last:border-0 last:pb-0">
              <div className="w-8 h-8 rounded-full bg-surface-light overflow-hidden flex-shrink-0 flex items-center justify-center">
                {entry.author?.avatar_url ? (
                  <img src={entry.author.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs text-muted">
                    {entry.author?.username?.charAt(0).toUpperCase() || '?'}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Link href={`/user/${entry.author?.username}`} className="text-sm font-semibold text-foreground hover:text-purple-light">
                    {entry.author?.display_name || entry.author?.username}
                  </Link>
                  <span className="text-xs text-muted">
                    {new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <p className="text-sm text-muted-light mt-1">{entry.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
