'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Suggestion {
  id: number
  title: string
  description: string
  category: string
  emoji: string
  hashtag?: string
}

export default function DailySuggestion() {
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const fetchSuggestion = async () => {
      try {
        const res = await fetch('/data/daily-suggestions.json')
        const data: Suggestion[] = await res.json()
        // Rotate daily. We also align "day 0" to the first Monday of Jan 2026
        // so the weekly cadence (Monday Motor, Tuner Tuesday, etc.) lines up
        // with the actual day of week.
        const epochDays = Math.floor(Date.now() / (1000 * 60 * 60 * 24))
        const alignedDay = new Date().getDay() // 0 = Sunday
        // First 7 entries in the JSON map to a weekly cadence (Mon..Sun). After
        // the first week of rotation, pick among the rest by epoch day.
        // Mon=1 → id1 (Monday Motor). Map day-of-week → index 0..6 in the first block.
        const weeklyIndex = (alignedDay + 6) % 7 // Mon=0, Tue=1, ..., Sun=6
        // Every 4th day, break pattern and show a wildcard from the extra pool
        const breakOut = epochDays % 4 === 3
        const extras = data.slice(7)
        const picked = breakOut && extras.length > 0
          ? extras[epochDays % extras.length]
          : data[weeklyIndex] || data[0]
        setSuggestion(picked)
      } catch { /* ignore */ }
    }
    fetchSuggestion()
  }, [])

  const copyHashtag = async () => {
    if (!suggestion?.hashtag) return
    try {
      await navigator.clipboard.writeText(`#${suggestion.hashtag}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }

  if (!suggestion) return null

  return (
    <div className="glass" style={{ padding: '20px', border: '1px solid rgba(249,115,22,0.15)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
        <span style={{ fontSize: '28px', flexShrink: 0, marginTop: '2px' }}>{suggestion.emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#fb923c' }}>Community Prompt</span>
            <span style={{ fontSize: '10px', color: '#6b7280' }}>New every day</span>
          </div>
          <h3 className="font-bold text-foreground" style={{ fontSize: '15px', marginBottom: '4px' }}>{suggestion.title}</h3>
          <p className="text-muted-light" style={{ fontSize: '13px', lineHeight: 1.5, marginBottom: suggestion.hashtag ? '10px' : 0 }}>{suggestion.description}</p>
          {suggestion.hashtag && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={copyHashtag}
                title="Copy hashtag"
                style={{
                  padding: '4px 10px', borderRadius: '4px',
                  background: 'rgba(232,120,23,0.12)', border: '1px solid rgba(232,120,23,0.3)',
                  color: '#f97316', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                }}
              >
                #{suggestion.hashtag}
              </button>
              <Link
                href={`/feed?tag=${encodeURIComponent(suggestion.hashtag.toLowerCase())}`}
                style={{ fontSize: '11px', color: '#8892a4', textDecoration: 'underline' }}
              >
                See posts →
              </Link>
              {copied && <span style={{ fontSize: '11px', color: '#22c55e' }}>Copied!</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
