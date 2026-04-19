import Link from 'next/link'
import Image from 'next/image'
import MemberHeatmap from '@/components/MemberHeatmap'
import LiveStats from '@/components/LiveStats'
import { createClient } from '@/lib/supabase/server'

const BROWSE_CATEGORIES = [
  { slug: 'domestic', label: 'Domestic', desc: 'American muscle & power' },
  { slug: 'import', label: 'Import', desc: 'JDM performance' },
  { slug: 'euro-power', label: 'Euro Power', desc: 'European & exotic' },
  { slug: 'trucks', label: 'Trucks', desc: 'Built to work & play' },
  { slug: 'classic', label: 'Classic', desc: 'Timeless machines' },
  { slug: 'off-road', label: 'Off-Road', desc: 'Trail-ready rigs' },
  { slug: 'stance', label: 'Stance', desc: 'Low & wide' },
  { slug: 'race', label: 'Race', desc: 'Track-built weapons' },
]

const HOW_IT_WORKS = [
  {
    title: 'Build Your Garage',
    desc: "Your car gets its own page with specs, mods, photos, and a guestbook. Just like the original CarDomain — but better.",
  },
  {
    title: 'Give & Get Props',
    desc: "Show love for builds you respect. Props, guestbook entries, and trophy badges. The more props, the higher you climb.",
  },
  {
    title: 'Discover & Connect',
    desc: "Find car shows, meets, and track days near you. Browse builds by make, model, or location. Check in at events and share photos.",
  },
]

