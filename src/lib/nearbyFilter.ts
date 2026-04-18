import type { SupabaseClient } from '@supabase/supabase-js'
import { geocodeCityState } from '@/lib/mapbox'

export const NEARBY_RADIUS_MILES = 100

export interface NearbyPrefs {
  state: string | null
  userCoords: { lat: number; lng: number } | null
  radius: number
  filterClubs: boolean
  filterEvents: boolean
  filterPeople: boolean
  filterMarketplace: boolean
}

export async function getNearbyPrefs(supabase: SupabaseClient): Promise<NearbyPrefs> {
  const empty: NearbyPrefs = { state: null, userCoords: null, radius: NEARBY_RADIUS_MILES, filterClubs: false, filterEvents: false, filterPeople: false, filterMarketplace: false }
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return empty
  const { data } = await supabase
    .from('profiles')
    .select('location, filter_clubs_nearby, filter_events_nearby, filter_people_nearby, filter_marketplace_nearby')
    .eq('id', user.id)
    .single()
  if (!data) return empty
  const parts = (data.location || '').split(',').map((s: string) => s.trim())
  const city = parts[0] || ''
  const state = (parts[1] || '').toUpperCase().slice(0, 2) || null

  // Geocode the user's home city so "nearby" means radius, not state match.
  let userCoords: { lat: number; lng: number } | null = null
  if (city && state) {
    try { userCoords = await geocodeCityState(city, state) } catch { userCoords = null }
  }

  return {
    state,
    userCoords,
    radius: NEARBY_RADIUS_MILES,
    filterClubs: !!data.filter_clubs_nearby,
    filterEvents: !!data.filter_events_nearby,
    filterPeople: !!data.filter_people_nearby,
    filterMarketplace: !!data.filter_marketplace_nearby,
  }
}

// Haversine distance between two lat/lng points in miles.
export function distanceMiles(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 3958.8
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/**
 * Filter an array of items to those within the user's nearby radius.
 * Caller supplies a function to pull city/state (or existing lat/lng) from each item.
 * The geocodeCache is shared across pages so identical cities don't re-geocode.
 */
const sharedGeoCache = new Map<string, { lat: number; lng: number } | null>()

export async function filterByRadius<T>(
  items: T[],
  prefs: NearbyPrefs,
  getLocation: (item: T) => { lat?: number | null; lng?: number | null; city?: string | null; state?: string | null }
): Promise<T[]> {
  if (!prefs.userCoords) return items

  // Collect items that need geocoding
  const need: { key: string; city: string; state: string }[] = []
  for (const it of items) {
    const loc = getLocation(it)
    if (loc.lat != null && loc.lng != null) continue
    const city = (loc.city || '').trim()
    const state = ((loc.state || '').trim()).toUpperCase().slice(0, 2)
    if (!city || !state) continue
    const key = `${city.toLowerCase()}|${state.toLowerCase()}`
    if (!sharedGeoCache.has(key)) need.push({ key, city, state })
  }
  const unique = Array.from(new Map(need.map(n => [n.key, n])).values())
  await Promise.all(unique.map(async n => {
    try { sharedGeoCache.set(n.key, await geocodeCityState(n.city, n.state)) }
    catch { sharedGeoCache.set(n.key, null) }
  }))

  return items.filter(it => {
    const loc = getLocation(it)
    let coords: { lat: number; lng: number } | null = null
    if (loc.lat != null && loc.lng != null) coords = { lat: loc.lat, lng: loc.lng }
    else {
      const city = (loc.city || '').trim().toLowerCase()
      const state = ((loc.state || '').trim()).toLowerCase().slice(0, 2)
      const cached = sharedGeoCache.get(`${city}|${state}`)
      if (cached) coords = cached
    }
    if (!coords) return false
    return distanceMiles(prefs.userCoords!, coords) <= prefs.radius
  })
}
