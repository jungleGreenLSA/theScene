'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

// Major US city coordinates mapped to SVG viewBox (960x600)
const CITY_COORDS: Record<string, { x: number; y: number; label: string }> = {
  'dallas': { x: 520, y: 400, label: 'Dallas, TX' },
  'houston': { x: 530, y: 440, label: 'Houston, TX' },
  'austin': { x: 500, y: 420, label: 'Austin, TX' },
  'san antonio': { x: 490, y: 440, label: 'San Antonio, TX' },
  'phoenix': { x: 280, y: 380, label: 'Phoenix, AZ' },
  'los angeles': { x: 175, y: 360, label: 'Los Angeles, CA' },
  'san diego': { x: 185, y: 385, label: 'San Diego, CA' },
  'san francisco': { x: 140, y: 280, label: 'San Francisco, CA' },
  'las vegas': { x: 230, y: 320, label: 'Las Vegas, NV' },
  'denver': { x: 380, y: 280, label: 'Denver, CO' },
  'chicago': { x: 600, y: 220, label: 'Chicago, IL' },
  'detroit': { x: 650, y: 200, label: 'Detroit, MI' },
  'miami': { x: 750, y: 480, label: 'Miami, FL' },
  'orlando': { x: 730, y: 440, label: 'Orlando, FL' },
  'tampa': { x: 720, y: 450, label: 'Tampa, FL' },
  'atlanta': { x: 680, y: 370, label: 'Atlanta, GA' },
  'charlotte': { x: 720, y: 330, label: 'Charlotte, NC' },
  'new york': { x: 810, y: 210, label: 'New York, NY' },
  'philadelphia': { x: 790, y: 230, label: 'Philadelphia, PA' },
  'boston': { x: 830, y: 185, label: 'Boston, MA' },
  'washington': { x: 770, y: 260, label: 'Washington, DC' },
  'nashville': { x: 640, y: 340, label: 'Nashville, TN' },
  'memphis': { x: 595, y: 360, label: 'Memphis, TN' },
  'oklahoma city': { x: 500, y: 350, label: 'Oklahoma City, OK' },
  'kansas city': { x: 520, y: 290, label: 'Kansas City, MO' },
  'st louis': { x: 570, y: 290, label: 'St. Louis, MO' },
  'minneapolis': { x: 520, y: 160, label: 'Minneapolis, MN' },
  'seattle': { x: 165, y: 105, label: 'Seattle, WA' },
  'portland': { x: 155, y: 145, label: 'Portland, OR' },
  'salt lake city': { x: 300, y: 250, label: 'Salt Lake City, UT' },
  'indianapolis': { x: 620, y: 265, label: 'Indianapolis, IN' },
  'columbus': { x: 670, y: 255, label: 'Columbus, OH' },
  'pittsburgh': { x: 720, y: 235, label: 'Pittsburgh, PA' },
  'scranton': { x: 795, y: 210, label: 'Scranton, PA' },
  'raleigh': { x: 740, y: 320, label: 'Raleigh, NC' },
  'new orleans': { x: 590, y: 450, label: 'New Orleans, LA' },
  'albuquerque': { x: 340, y: 360, label: 'Albuquerque, NM' },
  'tucson': { x: 290, y: 400, label: 'Tucson, AZ' },
  'fort worth': { x: 515, y: 395, label: 'Fort Worth, TX' },
}

interface HotSpot {
  x: number
  y: number
  label: string
  count: number
  intensity: number // 0-1
}

