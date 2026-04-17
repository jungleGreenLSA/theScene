'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { loadGoogleMaps, centerForState, geocodeCityState } from '@/lib/googleMaps'

interface Point {
  lat: number
  lng: number
  label: string
}

interface Props {
  type: 'events' | 'clubs' | 'shops'
  title: string
}

// Dark map styling to match the site's theme
const DARK_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#12121e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0c0c14' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#6b7280' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#9ca3af' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#4b5563' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0c0c14' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#374151' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
]

export default function StateHeatmap({ type, title }: Props) {
  const supabase = createClient()
  const mapRef = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<string | null>(null)
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    let mapInstance: google.maps.Map | null = null
    let heatmap: google.maps.visualization.HeatmapLayer | null = null
    const markers: google.maps.Marker[] = []

    const build = async () => {
      // 1. Resolve user's profile state
      const { data: { user } } = await supabase.auth.getUser()
      let userState: string | null = null
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('location').eq('id', user.id).single()
        if (profile?.location) {
          const parts = profile.location.split(',').map((s: string) => s.trim())
          userState = (parts[1] || '').toUpperCase().slice(0, 2) || null
        }
      }
      if (cancelled) return
      setState(userState)

      // 2. Query the right table for rows in that state (or nationwide if unknown)
      let rows: { city: string; state: string; lat: number | null; lng: number | null; label: string }[] = []
      if (type === 'events') {
        const q = supabase.from('events').select('title, city, state, lat, lng').in('status', ['published', 'active'])
        const { data } = userState ? await q.eq('state', userState) : await q
        rows = (data || []).map(e => ({ city: e.city, state: e.state, lat: e.lat, lng: e.lng, label: e.title }))
      } else if (type === 'shops') {
        const q = supabase.from('shops').select('name, city, state, lat, lng')
        const { data } = userState ? await q.eq('state', userState) : await q
        rows = (data || []).map(s => ({ city: s.city, state: s.state, lat: s.lat, lng: s.lng, label: s.name }))
      } else {
        const q = supabase.from('club_locations').select('city, state, lat, lng, clubs(name)')
        const { data } = userState ? await q.eq('state', userState) : await q
        rows = (data || []).map((l: any) => ({ city: l.city, state: l.state, lat: l.lat, lng: l.lng, label: l.clubs?.name || 'Club' }))
      }
      if (cancelled) return
      setCount(rows.length)

      // 3. Load Google Maps
      try {
        await loadGoogleMaps()
      } catch (e: any) {
        if (cancelled) return
        setError(e.message || 'Google Maps failed to load')
        setLoading(false)
        return
      }
      if (cancelled || !mapRef.current || !window.google) return

      // 4. Geocode any rows missing lat/lng (city+state)
      const points: Point[] = []
      for (const row of rows) {
        if (row.lat != null && row.lng != null) {
          points.push({ lat: row.lat, lng: row.lng, label: row.label })
        } else if (row.city && row.state) {
          const coords = await geocodeCityState(row.city, row.state)
          if (coords) points.push({ lat: coords.lat, lng: coords.lng, label: row.label })
        }
      }
      if (cancelled) return

      // 5. Build map
      const center = centerForState(userState)
      mapInstance = new window.google.maps.Map(mapRef.current, {
        center: { lat: center.lat, lng: center.lng },
        zoom: center.zoom,
        styles: DARK_MAP_STYLES,
        disableDefaultUI: true,
        zoomControl: true,
        gestureHandling: 'cooperative',
      })

      if (points.length > 0) {
        const color = type === 'events' ? [249, 115, 22] : type === 'shops' ? [34, 197, 94] : [124, 58, 237]
        heatmap = new window.google.maps.visualization.HeatmapLayer({
          data: points.map(p => new window.google!.maps.LatLng(p.lat, p.lng)),
          radius: 40,
          opacity: 0.75,
          gradient: [
            'rgba(0,0,0,0)',
            `rgba(${color[0]},${color[1]},${color[2]},0.4)`,
            `rgba(${color[0]},${color[1]},${color[2]},0.7)`,
            `rgba(${color[0]},${color[1]},${color[2]},1)`,
          ],
        })
        heatmap.setMap(mapInstance)

        // Clickable markers so users can see what the heat represents
        points.forEach(p => {
          const marker = new window.google!.maps.Marker({
            position: { lat: p.lat, lng: p.lng },
            map: mapInstance!,
            icon: {
              path: window.google!.maps.SymbolPath.CIRCLE,
              scale: 5,
              fillColor: `rgb(${color[0]},${color[1]},${color[2]})`,
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 1,
            },
            title: p.label,
          })
          markers.push(marker)
        })
      }

      setLoading(false)
    }

    build()

    return () => {
      cancelled = true
      if (heatmap) heatmap.setMap(null)
      markers.forEach(m => m.setMap(null))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type])

  return (
    <div className="glass" style={{ padding: '16px', borderRadius: '12px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#e2e4e9' }}>
          {title} {state && <span style={{ color: type === 'events' ? '#fb923c' : type === 'shops' ? '#22c55e' : '#a78bfa' }}>in {state}</span>}
        </h3>
        <span style={{ fontSize: '11px', color: '#6b7280' }}>
          {loading ? 'Loading...' : `${count} ${count === 1 ? 'spot' : 'spots'}`}
        </span>
      </div>
      {error ? (
        <div style={{ fontSize: '12px', color: '#f59e0b', padding: '20px', textAlign: 'center' }}>⚠ {error}</div>
      ) : (
        <div ref={mapRef} style={{ width: '100%', height: '280px', borderRadius: '8px', background: 'rgba(18,18,30,0.5)' }} />
      )}
      {!loading && !error && count === 0 && state && (
        <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px', textAlign: 'center' }}>
          No {type} in {state} yet. Be the first!
        </p>
      )}
    </div>
  )
}
