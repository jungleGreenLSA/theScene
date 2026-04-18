import Link from 'next/link'
import Image from 'next/image'
import MemberHeatmap from '@/components/MemberHeatmap'
import LiveStats from '@/components/LiveStats'
import { createClient } from '@/lib/supabase/server'

const BROWSE_CATEGORIES = [
  { slug: 'domestic', label: 'Domestic' },
  { slug: 'import', label: 'Import' },
  { slug: 'euro-power', label: 'Euro Power' },
  { slug: 'trucks', label: 'Trucks' },
  { slug: 'classic', label: 'Classic' },
  { slug: 'off-road', label: 'Off-Road' },
  { slug: 'stance', label: 'Stance' },
  { slug: 'race', label: 'Race' },
]

// Sample activity lines — shown when the real feed is empty or while
// the user isn't logged in. Format mirrors what activity_feed renders.
const SAMPLE_NEW_RIDES = [
  { user: 'jeff_a1b2', car: '2010 Chevy SS', action: 'added a new ride to their garage', when: '2h ago' },
  { user: 'marcus_c3d4', car: '1994 Mazda RX-7', action: 'joined The Scene and built a garage', when: '3h ago' },
  { user: 'sarah_e5f6', car: '2022 Subaru WRX', action: 'added a new ride', when: '5h ago' },
  { user: 'devon_g7h8', car: '2008 Honda Civic Si', action: 'added a new ride to their garage', when: '9h ago' },
  { user: 'tay_i9j0', car: '2016 Ford Mustang GT', action: 'added a new ride', when: '14h ago' },
]

const SAMPLE_UPDATED_RIDES = [
  { user: 'jeff_a1b2', car: 'SS', action: 'added a cold air intake', when: '20m ago' },
  { user: 'marcus_c3d4', car: 'RX-7', action: 'uploaded 4 new photos', when: '45m ago' },
  { user: 'devon_g7h8', car: 'Civic Si', action: 'posted a build update in the guestbook', when: '1h ago' },
  { user: 'sarah_e5f6', car: 'WRX', action: 'tagged their ride at a local meet', when: '3h ago' },
  { user: 'tay_i9j0', car: 'Mustang GT', action: 'added new suspension components', when: '6h ago' },
]

