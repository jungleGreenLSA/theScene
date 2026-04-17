'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { createClient } from '@/lib/supabase/client'
import { centerForState, geocodeCityState, ensureMapboxToken } from '@/lib/mapbox'

interface Props {
  type: 'events' | 'clubs' | 'shops'
  title: string
}

export default function StateHeatmap({ type, title }: Props) {
  const supabase = createClient()
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<mapboxgl.Map | null>(null)
  const [state, setState] = useState<string | null>(null)
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    const build = async () => {
      try { ensureMapboxToken() }
      catch (e: any) { setError(e.message || 'Mapbox token missing'); setLoading(false); return }

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

      // Resolve missing coordinates via Mapbox geocoding
      const points: { lat: number; lng: number; label: string }[] = []
      for (const row of rows) {
        if (row.lat != null && row.lng != null) {
          points.push({ lat: row.lat, lng: row.lng, label: row.label })
        } else if (row.city && row.state) {
          const coords = await geocodeCityState(row.city, row.state)
          if (coords) points.push({ lat: coords.lat, lng: coords.lng, label: row.label })
        }
      }
      if (cancelled || !mapRef.current) return

      const center = centerForState(userState)
      const colorRgb = type === 'events' ? '249,115,22' : type === 'shops' ? '34,197,94' : '124,58,237'
      const colorSolid = `rgb(${colorRgb})`

      const map = new mapboxgl.Map({
        container: mapRef.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [center.lng, center.lat],
        zoom: center.zoom,
        attributionControl: true,
      })
      mapInstance.current = map

      map.on('error', (e) => {
        const msg = (e as any)?.error?.message || 'Map failed to load'
        if (!cancelled) setError(msg)
      })

      map.on('load', () => {
        if (cancelled) return
        if (points.length === 0) { setLoading(false); return }

        map.addSource('points', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: points.map(p => ({
              type: 'Feature' as const,
              geometry: { type: 'Point' as const, coordinates: [p.lng, p.lat] },
              properties: { label: p.label },
            })),
          },
        })

        map.addLayer({
          id: 'heat',
          type: 'heatmap',
          source: 'points',
          paint: {
            'heatmap-weight': 1,
            'heatmap-intensity': 1,
            'heatmap-color': [
              'interpolate', ['linear'], ['heatmap-density'],
              0, 'rgba(0,0,0,0)',
              0.2, `rgba(${colorRgb},0.35)`,
              0.5, `rgba(${colorRgb},0.6)`,
              1, colorSolid,
            ],
            'heatmap-radius': 38,
            'heatmap-opacity': 0.8,
          },
        })

        map.addLayer({
          id: 'markers',
          type: 'circle',
          source: 'points',
          paint: {
            'circle-radius': 6,
            'circle-color': colorSolid,
            'circle-stroke-width': 1.5,
            'circle-stroke-color': '#ffffff',
          },
        })

        const popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, offset: 10, className: 'scene-map-popup' })
        map.on('mouseenter', 'markers', (e) => {
          map.getCanvas().style.cursor = 'pointer'
          const f = e.features?.[0]
          if (!f) return
          const coords = ((f.geometry as any).coordinates as [number, number]).slice() as [number, number]
          const label = (f.properties as any).label || ''
          popup.setLngLat(coords).setHTML(`<div style="color:#0c0c14;font-size:11px;font-weight:700;padding:2px 4px;">${label.replace(/</g, '&lt;')}</div>`).addTo(map)
        })
        map.on('mouseleave', 'markers', () => {
          map.getCanvas().style.cursor = ''
          popup.remove()
        })

        setLoading(false)
      })
    }

    build()

    return () => {
      cancelled = true
      if (mapInstance.current) {
        mapInstance.current.remove()
        mapInstance.current = null
      }
    }
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
