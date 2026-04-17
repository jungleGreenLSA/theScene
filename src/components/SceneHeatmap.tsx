'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// Hand-placed coordinates for the SVG US map (viewBox 0 0 960 600).
// Add a city here if you want it to show up on the heatmap.
const CITY_COORDS: Record<string, { x: number; y: number }> = {
  // West
  'seattle': { x: 165, y: 105 }, 'portland': { x: 155, y: 145 }, 'san francisco': { x: 140, y: 280 },
  'oakland': { x: 145, y: 275 }, 'sacramento': { x: 160, y: 260 }, 'san jose': { x: 150, y: 290 },
  'los angeles': { x: 175, y: 360 }, 'long beach': { x: 180, y: 365 }, 'anaheim': { x: 185, y: 362 },
  'san diego': { x: 185, y: 385 }, 'las vegas': { x: 230, y: 320 }, 'reno': { x: 185, y: 260 },
  'boise': { x: 260, y: 170 }, 'salt lake city': { x: 310, y: 235 }, 'phoenix': { x: 280, y: 380 },
  'tucson': { x: 290, y: 405 }, 'albuquerque': { x: 360, y: 340 }, 'denver': { x: 380, y: 280 },
  'colorado springs': { x: 385, y: 295 },
  // Central / Midwest
  'minneapolis': { x: 520, y: 160 }, 'st. paul': { x: 525, y: 160 }, 'milwaukee': { x: 590, y: 195 },
  'chicago': { x: 600, y: 220 }, 'detroit': { x: 650, y: 200 }, 'grand rapids': { x: 625, y: 195 },
  'cleveland': { x: 685, y: 215 }, 'columbus': { x: 680, y: 240 }, 'cincinnati': { x: 660, y: 255 },
  'indianapolis': { x: 625, y: 245 }, 'louisville': { x: 640, y: 275 }, 'st. louis': { x: 565, y: 260 },
  'kansas city': { x: 520, y: 290 }, 'omaha': { x: 490, y: 240 }, 'lincoln': { x: 490, y: 250 },
  'des moines': { x: 540, y: 230 }, 'oklahoma city': { x: 500, y: 350 }, 'tulsa': { x: 525, y: 335 },
  'wichita': { x: 500, y: 315 }, 'fargo': { x: 490, y: 150 }, 'sioux falls': { x: 500, y: 205 },
  // Texas
  'dallas': { x: 520, y: 400 }, 'fort worth': { x: 515, y: 395 }, 'arlington': { x: 518, y: 398 },
  'plano': { x: 522, y: 395 }, 'houston': { x: 530, y: 440 }, 'austin': { x: 500, y: 420 },
  'san antonio': { x: 490, y: 440 }, 'el paso': { x: 370, y: 400 }, 'corpus christi': { x: 505, y: 470 },
  // South
  'new orleans': { x: 590, y: 450 }, 'baton rouge': { x: 580, y: 445 }, 'jackson': { x: 605, y: 395 },
  'memphis': { x: 605, y: 330 }, 'nashville': { x: 640, y: 340 }, 'knoxville': { x: 670, y: 330 },
  'birmingham': { x: 640, y: 380 }, 'mobile': { x: 635, y: 430 }, 'little rock': { x: 570, y: 350 },
  'atlanta': { x: 680, y: 370 }, 'savannah': { x: 720, y: 395 }, 'tallahassee': { x: 690, y: 425 },
  'jacksonville': { x: 725, y: 420 }, 'orlando': { x: 730, y: 440 }, 'tampa': { x: 720, y: 450 },
  'miami': { x: 750, y: 480 }, 'fort lauderdale': { x: 752, y: 478 }, 'charleston': { x: 730, y: 380 },
  'columbia': { x: 710, y: 365 }, 'charlotte': { x: 720, y: 330 }, 'raleigh': { x: 740, y: 320 },
  'greensboro': { x: 730, y: 315 }, 'durham': { x: 742, y: 320 }, 'richmond': { x: 760, y: 290 },
  'virginia beach': { x: 775, y: 295 }, 'norfolk': { x: 775, y: 295 },
  // Northeast
  'washington': { x: 770, y: 260 }, 'baltimore': { x: 775, y: 250 }, 'philadelphia': { x: 790, y: 230 },
  'pittsburgh': { x: 740, y: 225 }, 'harrisburg': { x: 775, y: 225 }, 'scranton': { x: 795, y: 210 },
  'allentown': { x: 790, y: 222 }, 'new york': { x: 810, y: 210 }, 'brooklyn': { x: 812, y: 212 },
  'newark': { x: 805, y: 215 }, 'jersey city': { x: 808, y: 213 }, 'hartford': { x: 820, y: 195 },
  'new haven': { x: 820, y: 200 }, 'providence': { x: 830, y: 190 }, 'boston': { x: 830, y: 185 },
  'worcester': { x: 825, y: 185 }, 'portland me': { x: 845, y: 170 }, 'albany': { x: 805, y: 185 },
  'syracuse': { x: 780, y: 185 }, 'rochester': { x: 770, y: 185 }, 'buffalo': { x: 745, y: 195 },
}

type EntityType = 'events' | 'clubs' | 'shops'

const CONFIG: Record<EntityType, { color: string; glow: string; emoji: string; label: string }> = {
  events: { color: '249,115,22', glow: 'rgba(249,115,22,0.3)', emoji: '📅', label: 'shows' },
  clubs: { color: '124,58,237', glow: 'rgba(124,58,237,0.3)', emoji: '🏁', label: 'clubs' },
  shops: { color: '34,197,94', glow: 'rgba(34,197,94,0.3)', emoji: '🔧', label: 'shops' },
}

interface Dot { x: number; y: number; label: string; count: number; intensity: number }

