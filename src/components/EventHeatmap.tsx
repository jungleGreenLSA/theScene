'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const CITY_COORDS: Record<string, { x: number; y: number }> = {
  'dallas': { x: 520, y: 400 }, 'houston': { x: 530, y: 440 }, 'austin': { x: 500, y: 420 },
  'san antonio': { x: 490, y: 440 }, 'phoenix': { x: 280, y: 380 }, 'los angeles': { x: 175, y: 360 },
  'san diego': { x: 185, y: 385 }, 'san francisco': { x: 140, y: 280 }, 'las vegas': { x: 230, y: 320 },
  'denver': { x: 380, y: 280 }, 'chicago': { x: 600, y: 220 }, 'detroit': { x: 650, y: 200 },
  'miami': { x: 750, y: 480 }, 'orlando': { x: 730, y: 440 }, 'atlanta': { x: 680, y: 370 },
  'charlotte': { x: 720, y: 330 }, 'new york': { x: 810, y: 210 }, 'philadelphia': { x: 790, y: 230 },
  'boston': { x: 830, y: 185 }, 'washington': { x: 770, y: 260 }, 'nashville': { x: 640, y: 340 },
  'oklahoma city': { x: 500, y: 350 }, 'kansas city': { x: 520, y: 290 }, 'minneapolis': { x: 520, y: 160 },
  'seattle': { x: 165, y: 105 }, 'portland': { x: 155, y: 145 }, 'scranton': { x: 795, y: 210 },
  'raleigh': { x: 740, y: 320 }, 'new orleans': { x: 590, y: 450 }, 'fort worth': { x: 515, y: 395 },
}

interface EventDot { x: number; y: number; label: string; count: number; intensity: number }

export default function EventHeatmap() {
  const supabase = createClient()
  const [dots, setDots] = useState<EventDot[]>([])
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string; count: number } | null>(null)
  const [totalEvents, setTotalEvents] = useState(0)

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('events').select('city, state').in('status', ['published', 'active'])
      if (!data) return
      setTotalEvents(data.length)

      const cityMap: Record<string, number> = {}
      data.forEach(e => {
        if (e.city) {
          const key = e.city.toLowerCase().trim()
          cityMap[key] = (cityMap[key] || 0) + 1
        }
      })

      const maxCount = Math.max(...Object.values(cityMap), 1)
      const spots: EventDot[] = Object.entries(cityMap).map(([city, count]) => {
        const coords = CITY_COORDS[city] || null
        if (!coords) return null
        return { ...coords, label: `${city.charAt(0).toUpperCase() + city.slice(1)}, ${data.find(e => e.city?.toLowerCase() === city)?.state || ''}`, count, intensity: count / maxCount }
      }).filter(Boolean) as EventDot[]

      setDots(spots)
    }
    fetch()
  }, [])

  if (dots.length === 0) return null

  return (
    <div className="glass" style={{ padding: '16px', overflow: 'hidden', borderRadius: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#e2e4e9' }}>📅 Car Shows Near You</h3>
        <span style={{ fontSize: '11px', color: '#6b7280' }}>{totalEvents} upcoming</span>
      </div>
      <svg viewBox="0 0 960 600" style={{ width: '100%', height: 'auto', maxHeight: '250px' }}>
        <path d="M120,100 L170,80 L230,90 L280,70 L350,90 L420,85 L500,90 L580,80 L650,90 L720,85 L780,100 L830,120 L850,170 L840,210 L830,250 L810,290 L790,310 L770,340 L760,370 L770,410 L760,440 L740,470 L720,490 L680,490 L650,470 L620,460 L590,470 L560,460 L530,470 L500,460 L470,450 L440,440 L400,430 L360,410 L320,410 L280,420 L240,410 L200,390 L170,380 L150,350 L140,310 L130,270 L120,230 L115,190 L120,150 Z" fill="none" stroke="rgba(249,115,22,0.12)" strokeWidth="2" />
        {dots.map((dot, i) => (
          <g key={i} onMouseEnter={() => setTooltip({ x: dot.x, y: dot.y, label: dot.label, count: dot.count })} onMouseLeave={() => setTooltip(null)} style={{ cursor: 'pointer' }}>
            <circle cx={dot.x} cy={dot.y} r={12 + dot.intensity * 15} fill={`rgba(249,115,22,${0.06 + dot.intensity * 0.1})`}>
              <animate attributeName="r" values={`${10 + dot.intensity * 12};${14 + dot.intensity * 18};${10 + dot.intensity * 12}`} dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx={dot.x} cy={dot.y} r={4 + dot.intensity * 3} fill={`rgba(249,115,22,${0.5 + dot.intensity * 0.5})`} />
            <circle cx={dot.x} cy={dot.y} r={1.5} fill="rgba(255,255,255,0.7)" />
          </g>
        ))}
        {tooltip && (
          <g>
            <rect x={tooltip.x - 50} y={tooltip.y - 40} width="100" height="28" rx="6" fill="rgba(12,12,20,0.9)" stroke="rgba(249,115,22,0.3)" strokeWidth="1" />
            <text x={tooltip.x} y={tooltip.y - 28} textAnchor="middle" fill="#fb923c" fontSize="9" fontWeight="600">{tooltip.label}</text>
            <text x={tooltip.x} y={tooltip.y - 18} textAnchor="middle" fill="#8892a4" fontSize="8">{tooltip.count} show{tooltip.count !== 1 ? 's' : ''}</text>
          </g>
        )}
      </svg>
    </div>
  )
}