export default function MemberHeatmap() {
  const [hotSpots, setHotSpots] = useState<HotSpot[]>([])
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string; count: number } | null>(null)
  const [zoom, setZoom] = useState({ scale: 1, x: 0, y: 0 })
  const [totalMembers, setTotalMembers] = useState(0)
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: profiles } = await supabase
        .from('profiles')
        .select('location')
        .eq('is_public', true)

      if (!profiles) return

      setTotalMembers(profiles.length)

      // Count members per city
      const cityCounts: Record<string, number> = {}
      profiles.forEach(p => {
        if (!p.location) return
        const loc = p.location.toLowerCase().trim()
        // Match against known cities
        for (const [city, coords] of Object.entries(CITY_COORDS)) {
          if (loc.includes(city)) {
            cityCounts[city] = (cityCounts[city] || 0) + 1
            break
          }
        }
      })

      const maxCount = Math.max(...Object.values(cityCounts), 1)

      const spots: HotSpot[] = Object.entries(cityCounts).map(([city, count]) => ({
        ...CITY_COORDS[city],
        count,
        intensity: count / maxCount,
      }))

      // No demo data -- only show real members

      setHotSpots(spots)
    }
    fetchData()
  }, [])

  const handleSpotClick = (spot: HotSpot) => {
    if (zoom.scale === 1) {
      setZoom({ scale: 2.5, x: -spot.x * 1.5 + 480, y: -spot.y * 1.5 + 300 })
    } else {
      setZoom({ scale: 1, x: 0, y: 0 })
    }
  }

  const resetZoom = () => setZoom({ scale: 1, x: 0, y: 0 })

  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '12px', background: 'rgba(18,18,30,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}>
      {/* Header */}
      <div style={{ padding: '20px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 className="font-bold text-foreground" style={{ fontSize: '1rem' }}>Where The Scene Is Happening</h3>
          <p className="text-muted" style={{ fontSize: '12px', marginTop: '4px' }}>{totalMembers} members nationwide {zoom.scale > 1 && '· Click map to zoom out'}</p>
        </div>
        {zoom.scale > 1 && (
          <button onClick={resetZoom} style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '6px', padding: '6px 14px', color: '#a78bfa', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
            Zoom Out
          </button>
        )}
      </div>

      {/* Map */}
      <div style={{ padding: '16px', cursor: zoom.scale > 1 ? 'zoom-out' : 'default' }} onClick={zoom.scale > 1 ? resetZoom : undefined}>
        <svg
          ref={svgRef}
          viewBox="0 0 960 600"
          style={{ width: '100%', height: 'auto', maxHeight: '400px', transition: 'transform 0.6s ease' }}
        >
          <g style={{ transform: `scale(${zoom.scale}) translate(${zoom.x / zoom.scale}px, ${zoom.y / zoom.scale}px)`, transformOrigin: 'center', transition: 'transform 0.6s ease' }}>
            {/* US outline (simplified) */}
            <path
              d="M120,100 L170,80 L230,90 L280,70 L350,90 L420,85 L500,90 L580,80 L650,90 L720,85 L780,100 L830,120 L850,170 L840,210 L830,250 L810,290 L790,310 L770,340 L760,370 L770,410 L760,440 L740,470 L720,490 L680,490 L650,470 L620,460 L590,470 L560,460 L530,470 L500,460 L470,450 L440,440 L400,430 L360,410 L320,410 L280,420 L240,410 L200,390 L170,380 L150,350 L140,310 L130,270 L120,230 L115,190 L120,150 Z"
              fill="none"
              stroke="rgba(124,58,237,0.15)"
              strokeWidth="2"
            />

            {/* State-ish grid lines for visual depth */}
            {[150, 200, 250, 300, 350, 400, 450].map(y => (
              <line key={`h${y}`} x1="120" y1={y} x2="850" y2={y} stroke="rgba(124,58,237,0.04)" strokeWidth="1" />
            ))}
            {[200, 300, 400, 500, 600, 700, 800].map(x => (
              <line key={`v${x}`} x1={x} y1="70" x2={x} y2="500" stroke="rgba(124,58,237,0.04)" strokeWidth="1" />
            ))}

            {/* Heat spots */}
            {hotSpots.map((spot, i) => {
              const radius = 8 + spot.intensity * 20
              const glowRadius = radius * 3
              return (
                <g
                  key={i}
                  onClick={(e) => { e.stopPropagation(); handleSpotClick(spot) }}
                  onMouseEnter={() => setTooltip({ x: spot.x, y: spot.y, label: spot.label, count: spot.count })}
                  onMouseLeave={() => setTooltip(null)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Outer glow */}
                  <circle cx={spot.x} cy={spot.y} r={glowRadius} fill={`rgba(124,58,237,${0.05 + spot.intensity * 0.1})`}>
                    <animate attributeName="r" values={`${glowRadius * 0.8};${glowRadius * 1.2};${glowRadius * 0.8}`} dur={`${3 + Math.random() * 2}s`} repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.6;1;0.6" dur={`${3 + Math.random() * 2}s`} repeatCount="indefinite" />
                  </circle>

                  {/* Mid glow */}
                  <circle cx={spot.x} cy={spot.y} r={radius * 1.5} fill={`rgba(249,115,22,${0.1 + spot.intensity * 0.15})`}>
                    <animate attributeName="r" values={`${radius * 1.3};${radius * 1.8};${radius * 1.3}`} dur={`${2 + Math.random() * 2}s`} repeatCount="indefinite" />
                  </circle>

                  {/* Core dot */}
                  <circle cx={spot.x} cy={spot.y} r={radius * 0.4} fill={`rgba(249,115,22,${0.6 + spot.intensity * 0.4})`} />

                  {/* Bright center */}
                  <circle cx={spot.x} cy={spot.y} r={radius * 0.15} fill="rgba(255,255,255,0.8)" />
                </g>
              )
            })}

            {/* Tooltip */}
            {tooltip && (
              <g>
                <rect
                  x={tooltip.x - 60}
                  y={tooltip.y - 45}
                  width="120"
                  height="32"
                  rx="6"
                  fill="rgba(12,12,20,0.9)"
                  stroke="rgba(124,58,237,0.3)"
                  strokeWidth="1"
                />
                <text x={tooltip.x} y={tooltip.y - 32} textAnchor="middle" fill="#a78bfa" fontSize="10" fontWeight="600">
                  {tooltip.label}
                </text>
                <text x={tooltip.x} y={tooltip.y - 20} textAnchor="middle" fill="#fb923c" fontSize="9">
                  {tooltip.count} member{tooltip.count !== 1 ? 's' : ''}
                </text>
              </g>
            )}
          </g>
        </svg>
      </div>

      {/* Legend */}
      <div style={{ padding: '0 24px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(249,115,22,0.4)' }} />
          <span className="text-muted" style={{ fontSize: '11px' }}>Few members</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'rgba(249,115,22,0.7)', boxShadow: '0 0 8px rgba(249,115,22,0.4)' }} />
          <span className="text-muted" style={{ fontSize: '11px' }}>Many members</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: 'rgba(249,115,22,0.9)', boxShadow: '0 0 12px rgba(249,115,22,0.6)' }} />
          <span className="text-muted" style={{ fontSize: '11px' }}>Hot spot</span>
        </div>
      </div>
    </div>
  )
}
