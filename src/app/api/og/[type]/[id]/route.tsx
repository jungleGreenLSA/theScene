import { ImageResponse } from 'next/og'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

interface Data {
  headline: string
  subhead: string
  tag: string
  accent: string
  image: string | null
}

async function lookup(type: string, id: string): Promise<Data | null> {
  const supabase = await createClient()
  if (type === 'vehicle') {
    const { data } = await supabase.from('vehicles').select('year, make, model, color, primary_image_url, owner:profiles!owner_id(username, display_name)').eq('id', id).maybeSingle()
    if (!data) return null
    const owner: any = data.owner
    return {
      headline: `${data.year} ${data.make} ${data.model}`,
      subhead: `${data.color ? data.color + ' · ' : ''}by ${owner?.display_name || owner?.username || 'a Scene member'}`,
      tag: 'BUILD',
      accent: '#2dd4bf',
      image: data.primary_image_url,
    }
  }
  if (type === 'event') {
    const { data } = await supabase.from('events').select('title, city, state, event_date, cover_image_url').eq('slug', id).maybeSingle()
    if (!data) return null
    const when = new Date(data.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    return {
      headline: data.title,
      subhead: `${when}${data.city ? ` · ${data.city}, ${data.state}` : ''}`,
      tag: 'CAR SHOW',
      accent: '#fb923c',
      image: data.cover_image_url,
    }
  }
  if (type === 'sighting') {
    const { data } = await supabase.from('sightings').select('description, city, state, image_url, spotter:profiles!spotter_id_fkey(username)').eq('id', id).maybeSingle()
    if (!data) return null
    const spotter: any = data.spotter
    return {
      headline: data.description || 'Spotted in the wild',
      subhead: `${[data.city, data.state].filter(Boolean).join(', ') || 'Somewhere'} · spotted by @${spotter?.username || 'member'}`,
      tag: 'SPOTTED',
      accent: '#22c55e',
      image: data.image_url,
    }
  }
  if (type === 'club') {
    const { data } = await supabase.from('clubs').select('name, description, cover_image_url').eq('slug', id).maybeSingle()
    if (!data) return null
    return {
      headline: data.name,
      subhead: data.description || 'A car club on The Scene',
      tag: 'CLUB',
      accent: '#2dd4bf',
      image: data.cover_image_url,
    }
  }
  return null
}

export async function GET(_req: Request, { params }: { params: Promise<{ type: string; id: string }> }) {
  const { type, id } = await params
  const data = await lookup(type, id)
  if (!data) return new Response('Not Found', { status: 404 })

  return new ImageResponse(
    (
      <div style={{ display: 'flex', width: '100%', height: '100%', background: '#0c0c14' }}>
        {/* Left — content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '60px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: data.accent, letterSpacing: 4 }}>{data.tag}</span>
            <span style={{ fontSize: 64, fontWeight: 800, color: '#e2e4e9', lineHeight: 1.1 }}>{data.headline}</span>
            <span style={{ fontSize: 28, color: '#9ca3af' }}>{data.subhead}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: 28, fontWeight: 700, letterSpacing: 4, color: '#e2e4e9' }}>THE<span style={{ color: '#2dd4bf' }}>SCENE</span></span>
            <span style={{ fontSize: 20, color: '#6b7280' }}>· thescene.fyi</span>
          </div>
        </div>
        {/* Right — image */}
        {data.image && (
          <div style={{ width: 500, display: 'flex', position: 'relative' }}>
            <img src={data.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(90deg, #0c0c14 0%, transparent 40%)` }} />
          </div>
        )}
        {!data.image && (
          <div style={{ width: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${data.accent}22, ${data.accent}05)` }}>
            <span style={{ fontSize: 180 }}>🏁</span>
          </div>
        )}
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        // Browser: 1h. CDN (Cloudflare): 24h. Serve stale for 24h while
        // revalidating. OG cards for a given ID don't change often, and
        // generation is CPU-heavy — this keeps the VPS calm when a link
        // gets shared in iMessage/Discord/Twitter.
        'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
      },
    }
  )
}
