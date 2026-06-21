import Link from 'next/link'
import Image from 'next/image'
import MemberHeatmap from '@/components/MemberHeatmap'
import LiveStats from '@/components/LiveStats'

export default function Home() {
  return (
    <>
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden" style={{ minHeight: '85vh', display: 'flex', alignItems: 'center' }}>
        <div className="absolute inset-0 bg-gradient-to-br from-background via-surface to-background" />
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full bg-purple/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-neon/8 blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />

        <div className="relative z-10 w-full" style={{ maxWidth: '1000px', margin: '0 auto', padding: '80px 32px 40px' }}>
          {/* Badge at very top */}
          <div className="text-center" style={{ marginBottom: '32px' }}>
            <span style={{ display: 'inline-block', padding: '8px 20px', borderRadius: '50px', border: '1px solid rgba(124,58,237,0.3)', background: 'rgba(124,58,237,0.05)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '3px', color: '#a78bfa' }}>
              The car community, reimagined
            </span>
          </div>

          {/* Desktop: logo left, text right. Mobile: logo above text */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '48px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {/* Logo - visible and glowing */}
            <div className="relative flex-shrink-0" style={{ order: 0 }}>
              <div className="absolute inset-0 rounded-full" style={{ background: 'rgba(124,58,237,0.25)', filter: 'blur(40px)' }} />
              <Image
                src="/images/logo.png"
                alt="The Scene"
                width={280}
                height={280}
                className="relative z-10"
                style={{ filter: 'drop-shadow(0 0 30px rgba(124,58,237,0.4))' }}
                priority
              />
            </div>

            {/* Text content */}
            <div style={{ flex: '1 1 400px', textAlign: 'left' }}>
              <h1 className="font-bold tracking-tight leading-[1.08]" style={{ fontSize: 'clamp(2.2rem, 5vw, 4rem)', marginBottom: '20px' }}>
                Your Ride Is Your
                <br />
                <span className="text-purple-light text-glow-purple">Identity.</span>
              </h1>

              <p className="text-muted-light leading-relaxed" style={{ fontSize: 'clamp(0.95rem, 1.8vw, 1.15rem)', maxWidth: '520px', marginBottom: '32px' }}>
                Build your garage. Show off your build. Connect with enthusiasts. Discover car shows and events across the country. Welcome to <strong className="text-neon-light">The Scene</strong>.
              </p>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Link href="/auth/register" className="btn-neon text-center" style={{ padding: '14px 36px', fontSize: '0.9rem' }}>
                  Build Your Garage
                </Link>
                <Link href="/pricing" className="btn-outline text-center" style={{ padding: '14px 36px', fontSize: '0.9rem' }}>
                  See What&apos;s Inside
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile: center everything */}
        <style>{`
          @media (max-width: 768px) {
            .relative.flex-shrink-0 { order: -1 !important; }
          }
        `}</style>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section style={{ padding: '48px 0' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 32px' }}>
          <div className="text-center" style={{ marginBottom: '32px' }}>
            <span className="text-xs font-semibold uppercase tracking-[3px] text-neon-light">How It Works</span>
            <h2 className="font-bold text-foreground" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', marginTop: '12px' }}>
              More Than a Profile. <span className="text-purple-light">It&apos;s a Garage.</span>
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '16px' }}>
            {[
              { title: 'Build Your Garage', desc: 'Your car gets its own dedicated page with specs, mods, photos, build status, and a guestbook. Just like the original CarDomain -- but better.' },
              { title: 'Give & Get Props', desc: 'Show love for builds you respect. Props, guestbook entries, and trophy badges. The more props, the higher you climb.' },
              { title: 'Discover & Connect', desc: 'Find car shows, meets, and track days near you. Browse builds by make, model, or location. Check in at events and share photos.' },
            ].map((f) => (
              <div key={f.title} className="glass card-hover" style={{ padding: '28px' }}>
                <h3 className="font-bold text-foreground" style={{ fontSize: '1.05rem', marginBottom: '12px' }}>{f.title}</h3>
                <p className="text-muted-light text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== MEMBER HEATMAP ===== */}
      <section style={{ padding: '48px 0' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 32px' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '3px', color: '#fb923c' }}>Live Map</span>
            <h2 className="font-bold text-foreground" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', marginTop: '8px' }}>
              Where The <span className="text-neon-light text-glow-neon">Action</span> Is
            </h2>
            <p className="text-muted-light" style={{ marginTop: '8px', fontSize: '0.9rem', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>
              See where members are building across the country. Click a hot spot to zoom in.
            </p>
          </div>
          <MemberHeatmap />
        </div>
      </section>

      {/* ===== PLATFORM FEATURES ===== */}
      <section className="border-y border-border" style={{ padding: '48px 0' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 32px' }}>
          <div className="text-center" style={{ marginBottom: '32px' }}>
            <span className="text-xs font-semibold uppercase tracking-[3px] text-purple-light">The Platform</span>
            <h2 className="font-bold text-foreground" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', marginTop: '12px' }}>
              Everything Your Build <span className="text-neon-light">Deserves</span>
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', gap: '16px' }}>
            {[
              { title: 'Structured Mod Lists', desc: 'Every mod categorized: engine, exhaust, suspension, wheels, exterior, interior, tuning. Browse other builds by specific parts.' },
              { title: 'Guestbook', desc: 'Every garage page has a guestbook where visitors leave messages. Built-in profanity and spam filter keeps it clean.' },
              { title: 'Ride of the Week', desc: 'The most-propped builds get featured on the homepage. Community-driven voting puts the best builds in the spotlight.' },
              { title: 'Regional Discovery', desc: 'Find builds near you. Search by city, state, or zip code. Location-based browsing makes local connections easy.' },
              { title: 'Event Check-In & Photos', desc: 'At a car show? Check in to tag your car. After the event, photos get tagged to both the event and the cars.' },
              { title: 'Similar Builds', desc: 'Every garage page shows other builds of the same make and model. See how others built the same platform.' },
            ].map((f) => (
              <div key={f.title} className="glass card-hover" style={{ padding: '28px' }}>
                <h3 className="font-bold text-foreground" style={{ marginBottom: '8px' }}>{f.title}</h3>
                <p className="text-sm text-muted-light leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== RIDE OF THE WEEK ===== */}
      <section style={{ padding: '48px 0' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 32px' }}>
          <div className="text-center" style={{ marginBottom: '28px' }}>
            <span className="text-xs font-semibold uppercase tracking-[3px] text-neon-light">Featured</span>
            <h2 className="font-bold text-foreground" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', marginTop: '12px' }}>
              Ride of the <span className="text-neon-light text-glow-neon">Week</span>
            </h2>
            <p className="text-muted-light text-sm" style={{ marginTop: '16px', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>
              The most-propped build this week earns the spotlight. Vote with props to put your favorite on the homepage.
            </p>
          </div>

          <div className="glass overflow-hidden glow-purple">
            <div className="bg-gradient-to-br from-surface-light to-surface flex items-center justify-center relative" style={{ height: '300px' }}>
              <div className="text-center">
                <p className="text-muted-light text-sm">Featured rides will appear here once the community starts voting.</p>
              </div>
              <div className="absolute top-4 right-4 flex items-center gap-2 bg-background/80 border border-neon/30 rounded-full" style={{ padding: '8px 16px' }}>
                <span className="text-neon-light text-xs font-bold">Vote with Props</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4" style={{ padding: '28px 32px' }}>
              <div>
                <h3 className="text-xl font-bold text-foreground">Your car could be here.</h3>
                <p className="text-sm text-muted-light" style={{ marginTop: '8px' }}>Build your garage. Get props. Earn the spotlight.</p>
              </div>
              <Link href="/auth/register" className="btn-primary text-xs flex-shrink-0">
                Join The Scene
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== BROWSE BY CATEGORY ===== */}
      <section className="border-y border-border" style={{ padding: '48px 0' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 32px' }}>
          <div className="text-center" style={{ marginBottom: '28px' }}>
            <span className="text-xs font-semibold uppercase tracking-[3px] text-purple-light">Discover</span>
            <h2 className="font-bold text-foreground" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', marginTop: '12px' }}>
              Find Your <span className="text-purple-light">People</span>
            </h2>
            <p className="text-muted-light text-sm" style={{ marginTop: '16px' }}>Pick up to two tags when you sign up. Find your community.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '12px' }}>
            {[
              { label: 'Domestic', desc: 'American muscle & power' },
              { label: 'Import', desc: 'JDM performance' },
              { label: 'Euro Power', desc: 'European & exotic' },
              { label: 'Trucks', desc: 'Built to work & play' },
              { label: 'Classic', desc: 'Timeless machines' },
              { label: 'Off-Road', desc: 'Trail-ready rigs' },
              { label: 'Stance', desc: 'Low & wide' },
              { label: 'Race', desc: 'Track-built weapons' },
            ].map((cat) => (
              <Link
                key={cat.label}
                href={`/explore?category=${cat.label.toLowerCase().replace(' ', '-')}`}
                className="glass card-hover group text-center"
                style={{ padding: '28px 16px' }}
              >
                <span className="text-xs font-semibold uppercase tracking-wider text-foreground group-hover:text-purple-light transition-colors block">
                  {cat.label}
                </span>
                <span className="text-muted block" style={{ fontSize: '11px', marginTop: '6px' }}>{cat.desc}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== GARAGE STATS ===== */}
      <section style={{ padding: '48px 0' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 32px' }}>
          <div className="text-center" style={{ marginBottom: '28px' }}>
            <span className="text-xs font-semibold uppercase tracking-[3px] text-neon-light">The Numbers</span>
            <h2 className="font-bold text-foreground" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', marginTop: '12px' }}>
              Growing Every <span className="text-neon-light">Day</span>
            </h2>
          </div>
          <LiveStats />
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="relative overflow-hidden" style={{ padding: '56px 0' }}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-purple/8 blur-[150px]" />

        <div className="relative z-10 text-center" style={{ maxWidth: '700px', margin: '0 auto', padding: '0 32px' }}>
          <h2 className="font-bold text-foreground" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', marginBottom: '24px' }}>
            Ready to Join <span className="text-neon-light text-glow-neon">The Scene</span>?
          </h2>
          <p className="text-muted-light leading-relaxed" style={{ fontSize: '1.1rem', marginBottom: '28px', maxWidth: '560px', marginLeft: 'auto', marginRight: 'auto' }}>
            Your build deserves more than a classified ad. Give it a home. Build your garage, share your story, and connect with the community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register" className="btn-neon" style={{ padding: '16px 40px', fontSize: '0.95rem' }}>
              Create Your Free Garage
            </Link>
            <Link href="/pricing" className="btn-outline" style={{ padding: '16px 40px', fontSize: '0.95rem' }}>
              See Plans
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
