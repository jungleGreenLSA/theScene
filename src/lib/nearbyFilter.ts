import type { SupabaseClient } from '@supabase/supabase-js'

export interface NearbyPrefs {
  state: string | null
  filterClubs: boolean
  filterEvents: boolean
  filterPeople: boolean
  filterMarketplace: boolean
}

export async function getNearbyPrefs(supabase: SupabaseClient): Promise<NearbyPrefs> {
  const empty: NearbyPrefs = { state: null, filterClubs: false, filterEvents: false, filterPeople: false, filterMarketplace: false }
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return empty
  const { data } = await supabase
    .from('profiles')
    .select('location, filter_clubs_nearby, filter_events_nearby, filter_people_nearby, filter_marketplace_nearby')
    .eq('id', user.id)
    .single()
  if (!data) return empty
  const parts = (data.location || '').split(',').map((s: string) => s.trim())
  const state = (parts[1] || '').toUpperCase().slice(0, 2) || null
  return {
    state,
    filterClubs: !!data.filter_clubs_nearby,
    filterEvents: !!data.filter_events_nearby,
    filterPeople: !!data.filter_people_nearby,
    filterMarketplace: !!data.filter_marketplace_nearby,
  }
}
