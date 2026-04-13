import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  return (
    <>
      {/* ===== HERO ===== */}
      <section className="relative flex items-center justify-center overflow-hidden" style={{ minHeight: '92vh' }}>
        <div className="absolute inset-0 bg-gradient-to-br from-background via-surface to-background" />
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full bg-purple/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-neon/8 blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />

        {/* Watermark logo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ opacity: 0.08 }}>
          <Image src="/images/logo.png" alt="" width={700} height={700} aria-hidden="true" />
        </div>

        <div className="relative z-10 w-full text-center" style={{ maxWidth: '900px', margin: '0 auto', padding: '100px 32px' }}>
          <div className="inline-block mb-8 px-5 py-2.5 rounded-full border border-purple/30 bg-purple/5">
            <span className="text-xs font-semibold uppercase tracking-[3px] text-purple-light">
              The car community, reimagined
            </span>
          </div>

          <h1 className="font-bold tracking-tight leading-[1.08] mb-8" style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)' }}>
            Your Ride Is Your
            <br />
            <span className="text-purple-light text-glow-purple">Identity.</span>
          </h1>

          <p className="text-muted-light leading-relaxed mb-12" style={{ fontSize: 'clamp(1rem, 2vw, 1.25rem)', maxWidth: '640px', margin: '0 auto 48px' }}>
            Build your garage. Show off your build. Connect with enthusiasts. Discover car shows and events across the country. Welcome to <strong className="text-neon-light">The Scene</strong>.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register" className="btn-neon text-center" style={{ padding: '16px 40px', fontSize: '0.95rem' }}>
              Build Your Garage
            </Link>
            <Link href="/explore" className="btn-outline text-center" style={{ padding: '16px 40px', fontSize: '0.95rem' }}>
              Explore Builds
            </Link>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section style={{ padding: '80px 0' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 32px' }}>
          <div className="text-center" style={{ marginBottom: '56px' }}>
            <span className="text-xs font-semibold uppercase tracking-[3px] text-neon-light">How It Works</span>
            <h2 className="font-bold text-foreground" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', marginTop: '12px' }}>
              More Than a Profile. <span className="text-purple-light">It&apos;s a Garage.</span>
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {[
              { icon: '🏠', title: 'Build Your Garage', desc: 'Your car gets its own dedicated page with specs, mods, photos, build status, and a guestbook. Just like the original CarDomain -- but better.' },
              { icon: '🤙', title: 'Give & Get Props', desc: 'Show love for builds you respect. Props, guestbook entries, and trophy badges. The more props, the higher you climb.' },
              { icon: '📍', title: 'Discover & Connect', desc: 'Find car shows, meets, and track days near you. Browse builds by make, model, or location. Check in at events and share photos.' },
            ].map((f) => (
              <div key={f.title} className="glass card-hover text-center" style={{ padding: '40px 32px' }}>
                <div className="bg-purple/20 flex items-center justify-center mx-auto" style={{ width: '56px', height: '56px', borderRadius: '16px', marginBottom: '24px' }}>
                  <span style={{ fontSize: '28px' }}>{f.icon}</span>
                </div>
                <h3 className="font-bold text-foreground" style={{ fontSize: '1.15rem', marginBottom: '12px' }}>{f.title}</h3>
                <p className="text-muted-light text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PLATFORM FEATURES ===== */}
      <section className="border-y border-border" style={{ padding: '80px 0' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 32px' }}>
          <div className="text-center" style={{ marginBottom: '56px' }}>
            <span className="text-xs font-semibold uppercase tracking-[3px] text-purple-light">The Platform</span>
            <h2 className="font-bold text-foreground" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', marginTop: '12px' }}>
              Everything Your Build <span className="text-neon-light">Deserves</span>
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
            {[
              { icon: '🔧', title: 'Structured Mod Lists', desc: 'Every mod categorized: engine, exhaust, suspension, wheels, exterior, interior, tuning. Browse other builds by specific parts.' },
              { icon: '📖', title: 'Guestbook', desc: 'Every garage page has a guestbook where visitors leave messages. Built-in profanity and spam filter keeps it clean.' },
              { icon: '🏆', title: 'Ride of the Week', desc: 'The most-propped builds get featured on the homepage. Community-driven voting puts the best builds in the spotlight.' },
              { icon: '🌎', title: 'Regional Discovery', desc: 'Find builds near you. Search by city, state, or zip code. Location-based browsing makes local connections easy.' },
              { icon: '📸', title: 'Event Check-In & Photos', desc: 'At a car show? Check in to tag your car. After the event, photos get tagged to both the event and the cars.' },
              { icon: '🔍', title: 'Similar Builds', desc: 'Every garage page shows other builds of the same make and model. See how others built the same platform.' },
            ].map((f) => (
              <div key={f.title} className="glass card-hover" style={{ padding: '28px', display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
                <div className="bg-purple/15 flex items-center justify-center flex-shrink-0" style={{ width: '48px', height: '48px', borderRadius: '12px' }}>
                  <span style={{ fontSize: '22px' }}>{f.icon}</span>
                </div>
                <div>
                  <h3 className="font-bold text-foreground" style={{ marginBottom: '8px' }}>{f.title}</h3>
                  <p className="text-sm text-muted-light leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== RIDE OF THE WEEK ===== */}
      <section style={{ padding: '80px 0' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 32px' }}>
          <div className="text-center" style={{ marginBottom: '48px' }}>
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
                <span className="block" style={{ fontSize: '64px', marginBottom: '16px' }}>🏆</span>
                <p className="text-muted-light text-sm">Featured rides will appear here once the community starts voting.</p>
              </div>
              <div className="absolute top-4 right-4 flex items-center gap-2 bg-background/80 border border-neon/30 rounded-full" style={{ padding: '8px 16px' }}>
                <span className="text-neon-light text-xs font-bold">🤙 Vote with Props</span>
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
      <section className="border-y border-border" style={{ padding: '80px 0' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 32px' }}>
          <div className="text-center" style={{ marginBottom: '48px' }}>
            <span className="text-xs font-semibold uppercase tracking-[3px] text-purple-light">Discover</span>
            <h2 className="font-bold text-foreground" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', marginTop: '12px' }}>
              Find Your <span className="text-purple-light">People</span>
            </h2>
            <p className="text-muted-light text-sm" style={{ marginTop: '16px' }}>Pick up to two tags when you sign up. Find your community.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            {[
              { label: 'Domestic', emoji: '🇺🇸', desc: 'American muscle & power' },
              { label: 'Import', emoji: '🇯🇵', desc: 'JDM performance' },
              { label: 'Euro Power', emoji: '🌍', desc: 'European & exotic' },
              { label: 'Trucks', emoji: '🛻', desc: 'Built to work & play' },
              { label: 'Classic', emoji: '🏁', desc: 'Timeless machines' },
              { label: 'Off-Road', emoji: '⛰️', desc: 'Trail-ready rigs' },
              { label: 'Stance', emoji: '📐', desc: 'Low & wide' },
              { label: 'Race', emoji: '🏎️', desc: 'Track-built weapons' },
            ].map((cat) => (
              <Link
                key={cat.label}
                href={`/explore?category=${cat.label.toLowerCase().replace(' ', '-')}`}
                className="glass card-hover group text-center"
                style={{ padding: '28px 16px' }}
              >
                <span className="block" style={{ fontSize: '28px', marginBottom: '12px' }}>{cat.emoji}</span>
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
      <section style={{ padding: '80px 0' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 32px' }}>
          <div className="text-center" style={{ marginBottom: '48px' }}>
            <span className="text-xs font-semibold uppercase tracking-[3px] text-neon-light">The Numbers</span>
            <h2 className="font-bold text-foreground" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', marginTop: '12px' }}>
              Growing Every <span className="text-neon-light">Day</span>
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
            {[
              { value: '0', label: 'Garages Built', icon: '🏠', note: 'Be the first!' },
              { value: '0', label: 'Props Given', icon: '🤙' },
              { value: '0', label: 'Events Listed', icon: '📅' },
              { value: '0', label: 'Guestbook Signs', icon: '📖' },
            ].map((stat) => (
              <div key={stat.label} className="glass card-hover text-center" style={{ padding: '28px 16px' }}>
                <span className="block" style={{ fontSize: '24px', marginBottom: '12px' }}>{stat.icon}</span>
                <div className="font-bold text-purple-light" style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)' }}>{stat.value}</div>
                <div className="text-muted-light uppercase tracking-wider" style={{ fontSize: '11px', marginTop: '8px' }}>{stat.label}</div>
                {stat.note && <div className="text-neon-light font-semibold" style={{ fontSize: '11px', marginTop: '8px' }}>{stat.note}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="relative overflow-hidden" style={{ padding: '100px 0' }}>
        {/* Watermark logo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ opacity: 0.05 }}>
          <Image src="/images/logo.png" alt="" width={500} height={500} aria-hidden="true" />
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-purple/8 blur-[150px]" />

        <div className="relative z-10 text-center" style={{ maxWidth: '700px', margin: '0 auto', padding: '0 32px' }}>
          <Image src="/images/logo.png" alt="The Scene" width={120} height={120} className="mx-auto drop-shadow-2xl" style={{ marginBottom: '40px' }} />
          <h2 className="font-bold text-foreground" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', marginBottom: '24px' }}>
            Ready to Join <span className="text-neon-light text-glow-neon">The Scene</span>?
          </h2>
          <p className="text-muted-light leading-relaxed" style={{ fontSize: '1.1rem', marginBottom: '48px', maxWidth: '560px', marginLeft: 'auto', marginRight: 'auto' }}>
            Your build deserves more than a classified ad. Give it a home. Build your garage, share your story, and connect with the community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register" className="btn-neon" style={{ padding: '16px 40px', fontSize: '0.95rem' }}>
              Create Your Free Garage
            </Link>
            <Link href="/explore" className="btn-outline" style={{ padding: '16px 40px', fontSize: '0.95rem' }}>
              Browse Builds
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
