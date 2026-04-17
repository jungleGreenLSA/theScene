// Single idempotent loader for the Google Maps JS API.
// Loads Places + Visualization libraries so Autocomplete and HeatmapLayer
// are both available after resolution.

declare global {
  interface Window {
    google?: typeof google
    __gmapsLoading?: Promise<void>
  }
}

export function loadGoogleMaps(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.google?.maps?.places && window.google?.maps?.visualization) return Promise.resolve()
  if (window.__gmapsLoading) return window.__gmapsLoading

  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY
  if (!key) {
    return Promise.reject(new Error('NEXT_PUBLIC_GOOGLE_MAPS_KEY is not set'))
  }

  window.__gmapsLoading = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places,visualization&v=weekly`
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google Maps JS API'))
    document.head.appendChild(script)
  })

  return window.__gmapsLoading
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

export function parsePlace(place: google.maps.places.PlaceResult): ParsedAddress {
  const get = (type: string, short = false) => {
    const c = place.address_components?.find(c => c.types.includes(type))
    return c ? (short ? c.short_name : c.long_name) : ''
  }
  const streetNumber = get('street_number')
  const route = get('route')
  return {
    formatted: place.formatted_address || '',
    street: [streetNumber, route].filter(Boolean).join(' '),
    city: get('locality') || get('sublocality') || get('postal_town') || get('administrative_area_level_2'),
    state: get('administrative_area_level_1', true),
    zip: get('postal_code'),
    country: get('country', true),
    lat: place.geometry?.location?.lat() ?? null,
    lng: place.geometry?.location?.lng() ?? null,
  }
}

// Geocode a "City, State" string (for legacy records missing lat/lng)
export async function geocodeCityState(city: string, state: string): Promise<{ lat: number; lng: number } | null> {
  await loadGoogleMaps()
  return new Promise((resolve) => {
    const geocoder = new window.google!.maps.Geocoder()
    geocoder.geocode({ address: `${city}, ${state}, USA` }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const loc = results[0].geometry.location
        resolve({ lat: loc.lat(), lng: loc.lng() })
      } else {
        resolve(null)
      }
    })
  })
}

// State center + zoom presets for the heatmap view. Anything not in the list
// falls back to a US-wide view.
export const STATE_CENTERS: Record<string, { lat: number; lng: number; zoom: number }> = {
  AL: { lat: 32.806671, lng: -86.791130, zoom: 7 },
  AK: { lat: 61.370716, lng: -152.404419, zoom: 4 },
  AZ: { lat: 33.729759, lng: -111.431221, zoom: 6 },
  AR: { lat: 34.969704, lng: -92.373123, zoom: 7 },
  CA: { lat: 36.116203, lng: -119.681564, zoom: 6 },
  CO: { lat: 39.059811, lng: -105.311104, zoom: 7 },
  CT: { lat: 41.597782, lng: -72.755371, zoom: 8 },
  DE: { lat: 39.318523, lng: -75.507141, zoom: 8 },
  FL: { lat: 27.766279, lng: -81.686783, zoom: 6 },
  GA: { lat: 33.040619, lng: -83.643074, zoom: 7 },
  HI: { lat: 21.094318, lng: -157.498337, zoom: 7 },
  ID: { lat: 44.240459, lng: -114.478828, zoom: 6 },
  IL: { lat: 40.349457, lng: -88.986137, zoom: 7 },
  IN: { lat: 39.849426, lng: -86.258278, zoom: 7 },
  IA: { lat: 42.011539, lng: -93.210526, zoom: 7 },
  KS: { lat: 38.526600, lng: -96.726486, zoom: 7 },
  KY: { lat: 37.668140, lng: -84.670067, zoom: 7 },
  LA: { lat: 31.169546, lng: -91.867805, zoom: 7 },
  ME: { lat: 44.693947, lng: -69.381927, zoom: 7 },
  MD: { lat: 39.063946, lng: -76.802101, zoom: 8 },
  MA: { lat: 42.230171, lng: -71.530106, zoom: 8 },
  MI: { lat: 43.326618, lng: -84.536095, zoom: 7 },
  MN: { lat: 45.694454, lng: -93.900192, zoom: 6 },
  MS: { lat: 32.741646, lng: -89.678696, zoom: 7 },
  MO: { lat: 38.456085, lng: -92.288368, zoom: 7 },
  MT: { lat: 46.921925, lng: -110.454353, zoom: 6 },
  NE: { lat: 41.125370, lng: -98.268082, zoom: 7 },
  NV: { lat: 38.313515, lng: -117.055374, zoom: 6 },
  NH: { lat: 43.452492, lng: -71.563896, zoom: 7 },
  NJ: { lat: 40.298904, lng: -74.521011, zoom: 8 },
  NM: { lat: 34.840515, lng: -106.248482, zoom: 7 },
  NY: { lat: 42.165726, lng: -74.948051, zoom: 7 },
  NC: { lat: 35.630066, lng: -79.806419, zoom: 7 },
  ND: { lat: 47.528912, lng: -99.784012, zoom: 7 },
  OH: { lat: 40.388783, lng: -82.764915, zoom: 7 },
  OK: { lat: 35.565342, lng: -96.928917, zoom: 7 },
  OR: { lat: 44.572021, lng: -122.070938, zoom: 7 },
  PA: { lat: 40.590752, lng: -77.209755, zoom: 7 },
  RI: { lat: 41.680893, lng: -71.511780, zoom: 9 },
  SC: { lat: 33.856892, lng: -80.945007, zoom: 7 },
  SD: { lat: 44.299782, lng: -99.438828, zoom: 7 },
  TN: { lat: 35.747845, lng: -86.692345, zoom: 7 },
  TX: { lat: 31.054487, lng: -97.563461, zoom: 6 },
  UT: { lat: 40.150032, lng: -111.862434, zoom: 6 },
  VT: { lat: 44.045876, lng: -72.710686, zoom: 7 },
  VA: { lat: 37.769337, lng: -78.169968, zoom: 7 },
  WA: { lat: 47.400902, lng: -121.490494, zoom: 7 },
  WV: { lat: 38.491226, lng: -80.954453, zoom: 7 },
  WI: { lat: 44.268543, lng: -89.616508, zoom: 7 },
  WY: { lat: 42.755966, lng: -107.302490, zoom: 6 },
  DC: { lat: 38.897438, lng: -77.026817, zoom: 11 },
}

export function centerForState(state: string | null | undefined) {
  const key = (state || '').toUpperCase()
  return STATE_CENTERS[key] || { lat: 39.8283, lng: -98.5795, zoom: 4 }
}
