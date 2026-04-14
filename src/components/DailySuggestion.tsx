'use client'

import { useEffect, useState } from 'react'

interface Suggestion {
  id: number
  title: string
  description: string
  category: string
  emoji: string
}

export default function DailySuggestion() {
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null)

  useEffect(() => {
    const fetchSuggestion = async () => {
      try {
        const res = await fetch('/data/daily-suggestions.json')
        const data: Suggestion[] = await res.json()
        // Rotate every 3 days based on the date
        const daysSinceEpoch = Math.floor(Date.now() / (1000 * 60 * 60 * 24))
        const index = Math.floor(daysSinceEpoch / 3) % data.length
        setSuggestion(data[index])
      } catch { /* ignore */ }
    }
    fetchSuggestion()
  }, [])

  if (!suggestion) return null

  return (
    <div className="glass" style={{ padding: '20px', border: '1px solid rgba(249,115,22,0.15)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
        <span style={{ fontSize: '28px', flexShrink: 0, marginTop: '2px' }}>{suggestion.emoji}</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#fb923c' }}>Community Prompt</span>
            <span style={{ fontSize: '10px', color: '#6b7280' }}>Refreshes every 3 days</span>
          </div>
          <h3 className="font-bold text-foreground" style={{ fontSize: '15px', marginBottom: '4px' }}>{suggestion.title}</h3>
          <p className="text-muted-light" style={{ fontSize: '13px', lineHeight: 1.5 }}>{suggestion.description}</p>
        </div>
      </div>
    </div>
  )
}