const PLATFORM_FEATURES = [
  { title: 'Structured Mod Lists', desc: 'Every mod categorized: engine, exhaust, suspension, wheels, exterior, interior, tuning. Browse other builds by specific parts.' },
  { title: 'Guestbook', desc: 'Every garage page has a guestbook where visitors leave messages. Built-in profanity and spam filter keeps it clean.' },
  { title: 'Ride of the Week', desc: 'The most-propped builds get featured on the homepage. Community-driven voting puts the best builds in the spotlight.' },
  { title: 'Regional Discovery', desc: 'Find builds near you. Search by city, state, or zip. Location-based browsing makes local connections easy.' },
  { title: 'Event Check-In & Photos', desc: 'At a car show? Check in to tag your car. After the event, photos get tagged to both the event and the cars.' },
  { title: 'Similar Builds', desc: 'Every garage page shows other builds of the same make and model. See how others built the same platform.' },
]

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isMember = !!user

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '14px 12px 40px' }}>
      {/* ========== WELCOME / HERO ========== */}
      <section className="section-block" style={{ marginBottom: '14px' }}>
        <div className="welcome-row" style={{ padding: '24px 22px' }}>
          <div style={{ flexShrink: 0 }}>
            <Image
              src="/images/logo.png"
              alt="The Scene"
              width={104}
              height={104}
              priority
            />
          </div>
          <div className="page-welcome" style={{ flex: '1 1 340px', minWidth: 0 }}>
            <h1 style={{ fontSize: 'clamp(22px, 3.2vw, 30px)', fontWeight: 800, color: '#0d3556', marginBottom: '6px' }}>
              Your Ride Is Your Identity.
            </h1>
            <p style={{ fontSize: '14px', color: '#2c3e50', lineHeight: 1.55, maxWidth: '560px' }}>
              Build your garage. Show off your build. Connect with enthusiasts. Discover car shows and events across the country. Welcome to <strong style={{ color: '#1d4d7a' }}>The Scene</strong>.
            </p>
          </div>
          {!isMember && (
            <div className="welcome-cta">
              <Link href="/auth/register" className="btn-neon">Build Your Garage</Link>
              <Link href="/pricing" className="btn-outline">See Plans</Link>
            </div>
          )}
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section className="section-block">
        <div className="section-head">
          <h2>How It Works</h2>
          <span className="section-head-meta">More than a profile — it&apos;s a garage</span>
        </div>
        <div className="section-body">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
            gap: '12px',
          }}>
            {HOW_IT_WORKS.map(f => (
              <div key={f.title} style={{
                padding: '16px 18px',
                background: '#f7fbff',
                border: '1px solid #c8d9e8',
                borderLeft: '3px solid #2c79c4',
              }}>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0d3556', marginBottom: '6px' }}>{f.title}</h3>
                <p style={{ fontSize: '13px', color: '#2c3e50', lineHeight: 1.5 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== WHERE THE ACTION IS ========== */}
      <section className="section-block">
        <div className="section-head">
          <h2>Where The Action Is</h2>
          <Link href="/explore">Explore Near You →</Link>
        </div>
        <div className="section-body">
          <MemberHeatmap />
        </div>
      </section>

      {/* ========== PLATFORM FEATURES ========== */}
      <section className="section-block">
        <div className="section-head">
          <h2>Everything Your Build Deserves</h2>
          <span className="section-head-meta">Six things we built into every garage</span>
        </div>
        <div className="section-body">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
            gap: '12px',
          }}>
            {PLATFORM_FEATURES.map(f => (
              <div key={f.title} style={{
                padding: '14px 16px',
                background: '#ffffff',
                border: '1px solid #c8d9e8',
              }}>
                <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#1d4d7a', marginBottom: '4px' }}>{f.title}</h3>
                <p style={{ fontSize: '13px', color: '#2c3e50', lineHeight: 1.5 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== MEMBERSHIP TIERS ========== */}
      <section className="section-block">
        <div className="section-head">
          <h2>Free or Premium — you pick</h2>
          <Link href="/pricing">See Full Plans →</Link>
        </div>
        <div className="section-body">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
            gap: '12px',
          }}>
            {/* FREE */}
            <div style={{
              padding: '18px',
              background: '#ffffff',
              border: '1px solid #c4c4c4',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}>
              <div>
                <span style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  background: '#eaeaea',
                  border: '1px solid #b0b0b0',
                  color: '#3a3a3a',
                  fontSize: '10px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  borderRadius: '2px',
                }}>Free</span>
                <p style={{ fontSize: '24px', fontWeight: 800, color: '#0d3556', marginTop: '6px' }}>
                  $0 <span style={{ fontSize: '13px', fontWeight: 500, color: '#2c3e50' }}>/ month</span>
                </p>
                <p style={{ fontSize: '12px', color: '#2c3e50' }}>Get on the scene. No card required.</p>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '13px', color: '#1a1a1a', lineHeight: 1.8 }}>
                <li>✓ 1 vehicle in your garage</li>
                <li>✓ 5 photos per vehicle</li>
                <li>✓ Guestbook, props, heatmap</li>
                <li>✓ Join events and clubs</li>
                <li>✓ Marketplace (2 active listings)</li>
              </ul>
              {!isMember && (
                <Link href="/auth/register" className="btn-outline" style={{ justifyContent: 'center', marginTop: 'auto' }}>
                  Start Free
                </Link>
              )}
            </div>

            {/* PREMIUM */}
            <div style={{
              padding: '18px',
              background: 'linear-gradient(180deg, #f7fbff 0%, #eaf4fb 100%)',
              border: '2px solid #2c79c4',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              boxShadow: '0 2px 10px rgba(44, 121, 196, 0.18)',
            }}>
              <span style={{
                position: 'absolute',
                top: '-11px',
                right: '14px',
                padding: '2px 10px',
                background: 'linear-gradient(180deg, #4fc3f7 0%, #2c79c4 100%)',
                color: '#fff',
                fontSize: '10px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                borderRadius: '2px',
                textShadow: '0 1px 0 rgba(0,0,0,0.25)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3), 0 1px 2px rgba(0,0,0,0.15)',
              }}>Most Popular</span>
              <div>
                <span style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  background: '#1d4d7a',
                  color: '#fff',
                  fontSize: '10px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  borderRadius: '2px',
                }}>Premium</span>
                <p style={{ fontSize: '24px', fontWeight: 800, color: '#0d3556', marginTop: '6px' }}>
                  $4.99 <span style={{ fontSize: '13px', fontWeight: 500, color: '#2c3e50' }}>/ month</span>
                </p>
                <p style={{ fontSize: '12px', color: '#2c3e50' }}>
                  Or $49.99/yr — save ~16%.
                </p>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '13px', color: '#0d3556', lineHeight: 1.8, fontWeight: 500 }}>
                <li>✓ Unlimited vehicles + photos</li>
                <li>✓ Analytics — views, props, visitors</li>
                <li>✓ Build Journal + Collections</li>
                <li>✓ Custom garage URL + profile flair</li>
                <li>✓ Ride of the Week: 2× props weight</li>
                <li>✓ Create clubs, unlimited market listings</li>
                <li>✓ Priority Explore placement</li>
              </ul>
              {isMember ? (
                <Link href="/pricing" className="btn-neon" style={{ justifyContent: 'center', marginTop: 'auto' }}>
                  Upgrade to Premium
                </Link>
              ) : (
                <Link href="/auth/register?plan=premium" className="btn-neon" style={{ justifyContent: 'center', marginTop: 'auto' }}>
                  Start Premium
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ========== ROW + BROWSE (2-col, responsive) ========== */}
      <div className="layout-2col">
        <section className="section-block">
          <div className="section-head">
            <h2>Ride of the Week</h2>
            {isMember && <Link href="/explore?sort=propped">See Leaderboard →</Link>}
          </div>
          <div className="section-body">
            {isMember ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{
                  aspectRatio: '2 / 1',
                  background: 'repeating-linear-gradient(45deg, #dce7f2 0 10px, #c8d9e8 10px 20px)',
                  border: '1px solid #6b8ba8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#1d4d7a', fontSize: '12px', fontWeight: 800,
                  letterSpacing: '1px', textTransform: 'uppercase',
                }}>
                  your car could be here
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', flexWrap: 'wrap' }}>
                  <div>
                    <p style={{ fontWeight: 800, fontSize: '14px', color: '#0d3556' }}>The most-propped build earns the spotlight.</p>
                    <p style={{ color: '#2c3e50', fontSize: '12px', marginTop: '2px' }}>
                      Rack up props on your garage and land your ride on the homepage.
                    </p>
                  </div>
                  <Link href="/garage" className="btn-neon">Go to My Garage</Link>
                </div>
              </div>
            ) : (
              <div style={{
                padding: '24px 16px',
                textAlign: 'center',
                border: '1px dashed #6b8ba8',
                background: '#f7fbff',
              }}>
                <p style={{ fontSize: '13px', fontWeight: 800, marginBottom: '4px', color: '#0d3556' }}>Members only</p>
                <p style={{ fontSize: '12px', color: '#2c3e50', marginBottom: '14px' }}>
                  Sign in to see the community&apos;s most-propped build this week.
                </p>
                <div style={{ display: 'inline-flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <Link href="/auth/register" className="btn-neon">Join Free</Link>
                  <Link href="/auth/login" className="btn-outline">Sign In</Link>
                </div>
              </div>
            )}
          </div>
        </section>

        <aside>
          <section className="section-block">
            <div className="section-head">
              <h2>Find Your People</h2>
            </div>
            <div className="section-body" style={{ padding: '8px 0' }}>
              {BROWSE_CATEGORIES.map((cat, i) => (
                <Link
                  key={cat.slug}
                  href={`/explore?category=${cat.slug}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#0d3556',
                    borderTop: i === 0 ? 'none' : '1px solid #e4e4e4',
                  }}
                >
                  <span>
                    <strong style={{ color: '#1d4d7a' }}>{cat.label}</strong>
                    <span style={{ color: '#2c3e50', fontWeight: 400, fontSize: '11px', marginLeft: '8px' }}>{cat.desc}</span>
                  </span>
                  <span style={{ color: '#6b8ba8', fontWeight: 400 }}>›</span>
                </Link>
              ))}
            </div>
          </section>

          {!isMember && (
            <section className="section-block" style={{ marginTop: '14px' }}>
              <div className="section-head">
                <h2>Join the Community</h2>
              </div>
              <div className="section-body" style={{ fontSize: '12px', lineHeight: 1.55, color: '#2c3e50' }}>
                <p style={{ marginBottom: '10px' }}>
                  Share your ride with the world&apos;s newest car community. Free forever.
                </p>
                <Link href="/auth/register" className="btn-neon" style={{ width: '100%', justifyContent: 'center' }}>
                  Sign Up Free
                </Link>
              </div>
            </section>
          )}
        </aside>
      </div>

      {/* ========== LIVE STATS ========== */}
      <section className="section-block" style={{ marginTop: '14px' }}>
        <div className="section-head">
          <h2>The Scene by the Numbers</h2>
        </div>
        <div className="section-body">
          <LiveStats />
        </div>
      </section>

      {/* ========== FINAL CTA ========== */}
      {!isMember && (
        <section className="section-block" style={{ marginTop: '14px' }}>
          <div className="section-body" style={{ textAlign: 'center', padding: '32px 20px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px', color: '#0d3556' }}>
              Your build deserves a home.
            </h2>
            <p style={{ color: '#2c3e50', fontSize: '13px', maxWidth: '520px', margin: '0 auto 18px' }}>
              Build your garage, give and get props, and connect with enthusiasts across the country.
            </p>
            <div style={{ display: 'inline-flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <Link href="/auth/register" className="btn-neon" style={{ padding: '8px 22px', fontSize: '13px' }}>
                Create Your Free Garage
              </Link>
              <Link href="/pricing" className="btn-outline" style={{ padding: '8px 22px', fontSize: '13px' }}>
                See Plans
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
