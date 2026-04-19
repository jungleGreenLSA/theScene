'use client'

import { useEffect, useRef, useState, forwardRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Profile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
}

interface Props {
  value: string
  onChange: (value: string) => void
  maxLength?: number
  rows?: number
  placeholder?: string
  className?: string
  style?: React.CSSProperties
}

// Textarea wrapper that pops up a @username autocomplete when the user types
// `@` followed by at least one letter. Keyboard nav with ↑/↓ and enter/tab
// to accept. Esc to dismiss. Click to accept with mouse.
const MentionTextarea = forwardRef<HTMLTextAreaElement, Props>(function MentionTextarea(
  { value, onChange, maxLength, rows = 2, placeholder, className = 'input', style }, ref
) {
  const supabase = createClient()
  const innerRef = useRef<HTMLTextAreaElement>(null)
  const textareaRef = (ref as React.RefObject<HTMLTextAreaElement>) || innerRef

  const [matches, setMatches] = useState<Profile[]>([])
  const [activeIdx, setActiveIdx] = useState(0)
  const [mentionRange, setMentionRange] = useState<{ start: number; end: number; q: string } | null>(null)
  const [searching, setSearching] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Look for an active "@partial" immediately preceding the caret.
  const detectMention = (text: string, caret: number) => {
    // Walk backward from caret; stop on space/newline/nothing left.
    let i = caret - 1
    while (i >= 0 && /[a-zA-Z0-9_]/.test(text[i])) i--
    if (i < 0 || text[i] !== '@') return null
    // Ensure the @ is at start-of-string or preceded by whitespace (don't match emails)
    if (i > 0 && !/\s/.test(text[i - 1])) return null
    return { start: i, end: caret, q: text.slice(i + 1, caret) }
  }

  const searchProfiles = async (q: string) => {
    setSearching(true)
    try {
      // No query yet — show recent/first batch so the dropdown isn't empty
      // as soon as the user types `@`.
      let query = supabase.from('profiles').select('id, username, display_name, avatar_url').limit(8)
      if (q) {
        // Match either username or display_name so "@Jeff" finds jeff_squier_xxxx.
        query = query.or(`username.ilike.${q}%,display_name.ilike.${q}%`)
      } else {
        query = query.order('last_active_at', { ascending: false, nullsFirst: false })
      }
      const { data, error } = await query
      if (error) console.error('[MentionTextarea] profile search failed:', error)
      setMatches((data || []) as Profile[])
    } catch (err) {
      console.error('[MentionTextarea] profile search threw:', err)
      setMatches([])
    } finally {
      setSearching(false)
      setActiveIdx(0)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = e.target.value
    onChange(next)
    const caret = e.target.selectionStart
    const range = detectMention(next, caret)
    setMentionRange(range)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (range) {
      // Debounce *only* when there's a query; an empty @ fires immediately.
      const delay = range.q ? 180 : 0
      debounceRef.current = setTimeout(() => searchProfiles(range.q), delay)
    } else {
      setMatches([])
      setSearching(false)
    }
  }

  const accept = (p: Profile) => {
    if (!mentionRange || !textareaRef.current) return
    const before = value.slice(0, mentionRange.start)
    const after = value.slice(mentionRange.end)
    const insertion = `@${p.username} `
    const next = before + insertion + after
    onChange(next)
    setMentionRange(null)
    setMatches([])
    // Restore caret position after the inserted mention
    const newCaret = before.length + insertion.length
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(newCaret, newCaret)
      }
    }, 0)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!matches.length) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => (i + 1) % matches.length); return }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => (i - 1 + matches.length) % matches.length); return }
    if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); accept(matches[activeIdx]); return }
    if (e.key === 'Escape') { setMatches([]); setMentionRange(null); return }
  }

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [])

  return (
    <div style={{ position: 'relative' }}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        maxLength={maxLength}
        rows={rows}
        placeholder={placeholder}
        className={className}
        style={style}
      />
      {mentionRange && (matches.length > 0 || searching || mentionRange.q.length > 0) && (
        <div style={{
          position: 'absolute', zIndex: 20, left: 0, right: 0, top: '100%', marginTop: '4px',
          background: '#12121e', border: '1px solid rgba(44, 121, 196, 0.35)', borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)', overflow: 'hidden',
        }}>
          {searching && matches.length === 0 && (
            <div style={{ padding: '10px 12px', fontSize: '12px', color: '#2c3e50' }}>Searching…</div>
          )}
          {!searching && matches.length === 0 && mentionRange.q.length > 0 && (
            <div style={{ padding: '10px 12px', fontSize: '12px', color: '#2c3e50' }}>No users matching &ldquo;@{mentionRange.q}&rdquo;</div>
          )}
          {matches.map((m, i) => (
            <button
              key={m.id}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); accept(m) }}
              onMouseEnter={() => setActiveIdx(i)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
                padding: '8px 12px', cursor: 'pointer', border: 'none', textAlign: 'left',
                background: i === activeIdx ? 'rgba(44, 121, 196, 0.15)' : 'transparent',
              }}
            >
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', overflow: 'hidden', background: '#e4e4e4', backgroundImage: m.avatar_url ? `url(${m.avatar_url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {!m.avatar_url && <span style={{ fontSize: '11px', color: '#2c3e50' }}>{m.username.charAt(0).toUpperCase()}</span>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a1a' }}>@{m.username}</p>
                {m.display_name && <p style={{ fontSize: '11px', color: '#2c3e50' }}>{m.display_name}</p>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
})

export default MentionTextarea
