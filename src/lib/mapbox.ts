import mapboxgl from 'mapbox-gl'

export function getMapboxToken(): string {
  const t = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  if (!t) throw new Error('NEXT_PUBLIC_MAPBOX_TOKEN is not set')
  return t
}

let tokenSet = false
export function ensureMapboxToken(): void {
  if (tokenSet) return
  mapboxgl.accessToken = getMapboxToken()
  tokenSet = true
}

export interface ParsedAddress {
  formatted: string
  street: string
  city: string
  state: string
  zip: string
  country: string
  lat: number | null
  lng: number | null
}

function parseFeature(f: any): ParsedAddress {
  const p = f.properties || {}
  const ctx = p.context || {}
  const type = p.feature_type

  const streetLine = p.address_number && (p.street_name || ctx.street?.name)
    ? `${p.address_number} ${p.street_name || ctx.street?.name}`.trim()
    : (type === 'street' ? p.name : '')

  const city = ctx.place?.name || ctx.locality?.name || (type === 'place' ? p.name : '')

  const lat = f.geometry?.coordinates?.[1] ?? p.coordinates?.latitude ?? null
  const lng = f.geometry?.coordinates?.[0] ?? p.coordinates?.longitude ?? null

  return {
    formatted: p.full_address || p.place_formatted || p.name || '',
    street: streetLine,
    city,
    state: ctx.region?.region_code || '',
    zip: ctx.postcode?.name || '',
    country: ctx.country?.country_code?.toUpperCase() || '',
    lat, lng,
  }
}

export async function searchAddresses(query: string, mode: 'address' | 'city' = 'address'): Promise<ParsedAddress[]> {
  const token = getMapboxToken()
  const types = mode === 'city' ? 'place,locality' : 'address,place,postcode,street'
  const url = `https://api.mapbox.com/search/geocode/v6/forward?q=${encodeURIComponent(query)}&limit=6&country=us&types=${types}&access_token=${token}`
  const res = await fetch(url)
  if (!res.ok) return []
  const data = await res.json()
  return (data.features || []).map(parseFeature).filter((p: ParsedAddress) => p.formatted)
}

export async function geocodeCityState(city: string, state: string): Promise<{ lat: number; lng: number } | null> {
  const token = getMapboxToken()
  const url = `https://api.mapbox.com/search/geocode/v6/forward?q=${encodeURIComponent(`${city}, ${state}`)}&country=us&types=place&limit=1&access_token=${token}`
  try {
    const res = await fetch(url)
    const data = await res.json()
    const f = data.features?.[0]
    const lat = f?.geometry?.coordinates?.[1]
    const lng = f?.geometry?.coordinates?.[0]
    if (lat == null || lng == null) return null
    return { lat, lng }
  } catch {
    return null
  }
}

export const STATE_CENTERS: Record<string, { lat: number; lng: number; zoom: number }> = {
  AL: { lat: 32.806671, lng: -86.791130, zoom: 6 },
  AK: { lat: 61.370716, lng: -152.404419, zoom: 3 },
  AZ: { lat: 33.729759, lng: -111.431221, zoom: 5 },
  AR: { lat: 34.969704, lng: -92.373123, zoom: 6 },
  CA: { lat: 36.116203, lng: -119.681564, zoom: 5 },
  CO: { lat: 39.059811, lng: -105.311104, zoom: 6 },
  CT: { lat: 41.597782, lng: -72.755371, zoom: 7 },
  DE: { lat: 39.318523, lng: -75.507141, zoom: 7 },
  FL: { lat: 27.766279, lng: -81.686783, zoom: 5 },
  GA: { lat: 33.040619, lng: -83.643074, zoom: 6 },
  HI: { lat: 21.094318, lng: -157.498337, zoom: 6 },
  ID: { lat: 44.240459, lng: -114.478828, zoom: 5 },
  IL: { lat: 40.349457, lng: -88.986137, zoom: 6 },
  IN: { lat: 39.849426, lng: -86.258278, zoom: 6 },
  IA: { lat: 42.011539, lng: -93.210526, zoom: 6 },
  KS: { lat: 38.526600, lng: -96.726486, zoom: 6 },
  KY: { lat: 37.668140, lng: -84.670067, zoom: 6 },
  LA: { lat: 31.169546, lng: -91.867805, zoom: 6 },
  ME: { lat: 44.693947, lng: -69.381927, zoom: 6 },
  MD: { lat: 39.063946, lng: -76.802101, zoom: 7 },
  MA: { lat: 42.230171, lng: -71.530106, zoom: 7 },
  MI: { lat: 43.326618, lng: -84.536095, zoom: 6 },
  MN: { lat: 45.694454, lng: -93.900192, zoom: 5 },
  MS: { lat: 32.741646, lng: -89.678696, zoom: 6 },
  MO: { lat: 38.456085, lng: -92.288368, zoom: 6 },
  MT: { lat: 46.921925, lng: -110.454353, zoom: 5 },
  NE: { lat: 41.125370, lng: -98.268082, zoom: 6 },
  NV: { lat: 38.313515, lng: -117.055374, zoom: 5 },
  NH: { lat: 43.452492, lng: -71.563896, zoom: 6 },
  NJ: { lat: 40.298904, lng: -74.521011, zoom: 7 },
  NM: { lat: 34.840515, lng: -106.248482, zoom: 6 },
  NY: { lat: 42.165726, lng: -74.948051, zoom: 6 },
  NC: { lat: 35.630066, lng: -79.806419, zoom: 6 },
  ND: { lat: 47.528912, lng: -99.784012, zoom: 6 },
  OH: { lat: 40.388783, lng: -82.764915, zoom: 6 },
  OK: { lat: 35.565342, lng: -96.928917, zoom: 6 },
  OR: { lat: 44.572021, lng: -122.070938, zoom: 6 },
  PA: { lat: 40.590752, lng: -77.209755, zoom: 6 },
  RI: { lat: 41.680893, lng: -71.511780, zoom: 8 },
  SC: { lat: 33.856892, lng: -80.945007, zoom: 6 },
  SD: { lat: 44.299782, lng: -99.438828, zoom: 6 },
  TN: { lat: 35.747845, lng: -86.692345, zoom: 6 },
  TX: { lat: 31.054487, lng: -97.563461, zoom: 5 },
  UT: { lat: 40.150032, lng: -111.862434, zoom: 5 },
  VT: { lat: 44.045876, lng: -72.710686, zoom: 6 },
  VA: { lat: 37.769337, lng: -78.169968, zoom: 6 },
  WA: { lat: 47.400902, lng: -121.490494, zoom: 6 },
  WV: { lat: 38.491226, lng: -80.954453, zoom: 6 },
  WI: { lat: 44.268543, lng: -89.616508, zoom: 6 },
  WY: { lat: 42.755966, lng: -107.302490, zoom: 5 },
  DC: { lat: 38.897438, lng: -77.026817, zoom: 10 },
}

export function centerForState(state: string | null | undefined) {
  const key = (state || '').toUpperCase()
  return STATE_CENTERS[key] || { lat: 39.8283, lng: -98.5795, zoom: 3 }
}

export const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
  MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
  OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
  DC: 'District of Columbia',
}

export function stateFullName(code: string | null | undefined): string {
  if (!code) return ''
  return STATE_NAMES[code.toUpperCase()] || code
}
