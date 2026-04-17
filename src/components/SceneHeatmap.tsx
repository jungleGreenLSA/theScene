'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { geocodeCityState } from '@/lib/mapbox'

// Project continental-US lat/lng onto the SVG viewBox (0 0 960 600).
// Calibrated with Seattle / LA / NYC / Miami as anchor points (linear
// regression). Good enough for a decorative heatmap — pins land within
// ~30px of the true position.
const SVG_W = 960
const SVG_H = 600
const X_SLOPE = 14.03
const X_INTERCEPT = 1860
const Y_SLOPE = -17.61
const Y_INTERCEPT = 941

function project(lat: number, lng: number): { x: number; y: number } | null {
  // Continental US bounds — skip Hawaii / Alaska / outside US
  if (lat < 24 || lat > 50 || lng < -125 || lng > -66) return null
  const x = X_SLOPE * lng + X_INTERCEPT
  const y = Y_SLOPE * lat + Y_INTERCEPT
  if (x < 0 || x > SVG_W || y < 0 || y > SVG_H) return null
  return { x, y }
}

type EntityType = 'events' | 'clubs' | 'shops'

const CONFIG: Record<EntityType, { color: string; emoji: string; label: string }> = {
  events: { color: '249,115,22', emoji: '📅', label: 'shows' },
  clubs: { color: '124,58,237', emoji: '🏁', label: 'clubs' },
  shops: { color: '34,197,94', emoji: '🔧', label: 'shops' },
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
  const [missing, setMissing] = useState(0)

  const cfg = CONFIG[type]

  useEffect(() => {
    const fetchRows = async () => {
      let rows: { lat: number | null; lng: number | null; label: string; city: string | null; state: string | null }[] = []

      if (type === 'events') {
        const { data } = await supabase.from('events').select('title, city, state, lat, lng').in('status', ['published', 'active'])
        rows = (data || []).map(e => ({ lat: e.lat, lng: e.lng, label: e.title, city: e.city, state: e.state }))
      } else if (type === 'shops') {
        const { data } = await supabase.from('shops').select('name, city, state, lat, lng')
        rows = (data || []).map(s => ({ lat: s.lat, lng: s.lng, label: s.name, city: s.city, state: s.state }))
      } else {
        const { data } = await supabase.from('club_locations').select('city, state, lat, lng, clubs(name)')
        rows = (data || []).map((l: any) => ({ lat: l.lat, lng: l.lng, label: l.clubs?.name || 'Club', city: l.city, state: l.state }))
      }

      setTotal(rows.length)

      // Client-side geocode fallback for legacy rows missing lat/lng
      // (e.g. events created before Mapbox was wired up). Cheap — only
      // fires for rows that need it, and results are cached in-memory.
      const geocodeCache = new Map<string, { lat: number; lng: number } | null>()
      await Promise.all(rows.map(async (r) => {
        if (r.lat != null && r.lng != null) return
        if (!r.city) return
        const key = `${r.city.toLowerCase()}|${(r.state || '').toLowerCase()}`
        if (!geocodeCache.has(key)) {
          try { geocodeCache.set(key, await geocodeCityState(r.city, r.state || '')) }
          catch { geocodeCache.set(key, null) }
        }
        const coords = geocodeCache.get(key)
        if (coords) { r.lat = coords.lat; r.lng = coords.lng }
      }))

      // Bucket points that land on similar map pixels so duplicate cities
      // stack rather than overlap. Key by rounded projected coords.
      const bucket = new Map<string, { x: number; y: number; count: number; labels: string[] }>()
      let missingCoords = 0

      rows.forEach(r => {
        if (r.lat == null || r.lng == null) { missingCoords++; return }
        const proj = project(r.lat, r.lng)
        if (!proj) { missingCoords++; return }
        const key = `${Math.round(proj.x / 8)}_${Math.round(proj.y / 8)}`
        const existing = bucket.get(key)
        if (existing) {
          existing.count++
          existing.labels.push(r.label)
        } else {
          bucket.set(key, { x: proj.x, y: proj.y, count: 1, labels: [r.label] })
        }
      })

      const maxCount = Math.max(1, ...Array.from(bucket.values(), b => b.count))
      const plotted: Dot[] = Array.from(bucket.values()).map(b => ({
        x: b.x,
        y: b.y,
        count: b.count,
        intensity: b.count / maxCount,
        label: b.labels.length === 1 ? b.labels[0] : `${b.count} ${cfg.label}`,
      }))

      setDots(plotted)
      setMissing(missingCoords)
    }
    fetchRows()
  }, [type])

  return (
    <div className="glass" style={{ padding: '16px', overflow: 'hidden', borderRadius: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#e2e4e9' }}>{cfg.emoji} {title}</h3>
        <span style={{ fontSize: '11px', color: '#6b7280' }}>
          {total} {total === 1 ? cfg.label.slice(0, -1) : cfg.label}
        </span>
      </div>
      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ width: '100%', height: 'auto', maxHeight: '280px' }}>
        <path
          d="M 130 95 L 175 82 L 240 76 L 330 73 L 420 72 L 520 72 L 580 75 L 640 82 L 700 92 L 760 102 L 820 112 L 865 122 L 895 135 L 905 155 L 900 175 L 880 185 L 860 200 L 842 220 L 820 230 L 800 240 L 792 265 L 790 290 L 802 315 L 818 340 L 820 360 L 805 385 L 780 405 L 748 420 L 732 435 L 735 465 L 745 495 L 748 520 L 735 518 L 720 490 L 705 465 L 688 450 L 658 440 L 625 440 L 590 445 L 555 448 L 530 445 L 510 455 L 495 475 L 482 495 L 470 495 L 458 475 L 448 455 L 422 435 L 390 418 L 360 405 L 328 392 L 290 382 L 248 375 L 208 370 L 182 360 L 162 335 L 150 300 L 140 260 L 132 210 L 128 150 Z"
          fill={`rgba(${cfg.color},0.04)`}
          stroke={`rgba(${cfg.color},0.25)`}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {dots.length === 0 && total === 0 && (
          <text x="480" y="300" textAnchor="middle" fill="#6b7280" fontSize="14">
            No {cfg.label} posted yet
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
            <rect x={tooltip.x - 70} y={tooltip.y - 42} width="140" height="30" rx="6" fill="rgba(12,12,20,0.92)" stroke={`rgba(${cfg.color},0.35)`} strokeWidth="1" />
            <text x={tooltip.x} y={tooltip.y - 28} textAnchor="middle" fill={`rgb(${cfg.color})`} fontSize="9" fontWeight="700">{tooltip.label}</text>
            <text x={tooltip.x} y={tooltip.y - 17} textAnchor="middle" fill="#9ca3af" fontSize="8">
              {tooltip.count} {tooltip.count === 1 ? cfg.label.slice(0, -1) : cfg.label}
            </text>
          </g>
        )}
      </svg>
      {missing > 0 && (
        <p style={{ fontSize: '10px', color: '#6b7280', marginTop: '8px', textAlign: 'center' }}>
          {missing} not geocoded yet — edit the record and re-save the address to drop a pin.
        </p>
      )}
    </div>
  )
}
