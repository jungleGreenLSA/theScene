'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { geocodeCityState } from '@/lib/mapbox'

// Same linear lat/lng → SVG projection as SceneHeatmap, so pins land
// in roughly the right part of the country instead of on hand-picked
// city spots.
const SVG_W = 960
const SVG_H = 600
const X_SLOPE = 14.03
const X_INTERCEPT = 1860
const Y_SLOPE = -17.61
const Y_INTERCEPT = 941

function project(lat: number, lng: number): { x: number; y: number } | null {
  if (lat < 24 || lat > 50 || lng < -125 || lng > -66) return null
  const x = X_SLOPE * lng + X_INTERCEPT
  const y = Y_SLOPE * lat + Y_INTERCEPT
  if (x < 0 || x > SVG_W || y < 0 || y > SVG_H) return null
  return { x, y }
}

interface HotSpot { x: number; y: number; label: string; count: number; intensity: number }

export default function MemberHeatmap() {
  const [hotSpots, setHotSpots] = useState<HotSpot[]>([])
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string; count: number } | null>(null)
  const [totalMembers, setTotalMembers] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: profiles } = await supabase
        .from('profiles')
        .select('location')
        .eq('is_public', true)
        .not('location', 'is', null)
      if (!profiles) return

      setTotalMembers(profiles.length)

      const byLocation = new Map<string, { city: string; state: string; count: number }>()
      profiles.forEach(p => {
        if (!p.location) return
        const parts = p.location.split(',').map((s: string) => s.trim())
        const city = parts[0]
        const state = (parts[1] || '').toUpperCase().slice(0, 2)
        if (!city || !state) return
        const key = `${city.toLowerCase()}|${state.toLowerCase()}`
        const existing = byLocation.get(key)
        if (existing) existing.count++
        else byLocation.set(key, { city, state, count: 1 })
      })

      const geocodeCache = new Map<string, { lat: number; lng: number } | null>()
      const spots: HotSpot[] = []

      for (const [key, info] of byLocation.entries()) {
        if (!geocodeCache.has(key)) {
          try { geocodeCache.set(key, await geocodeCityState(info.city, info.state)) }
          catch { geocodeCache.set(key, null) }
        }
        const coords = geocodeCache.get(key)
        if (!coords) continue
        const proj = project(coords.lat, coords.lng)
        if (!proj) continue
        spots.push({ x: proj.x, y: proj.y, label: `${info.city}, ${info.state}`, count: info.count, intensity: 0 })
      }

      const maxCount = Math.max(1, ...spots.map(s => s.count))
      spots.forEach(s => { s.intensity = s.count / maxCount })
      setHotSpots(spots)
    }
    fetchData()
  }, [])

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{ marginBottom: '8px' }}>
        <p style={{ fontSize: '12px', color: '#2c3e50' }}>
          <strong style={{ color: '#222' }}>{totalMembers}</strong>{' '}
          {totalMembers === 1 ? 'member' : 'members'} nationwide
        </p>
      </div>

      <div style={{
        background: '#fafafa',
        border: '2px solid #3a3a3a',
        borderRadius: '2px',
        padding: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
      }}>
        <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ width: '100%', height: 'auto', maxHeight: '420px' }}>
          <path
            d="M 130 95 L 175 82 L 240 76 L 330 73 L 420 72 L 520 72 L 580 75 L 640 82 L 700 92 L 760 102 L 820 112 L 865 122 L 895 135 L 905 155 L 900 175 L 880 185 L 860 200 L 842 220 L 820 230 L 800 240 L 792 265 L 790 290 L 802 315 L 818 340 L 820 360 L 805 385 L 780 405 L 748 420 L 732 435 L 735 465 L 745 495 L 748 520 L 735 518 L 720 490 L 705 465 L 688 450 L 658 440 L 625 440 L 590 445 L 555 448 L 530 445 L 510 455 L 495 475 L 482 495 L 470 495 L 458 475 L 448 455 L 422 435 L 390 418 L 360 405 L 328 392 L 290 382 L 248 375 L 208 370 L 182 360 L 162 335 L 150 300 L 140 260 L 132 210 L 128 150 Z"
            fill="#e8e8e8"
            stroke="#9a9a9a"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />

          {hotSpots.length === 0 && (
            <text x={SVG_W / 2} y={SVG_H / 2} textAnchor="middle" fill="#888" fontSize="14">
              Members with a set location will show up here
            </text>
          )}

          {hotSpots.map((spot, i) => {
            const radius = 8 + spot.intensity * 20
            const glowRadius = radius * 2.4
            return (
              <g
                key={i}
                onMouseEnter={() => setTooltip({ x: spot.x, y: spot.y, label: spot.label, count: spot.count })}
                onMouseLeave={() => setTooltip(null)}
                style={{ cursor: 'pointer' }}
              >
                <circle cx={spot.x} cy={spot.y} r={glowRadius} fill={`rgba(44,121,196,${0.08 + spot.intensity * 0.14})`}>
                  <animate attributeName="r" values={`${glowRadius * 0.85};${glowRadius * 1.15};${glowRadius * 0.85}`} dur={`${3 + Math.random() * 2}s`} repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.6;1;0.6" dur={`${3 + Math.random() * 2}s`} repeatCount="indefinite" />
                </circle>
                <circle cx={spot.x} cy={spot.y} r={radius * 1.4} fill={`rgba(95,168,221,${0.25 + spot.intensity * 0.3})`}>
                  <animate attributeName="r" values={`${radius * 1.25};${radius * 1.6};${radius * 1.25}`} dur={`${2 + Math.random() * 2}s`} repeatCount="indefinite" />
                </circle>
                <circle cx={spot.x} cy={spot.y} r={radius * 0.45} fill={`rgba(44,121,196,${0.85 + spot.intensity * 0.15})`} stroke="#174261" strokeWidth="0.5" />
                <circle cx={spot.x} cy={spot.y} r={radius * 0.16} fill="#fff" />
              </g>
            )
          })}

          {tooltip && (
            <g pointerEvents="none">
              <rect x={tooltip.x - 80} y={tooltip.y - 48} width="160" height="34" rx="3" fill="#fff" stroke="#888" strokeWidth="1" />
              <text x={tooltip.x} y={tooltip.y - 34} textAnchor="middle" fill="#222" fontSize="11" fontWeight="700">{tooltip.label}</text>
              <text x={tooltip.x} y={tooltip.y - 21} textAnchor="middle" fill="#2c79c4" fontSize="10" fontWeight="600">
                {tooltip.count} member{tooltip.count !== 1 ? 's' : ''}
              </text>
            </g>
          )}
        </svg>
      </div>

      <div style={{
        padding: '10px 4px 0',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: '20px', flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(44, 121, 196, 0.45)' }} />
          <span style={{ fontSize: '11px', color: '#2c3e50' }}>Few members</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'rgba(44, 121, 196, 0.75)' }} />
          <span style={{ fontSize: '11px', color: '#2c3e50' }}>Many members</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: 'rgba(44, 121, 196, 0.95)', boxShadow: '0 0 6px rgba(44, 121, 196, 0.5)' }} />
          <span style={{ fontSize: '11px', color: '#2c3e50' }}>Hot spot</span>
        </div>
      </div>
    </div>
  )
}