function FeedLine({
  user,
  car,
  action,
  when,
}: {
  user: string
  car: string
  action: string
  when: string
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 4px',
        borderBottom: '1px solid #eee',
        fontSize: '13px',
      }}
    >
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '2px',
          background: '#ddd',
          border: '1px solid #bbb',
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: '#222', lineHeight: 1.5 }}>
          <Link href={`/user/${user}`} style={{ fontWeight: 700, color: '#222' }}>
            {user}
          </Link>
          {' '}
          <span style={{ color: '#555' }}>({car})</span>
          {' — '}
          <span>{action}</span>
        </p>
        <p style={{ fontSize: '11px', color: '#888', marginTop: '1px' }}>{when}</p>
      </div>
    </div>
  )
}

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isMember = !!user

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '14px 12px 40px' }}>
      {/* ========== WELCOME BLOCK ========== */}
      <section className="section-block" style={{ marginBottom: '14px' }}>
        <div style={{
          display: 'flex', gap: '18px', alignItems: 'center',
          padding: '16px 18px', flexWrap: 'wrap',
        }}>
          <div style={{ flexShrink: 0 }}>
            <Image
              src="/images/logo.png"
              alt="The Scene"
              width={88}
              height={88}
              priority
            />
          </div>
          <div className="page-welcome" style={{ flex: '1 1 340px' }}>
            <h1>Welcome to The Scene</h1>
            <p>
              Browse custom builds, find car shows and meets near you, and connect with
              enthusiasts at the world&apos;s newest home for car culture.
            </p>
          </div>
          {!isMember && (
            <div style={{
              display: 'flex', gap: '6px', alignItems: 'center',
              marginLeft: 'auto', flexShrink: 0,
            }}>
              <Link href="/auth/register" className="btn-neon">Join Free</Link>
              <Link href="/auth/login" className="btn-outline">Sign In</Link>
            </div>
          )}
        </div>

        {/* Browse community bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '8px 14px',
          background: '#f5f5f5',
          borderTop: '1px solid var(--color-border)',
          flexWrap: 'wrap',
          fontSize: '12px',
        }}>
          <span style={{ fontWeight: 700, color: '#333' }}>Browse Community:</span>
          <select className="input" style={{ width: 'auto', padding: '4px 8px', fontSize: '12px' }}>
            <option>All Makes</option>
            <option>Honda</option>
            <option>Toyota</option>
            <option>Chevrolet</option>
            <option>Ford</option>
            <option>Nissan</option>
            <option>Subaru</option>
            <option>BMW</option>
            <option>Mazda</option>
          </select>
          <select className="input" style={{ width: 'auto', padding: '4px 8px', fontSize: '12px' }}>
            <option>All Models</option>
          </select>
          <Link href="/explore" className="btn-neon" style={{ padding: '4px 14px', fontSize: '12px' }}>
            Go
          </Link>
        </div>
      </section>

      {/* ========== NEW RIDES (feed format) ========== */}
      <section className="section-block">
        <div className="section-head">
          <h2>
            New Rides on The Scene
            <span className="section-head-meta">the newest garages</span>
          </h2>
          <Link href="/explore?sort=newest">View All →</Link>
        </div>
        <div className="section-body" style={{ padding: '4px 14px' }}>
          {SAMPLE_NEW_RIDES.map((row, i) => (
            <FeedLine key={i} {...row} />
          ))}
        </div>
      </section>

      {/* ========== UPDATED RIDES (feed format) ========== */}
      <section className="section-block">
        <div className="section-head">
          <h2>
            Updated Rides
            <span className="section-head-meta">fresh posts from the community</span>
          </h2>
          <Link href="/feed">View Feed →</Link>
        </div>
        <div className="section-body" style={{ padding: '4px 14px' }}>
          {SAMPLE_UPDATED_RIDES.map((row, i) => (
            <FeedLine key={i} {...row} />
          ))}
        </div>
      </section>

      {/* ========== ROW + BROWSE (2-col) ========== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
        gap: '14px',
      }}>
        {/* Ride of the Week — members only */}
        <section className="section-block" style={{ gridColumn: '1 / 2' }}>
          <div className="section-head">
            <h2>Ride of the Week</h2>
            {isMember && <Link href="/explore?sort=propped">See Leaderboard →</Link>}
          </div>
          <div className="section-body">
            {isMember ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                <div style={{
                  aspectRatio: '2 / 1',
                  background: 'repeating-linear-gradient(45deg, #e8e8e8 0 10px, #dddddd 10px 20px)',
                  border: '1px solid var(--color-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#888', fontSize: '12px', fontWeight: 600,
                  letterSpacing: '1px', textTransform: 'uppercase',
                }}>
                  your car could be here
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', flexWrap: 'wrap' }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '14px' }}>The most-propped build earns the spotlight.</p>
                    <p style={{ color: 'var(--color-muted)', fontSize: '12px', marginTop: '2px' }}>
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
                border: '1px dashed var(--color-border-hover)',
                background: '#fafafa',
              }}>
                <p style={{ fontSize: '13px', fontWeight: 700, marginBottom: '4px' }}>
                  Members only
                </p>
                <p style={{ fontSize: '12px', color: 'var(--color-muted)', marginBottom: '14px' }}>
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

        {/* Sidebar — Browse by Style + Join CTA */}
        <aside style={{ gridColumn: '2 / 3' }}>
          <section className="section-block">
            <div className="section-head">
              <h2>Browse by Style</h2>
            </div>
            <div className="section-body" style={{ padding: '8px 0' }}>
              {BROWSE_CATEGORIES.map((cat, i) => (
                <Link
                  key={cat.slug}
                  href={`/explore?category=${cat.slug}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 14px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#222',
                    borderTop: i === 0 ? 'none' : '1px solid #eee',
                  }}
                >
                  <span>{cat.label}</span>
                  <span style={{ color: '#999', fontWeight: 400 }}>›</span>
                </Link>
              ))}
            </div>
          </section>

          {!isMember && (
            <section className="section-block" style={{ marginTop: '14px' }}>
              <div className="section-head">
                <h2>Join the Community</h2>
              </div>
              <div className="section-body" style={{ fontSize: '12px', lineHeight: 1.55 }}>
                <p style={{ marginBottom: '10px' }}>
                  Share your ride with the world&apos;s largest car community. Free forever.
                </p>
                <Link href="/auth/register" className="btn-neon" style={{ width: '100%', justifyContent: 'center' }}>
                  Sign Up Free
                </Link>
              </div>
            </section>
          )}
        </aside>
      </div>

      {/* ========== HEATMAP ========== */}
      <section className="section-block" style={{ marginTop: '14px' }}>
        <div className="section-head">
          <h2>Where The Action Is</h2>
          <Link href="/explore">Explore Near You →</Link>
        </div>
        <div className="section-body">
          <MemberHeatmap />
        </div>
      </section>

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
            <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px', color: 'var(--color-subhead)' }}>
              Your build deserves a home.
            </h2>
            <p style={{ color: 'var(--color-muted)', fontSize: '13px', maxWidth: '520px', margin: '0 auto 18px' }}>
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
