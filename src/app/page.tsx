import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import MemberHeatmap from '@/components/MemberHeatmap'

type Ride = {
  id: string
  slug: string
  year: number
  make: string
  model: string
  color: string | null
  primary_image_url: string | null
  props_count: number | null
  owner: { username: string } | { username: string }[] | null
}

type UpcomingEvent = {
  slug: string
  title: string
  event_date: string
  city: string | null
  state: string | null
}

const HOW_IT_WORKS = [
  { n: '01', title: 'Park your car', desc: 'Every ride gets its own page: year, make, model, specs, a categorized mod list, photo gallery, build status and a guestbook. Share it with a link or a QR card at the show.' },
  { n: '02', title: 'Give & get props', desc: 'Props are the currency. Leave them on builds you respect, sign guestbooks, earn badges. The most-propped rides get featured as Ride of the Week.' },
  { n: '03', title: 'Find your people', desc: 'Shows, meets, cruises and track days near you. Clubs to join or start. Local shops. A feed of who parked what this week, filtered to your radius.' },
]

// Every one of these ships to every member. There is no premium tier.
const INCLUDED = [
  ['Unlimited vehicles', 'Park everything you own — or used to.'],
  ['Unlimited photos', 'No per-car cap. Shoot the whole roll.'],
  ['Build journal', 'Milestones, before/afters, and a running cost tracker.'],
  ['Garage analytics', 'Views, unique visitors, and where they came from.'],
  ['Saved collections', 'Bookmark builds, events and parts for the next project.'],
  ['Marketplace listings', 'Sell parts or the whole car to people who get it.'],
  ['Host events', 'Post shows, meets and track days. Check-ins and photo feeds included.'],
  ['Start a club', 'Founders, admins, member rosters, club events and a cover.'],
  ['Feed & @mentions', 'Post photos, tag builds, follow members, react.'],
  ['Guestbook', 'Old-school. Every garage page has one.'],
  ['Spotted & WWYD', 'Log sightings in the wild. Crowd-source your next mod.'],
  ['QR garage card', 'Print it, stick it in the window at the show.'],
]

function ownerName(o: Ride['owner']) {
  if (!o) return null
  return Array.isArray(o) ? o[0]?.username : o.username
}