interface Props {
  type: EntityType
  title: string
}

export default function SceneHeatmap({ type, title }: Props) {
  const supabase = createClient()
  const [dots, setDots] = useState<Dot[]>([])
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string; count: number } | null>(null)
  const [total, setTotal] = useState(0)
  const [unplottedCities, setUnplottedCities] = useState<string[]>([])

  const cfg = CONFIG[type]

  useEffect(() => {
    const fetch = async () => {
      let rows: { city: string | null; state: string | null; label: string }[] = []

      if (type === 'events') {
        const { data } = await supabase.from('events').select('title, city, state').in('status', ['published', 'active'])
        rows = (data || []).map(e => ({ city: e.city, state: e.state, label: e.title }))
      } else if (type === 'shops') {
        const { data } = await supabase.from('shops').select('name, city, state')
        rows = (data || []).map(s => ({ city: s.city, state: s.state, label: s.name }))
      } else {
        const { data } = await supabase.from('club_locations').select('city, state, clubs(name)')
        rows = (data || []).map((l: any) => ({ city: l.city, state: l.state, label: l.clubs?.name || 'Club' }))
      }

      setTotal(rows.length)

      // Aggregate by city
      const byCity: Record<string, { count: number; state: string; labels: string[] }> = {}
      rows.forEach(r => {
        if (!r.city) return
        const key = r.city.toLowerCase().trim()
        if (!byCity[key]) byCity[key] = { count: 0, state: r.state || '', labels: [] }
        byCity[key].count++
        if (r.label) byCity[key].labels.push(r.label)
      })

      const counts = Object.values(byCity).map(c => c.count)
      const maxCount = Math.max(...counts, 1)

      const plotted: Dot[] = []
      const unplotted: string[] = []
      Object.entries(byCity).forEach(([city, info]) => {
        const coords = CITY_COORDS[city]
        if (!coords) { unplotted.push(`${info.labels[0] || city} — ${city}, ${info.state}`); return }
        const displayName = `${city.replace(/\b\w/g, l => l.toUpperCase())}${info.state ? `, ${info.state}` : ''}`
        plotted.push({ x: coords.x, y: coords.y, label: displayName, count: info.count, intensity: info.count / maxCount })
      })

      setDots(plotted)
      setUnplottedCities(unplotted)
    }
    fetch()
  }, [type])

  return (
    <div className="glass" style={{ padding: '16px', overflow: 'hidden', borderRadius: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#e2e4e9' }}>{cfg.emoji} {title}</h3>
        <span style={{ fontSize: '11px', color: '#6b7280' }}>
          {total} {total === 1 ? cfg.label.slice(0, -1) : cfg.label}
        </span>
      </div>
      <svg viewBox="0 0 960 600" style={{ width: '100%', height: 'auto', maxHeight: '280px' }}>
        <path
          d="M120,100 L170,80 L230,90 L280,70 L350,90 L420,85 L500,90 L580,80 L650,90 L720,85 L780,100 L830,120 L850,170 L840,210 L830,250 L810,290 L790,310 L770,340 L760,370 L770,410 L760,440 L740,470 L720,490 L680,490 L650,470 L620,460 L590,470 L560,460 L530,470 L500,460 L470,450 L440,440 L400,430 L360,410 L320,410 L280,420 L240,410 L200,390 L170,380 L150,350 L140,310 L130,270 L120,230 L115,190 L120,150 Z"
          fill="none"
          stroke={`rgba(${cfg.color},0.12)`}
          strokeWidth="2"
        />
        {dots.length === 0 && (
          <text x="480" y="300" textAnchor="middle" fill="#6b7280" fontSize="14">
            No {cfg.label} plotted yet
          </text>
        )}
        {dots.map((dot, i) => (
          <g
            key={i}
            onMouseEnter={() => setTooltip({ x: dot.x, y: dot.y, label: dot.label, count: dot.count })}
            onMouseLeave={() => setTooltip(null)}
            style={{ cursor: 'pointer' }}
          >
            <circle cx={dot.x} cy={dot.y} r={12 + dot.intensity * 15} fill={`rgba(${cfg.color},${0.06 + dot.intensity * 0.1})`}>
              <animate attributeName="r" values={`${10 + dot.intensity * 12};${14 + dot.intensity * 18};${10 + dot.intensity * 12}`} dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx={dot.x} cy={dot.y} r={4 + dot.intensity * 3} fill={`rgba(${cfg.color},${0.55 + dot.intensity * 0.4})`} />
            <circle cx={dot.x} cy={dot.y} r={1.5} fill="rgba(255,255,255,0.85)" />
          </g>
        ))}
        {tooltip && (
          <g pointerEvents="none">
            <rect x={tooltip.x - 60} y={tooltip.y - 42} width="120" height="30" rx="6" fill="rgba(12,12,20,0.92)" stroke={`rgba(${cfg.color},0.35)`} strokeWidth="1" />
            <text x={tooltip.x} y={tooltip.y - 28} textAnchor="middle" fill={`rgb(${cfg.color})`} fontSize="9" fontWeight="700">{tooltip.label}</text>
            <text x={tooltip.x} y={tooltip.y - 17} textAnchor="middle" fill="#9ca3af" fontSize="8">
              {tooltip.count} {tooltip.count === 1 ? cfg.label.slice(0, -1) : cfg.label}
            </text>
          </g>
        )}
      </svg>
      {unplottedCities.length > 0 && (
        <p style={{ fontSize: '10px', color: '#6b7280', marginTop: '8px', textAlign: 'center' }}>
          {unplottedCities.length} not mapped yet: {unplottedCities.slice(0, 3).join(' · ')}{unplottedCities.length > 3 ? ` +${unplottedCities.length - 3} more` : ''}
        </p>
      )}
    </div>
  )
}