async function loadLanding() {
  try {
    const supabase = await createClient()
    const nowIso = new Date().toISOString()
    const [ridesRes, eventsRes, membersRes, vehiclesRes, eventsCountRes, guestbookRes] = await Promise.all([
      supabase
        .from('vehicles')
        .select('id, slug, year, make, model, color, primary_image_url, props_count, owner:profiles!owner_id(username)')
        .eq('is_public', true)
        .not('primary_image_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(6),
      supabase
        .from('events')
        .select('slug, title, event_date, city, state')
        .eq('is_public', true)
        .in('status', ['published', 'active'])
        .gte('event_date', nowIso)
        .order('event_date', { ascending: true })
        .limit(5),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('vehicles').select('id', { count: 'exact', head: true }),
      supabase.from('events').select('id', { count: 'exact', head: true }),
      supabase.from('guestbook_entries').select('id', { count: 'exact', head: true }),
    ])
    return {
      rides: (ridesRes.data || []) as Ride[],
      events: (eventsRes.data || []) as UpcomingEvent[],
      counts: {
        members: membersRes.count || 0,
        vehicles: vehiclesRes.count || 0,
        events: eventsCountRes.count || 0,
        guestbook: guestbookRes.count || 0,
      },
    }
  } catch {
    return { rides: [] as Ride[], events: [] as UpcomingEvent[], counts: { members: 0, vehicles: 0, events: 0, guestbook: 0 } }
  }
}

// The marquee runs on real rows when there are any, and on the house lines
// when the place is still empty. Duplicated once so the loop is seamless.
function tickerItems(rides: Ride[], events: UpcomingEvent[]) {
  const items: { k: string; v: string }[] = []
  rides.slice(0, 5).forEach(r => items.push({ k: 'Parked', v: `${r.year} ${r.make} ${r.model}` }))
  events.slice(0, 3).forEach(e => items.push({
    k: 'On the board',
    v: `${e.title}${e.city ? ` — ${e.city}` : ''}`,
  }))
  if (items.length === 0) {
    items.push(
      { k: 'Status', v: 'Garage open — doors unlocked' },
      { k: 'Cost', v: 'Free. All of it. Always' },
      { k: 'Wanted', v: 'Your build, on its own page' },
    )
  }
  items.push({ k: 'Members', v: 'No tiers, no paywall, no ads for your own data' })
  return items
}

const CONTAINER: React.CSSProperties = { maxWidth: '1240px', margin: '0 auto', padding: '0 20px' }

export default async function Home() {
  const { rides, events, counts } = await loadLanding()
  const marquee = tickerItems(rides, events)

  return (
    <>
      {/* ===== HERO — metal under ink, headline on top of it ===== */}
      <section className="hero">
        <div className="hero-photo">
          <Image
            src="/images/hero-porsche.png"
            alt="A member's car parked under streetlights at night"
            fill
            priority
            sizes="100vw"
            style={{ objectFit: 'cover', objectPosition: 'center 58%' }}
          />
        </div>
        <div className="hero-wash" aria-hidden="true" />

        <div className="hero-inner">
          <p className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <span className="dot-live" aria-hidden="true" />
            <span>Est. 2026</span>
            <span style={{ color: 'var(--color-muted)' }}>/</span>
            <span style={{ color: 'var(--color-steel-light)' }}>Free forever</span>
            <span style={{ color: 'var(--color-muted)' }}>/</span>
            <span style={{ color: 'var(--color-muted-light)' }}>No tiers, no paywall</span>
          </p>

          <h1 className="hero-title">
            <span className="lt">Your car.</span><br />
            <span className="out">Your page.</span><br />
            <span className="ac">Your people.</span>
          </h1>

          <p style={{ color: 'var(--color-foreground-soft)', fontSize: 'clamp(1.05rem, 1.6vw, 1.22rem)', maxWidth: '50ch', marginTop: '26px', lineHeight: 1.5 }}>
            Give your build its own page — specs, mods, photos, a guestbook — then find the
            shows, clubs and people around you. The car site a lot of us grew up on, rebuilt
            for now and run by the people parked in it.
          </p>

          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginTop: '30px' }}>
            <Link href="/auth/register" className="btn-primary" style={{ padding: '16px 32px', fontSize: '17px' }}>Claim your garage</Link>
            <Link href="/explore" className="btn-outline" style={{ padding: '16px 32px', fontSize: '17px' }}>Walk the lot</Link>
          </div>

          <p className="spec" style={{ marginTop: '18px', fontSize: '12px', letterSpacing: '0.04em' }}>
            SIGN UP WITH GOOGLE OR EMAIL · 60 SECONDS · NOTHING TO CANCEL
          </p>
        </div>

        {/* Live numbers welded to the bottom of the hero */}
        <div className="data-strip">
          <div><div className="num">{counts.members.toLocaleString()}</div><div className="lbl">Members</div></div>
          <div><div className="num">{counts.vehicles.toLocaleString()}</div><div className="lbl">Cars parked</div></div>
          <div><div className="num">{counts.events.toLocaleString()}</div><div className="lbl">Events posted</div></div>
          <div><div className="num">{counts.guestbook.toLocaleString()}</div><div className="lbl">Guestbook signs</div></div>
        </div>
      </section>

      <div className="neon-rule" aria-hidden="true" />

      {/* ===== TICKER — what's moving right now ===== */}
      <div className="ticker" aria-hidden="true">
        <div className="ticker-track">
          {[0, 1].map(pass => (
            <span key={pass} className="ticker-pass">
              {marquee.map((m, i) => (
                <span key={`${pass}-${i}`}>
                  <i>{m.k}</i>
                  <b>◆</b>
                  <span style={{ color: 'var(--color-foreground-soft)' }}>{m.v}</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ===== FRESH METAL + ON THE BOARD ===== */}
      <section style={{ padding: 'clamp(44px, 6vw, 72px) 0 0' }}>
        <div style={{ ...CONTAINER, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '32px', alignItems: 'start' }}>
          <div>
            <div className="section-head">
              <span className="idx">01</span>
              <h2>Fresh metal</h2>
              <span className="rule" />
              <span className="meta">{rides.length ? `Latest ${rides.length}` : 'Open'}</span>
            </div>
            <div className="panel">
              {rides.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                  <p className="display" style={{ fontSize: '26px', color: 'var(--color-foreground)', fontStyle: 'italic' }}>The garage is open.</p>
                  <p className="text-muted-light" style={{ marginTop: '6px', fontSize: '14px', color: 'var(--color-muted-light)' }}>Be the first to park something here.</p>
                  <Link href="/auth/register" className="btn-primary" style={{ marginTop: '20px', padding: '12px 22px', fontSize: '14px' }}>Add your car</Link>
                </div>
              ) : rides.map(r => {
                const owner = ownerName(r.owner)
                const href = owner ? `/user/${owner}/${r.slug}` : `/ride/${r.id}`
                return (
                  <Link key={r.id} href={href} className="ride-row">
                    <div className="thumb">
                      {r.primary_image_url && <img src={r.primary_image_url} alt={`${r.year} ${r.make} ${r.model}`} loading="lazy" />}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p className="display" style={{ fontSize: '20px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <span style={{ color: 'var(--color-muted-light)', fontWeight: 600 }}>{r.year}</span> {r.make} {r.model}
                      </p>
                      <p className="spec" style={{ fontSize: '12px', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {r.color ? `${r.color} · ` : ''}{owner ? `@${owner}` : 'member build'}
                      </p>
                    </div>
                    <div className="spec" style={{ textAlign: 'right', fontSize: '12px' }}>
                      <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>{r.props_count || 0}</span> props
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

          <div>
            <div className="section-head">
              <span className="idx">02</span>
              <h2>On the board</h2>
              <span className="rule" />
              <span className="meta">Events</span>
            </div>
            <div className="panel">
              {events.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                  <p className="display" style={{ fontSize: '26px', color: 'var(--color-foreground)', fontStyle: 'italic' }}>Nothing on the board.</p>
                  <p style={{ marginTop: '6px', fontSize: '14px', color: 'var(--color-muted-light)' }}>Members post the shows, meets and track days.</p>
                </div>
              ) : events.map(e => {
                const d = new Date(e.event_date)
                return (
                  <Link key={e.slug} href={`/events/${e.slug}`} className="ride-row" style={{ gridTemplateColumns: '58px 1fr' }}>
                    <div className="panel-inset" style={{ textAlign: 'center', padding: '7px 4px' }}>
                      <div className="display" style={{ fontSize: '23px', color: 'var(--color-accent)', lineHeight: 1, fontStyle: 'italic' }}>{d.getDate()}</div>
                      <div className="spec" style={{ fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase' }}>{d.toLocaleDateString('en-US', { month: 'short' })}</div>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: '15px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.title}</p>
                      <p className="spec" style={{ fontSize: '12px', marginTop: '2px' }}>
                        {[e.city, e.state].filter(Boolean).join(', ') || 'Location TBA'} · {d.toLocaleDateString('en-US', { weekday: 'short' })}
                      </p>
                    </div>
                  </Link>
                )
              })}
              <div style={{ padding: '12px 14px', borderTop: events.length ? '1px solid var(--color-border)' : 'none' }}>
                <Link href="/events" className="spec" style={{ color: 'var(--color-accent)', fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>All events →</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section style={{ padding: 'clamp(44px, 6vw, 72px) 0 0' }}>
        <div style={CONTAINER}>
          <div className="section-head">
            <span className="idx">03</span>
            <h2>How it works</h2>
            <span className="rule" />
            <span className="meta">Three moves</span>
          </div>
          <div className="feature-list">
            {HOW_IT_WORKS.map(f => (
              <div key={f.n}>
                <span className="n" aria-hidden="true">{f.n}</span>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== EVERYTHING'S INCLUDED ===== */}
      <section style={{ padding: 'clamp(44px, 6vw, 72px) 0 0' }}>
        <div style={CONTAINER}>
          <div className="panel panel-accent crop" style={{ padding: 'clamp(26px, 4vw, 44px)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 290px), 1fr))', gap: '32px', alignItems: 'start' }}>
              <div>
                <p className="eyebrow" style={{ marginBottom: '14px' }}>The whole toolbox</p>
                <h2 style={{ fontSize: 'clamp(2.1rem, 4.4vw, 3.2rem)', lineHeight: 0.92, fontStyle: 'italic', letterSpacing: '-0.025em' }}>
                  Everything&apos;s<br />
                  <span className="stencil">included.</span><br />
                  <span style={{ color: 'var(--color-accent)' }}>Full stop.</span>
                </h2>
                <p style={{ marginTop: '18px', fontSize: '15px', maxWidth: '40ch', lineHeight: 1.55, color: 'var(--color-muted-light)' }}>
                  There is no premium tier on The Scene and there won&apos;t be one. Sign up with
                  Google or your email and every member gets every feature — the same garage,
                  the same tools, the same voice.
                </p>
                <Link href="/auth/register" className="btn-primary" style={{ marginTop: '24px' }}>Create your garage</Link>
                <div className="stripe stripe-thin" aria-hidden="true" style={{ marginTop: '30px', maxWidth: '260px' }} />
                <p className="label-mono" style={{ marginTop: '12px', fontSize: '10px', lineHeight: 1.9 }}>
                  No card · No trial · No tiers<br />
                  Built and run by people with project cars
                </p>
              </div>
              <ul className="spec-list">
                {INCLUDED.map(([title, desc]) => (
                  <li key={title}>
                    <span className="tick" aria-hidden="true">[✓]</span>
                    <span>
                      <span className="t">{title}</span>
                      <span className="d">{desc}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ===== WHERE THE SCENE IS ===== */}
      <section style={{ padding: 'clamp(44px, 6vw, 72px) 0 0' }}>
        <div style={CONTAINER}>
          <div className="section-head">
            <span className="idx">04</span>
            <h2>Where the scene is</h2>
            <span className="rule" />
            <span className="meta">Members by city</span>
          </div>
          <MemberHeatmap />
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section style={{ padding: 'clamp(44px, 6vw, 72px) 0 8px' }}>
        <div style={CONTAINER}>
          <div className="panel-ink scan" style={{ overflow: 'hidden' }}>
            <div className="stripe" aria-hidden="true" />
            <div style={{ position: 'relative', zIndex: 2, padding: 'clamp(34px, 6vw, 68px) clamp(20px, 4vw, 52px)', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '28px' }}>
              <div>
                <p className="eyebrow" style={{ marginBottom: '14px', color: 'var(--color-steel-light)' }}>Last call</p>
                <h2 style={{ fontSize: 'clamp(2.4rem, 6.4vw, 4.4rem)', lineHeight: 0.9, fontStyle: 'italic', fontWeight: 800, letterSpacing: '-0.03em' }}>
                  Free. No tiers.<br /><span style={{ color: 'var(--color-accent)' }}>Just cars.</span>
                </h2>
                <p style={{ marginTop: '16px', fontSize: '15px', maxWidth: '44ch', color: 'var(--color-muted-light)' }}>
                  Your build deserves more than a classified ad and a camera roll. Give it a page.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                <Link href="/auth/register" className="btn-primary" style={{ padding: '16px 32px', fontSize: '17px' }}>Join free</Link>
                <Link href="/auth/login" className="btn-outline" style={{ padding: '16px 32px', fontSize: '17px' }}>Sign in</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
