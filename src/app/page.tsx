import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  return (
    <>
      {/* ===== HERO ===== */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-surface to-background" />
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full bg-purple/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-neon/8 blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-20">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 max-w-2xl text-center lg:text-left">
              <div className="inline-block mb-5 px-4 py-2 rounded-full border border-purple/30 bg-purple/5">
                <span className="text-xs font-semibold uppercase tracking-[3px] text-purple-light">
                  The car community, reimagined
                </span>
              </div>

              <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05] mb-5">
                Your Ride Is Your
                <br />
                <span className="text-purple-light text-glow-purple">Identity.</span>
              </h1>

              <p className="text-base md:text-lg text-muted-light max-w-xl mb-8 leading-relaxed mx-auto lg:mx-0">
                Build your garage. Show off your build. Connect with enthusiasts. Discover car shows and events across the country. Welcome to <strong className="text-neon-light">The Scene</strong>.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link href="/auth/register" className="btn-neon text-center">
                  Build Your Garage
                </Link>
                <Link href="/explore" className="btn-outline text-center">
                  Explore Builds
                </Link>
              </div>
            </div>

            <div className="flex-shrink-0 relative">
              <div className="absolute inset-0 bg-purple/20 blur-[60px] rounded-full" />
              <Image
                src="/images/logo.png"
                alt="The Scene"
                width={320}
                height={320}
                className="relative z-10 drop-shadow-2xl"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="py-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-8">
            <span className="text-xs font-semibold uppercase tracking-[3px] text-neon-light">How It Works</span>
            <h2 className="text-2xl md:text-3xl font-bold mt-2 text-foreground">
              More Than a Profile. <span className="text-purple-light">It&apos;s a Garage.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="glass p-6 card-hover">
              <div className="w-10 h-10 rounded-lg bg-purple/20 flex items-center justify-center mb-4">
                <span className="text-xl">🏠</span>
              </div>
              <h3 className="text-base font-bold text-foreground mb-2">Build Your Garage</h3>
              <p className="text-muted-light text-sm leading-relaxed">
                Your car gets its own dedicated page with specs, mods, photos, build status, and a guestbook. Just like the original CarDomain -- but better.
              </p>
            </div>

            <div className="glass p-6 card-hover">
              <div className="w-10 h-10 rounded-lg bg-neon/20 flex items-center justify-center mb-4">
                <span className="text-xl">🤙</span>
              </div>
              <h3 className="text-base font-bold text-foreground mb-2">Give &amp; Get Props</h3>
              <p className="text-muted-light text-sm leading-relaxed">
                Show love for builds you respect. Props, guestbook entries, and trophy badges. The more props, the higher you climb.
              </p>
            </div>

            <div className="glass p-6 card-hover">
              <div className="w-10 h-10 rounded-lg bg-purple/20 flex items-center justify-center mb-4">
                <span className="text-xl">📍</span>
              </div>
              <h3 className="text-base font-bold text-foreground mb-2">Discover &amp; Connect</h3>
              <p className="text-muted-light text-sm leading-relaxed">
                Find car shows, meets, and track days near you. Browse builds by make, model, or location. Check in at events and share photos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PLATFORM FEATURES ===== */}
      <section className="py-10 border-y border-border">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-8">
            <span className="text-xs font-semibold uppercase tracking-[3px] text-purple-light">The Platform</span>
            <h2 className="text-2xl md:text-3xl font-bold mt-2 text-foreground">
              Everything Your Build <span className="text-neon-light">Deserves</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { icon: '🔧', title: 'Structured Mod Lists', desc: 'Every mod categorized: engine, exhaust, suspension, wheels, exterior, interior, tuning. Browse other builds by specific parts.', color: 'neon' },
              { icon: '📖', title: 'Guestbook', desc: 'Every garage page has a guestbook where visitors leave messages. Built-in profanity and spam filter keeps it clean.', color: 'purple' },
              { icon: '🏆', title: 'Ride of the Week', desc: 'The most-propped builds get featured on the homepage. Community-driven voting puts the best builds in the spotlight.', color: 'neon' },
              { icon: '🌎', title: 'Regional Discovery', desc: 'Find builds near you. Search by city, state, or zip code. Location-based browsing makes local connections easy.', color: 'purple' },
              { icon: '📸', title: 'Event Check-In & Photos', desc: 'At a car show? Check in to tag your car. After the event, photos get tagged to both the event and the cars.', color: 'neon' },
              { icon: '🔍', title: 'Similar Builds', desc: 'Every garage page shows other builds of the same make and model. See how others built the same platform.', color: 'purple' },
            ].map((f) => (
              <div key={f.title} className="glass p-5 flex items-start gap-4 card-hover">
                <div className={`w-9 h-9 rounded-lg bg-${f.color}/15 flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <span className="text-base">{f.icon}</span>
                </div>
                <div>
                  <h3 className="font-bold text-foreground mb-1 text-sm">{f.title}</h3>
                  <p className="text-xs text-muted-light leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== RIDE OF THE WEEK ===== */}
      <section className="py-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-8">
            <span className="text-xs font-semibold uppercase tracking-[3px] text-neon-light">Featured</span>
            <h2 className="text-2xl md:text-3xl font-bold mt-2 text-foreground">
              Ride of the <span className="text-neon-light text-glow-neon">Week</span>
            </h2>
            <p className="text-muted-light mt-2 text-sm max-w-lg mx-auto">The most-propped build this week earns the spotlight. Vote with props to put your favorite on the homepage.</p>
          </div>

          <div className="max-w-3xl mx-auto glass overflow-hidden glow-purple">
            <div className="h-56 bg-gradient-to-br from-surface-light to-surface flex items-center justify-center relative">
              <div className="text-center">
                <span className="text-5xl mb-3 block">🏆</span>
                <p className="text-muted-light text-sm">Featured rides will appear here once the community starts voting.</p>
              </div>
              <div className="absolute top-3 right-3 flex items-center gap-2 bg-background/80 border border-neon/30 rounded-full px-3 py-1.5">
                <span className="text-neon-light text-xs font-bold">🤙 Vote with Props</span>
              </div>
            </div>
            <div className="p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-foreground">Your car could be here.</h3>
                <p className="text-xs text-muted-light mt-1">Build your garage. Get props. Earn the spotlight.</p>
              </div>
              <Link href="/auth/register" className="btn-primary text-xs flex-shrink-0">
                Join The Scene
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== BROWSE BY CATEGORY ===== */}
      <section className="py-10 border-y border-border">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-8">
            <span className="text-xs font-semibold uppercase tracking-[3px] text-purple-light">Discover</span>
            <h2 className="text-2xl md:text-3xl font-bold mt-2 text-foreground">
              Find Your <span className="text-purple-light">People</span>
            </h2>
            <p className="text-muted-light mt-2 text-sm max-w-md mx-auto">Pick up to two tags when you sign up. Find your community.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
                className="glass p-5 text-center card-hover group"
              >
                <span className="text-2xl block mb-2">{cat.emoji}</span>
                <span className="text-xs font-semibold uppercase tracking-wider text-foreground group-hover:text-purple-light transition-colors block">
                  {cat.label}
                </span>
                <span className="text-[11px] text-muted mt-1 block">{cat.desc}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== GARAGE STATS ===== */}
      <section className="py-10">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-8">
            <span className="text-xs font-semibold uppercase tracking-[3px] text-neon-light">The Numbers</span>
            <h2 className="text-2xl md:text-3xl font-bold mt-2 text-foreground">
              Growing Every <span className="text-neon-light">Day</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: '0', label: 'Garages Built', icon: '🏠', note: 'Be the first!' },
              { value: '0', label: 'Props Given', icon: '🤙' },
              { value: '0', label: 'Events Listed', icon: '📅' },
              { value: '0', label: 'Guestbook Signs', icon: '📖' },
            ].map((stat) => (
              <div key={stat.label} className="glass p-5 text-center card-hover">
                <span className="text-xl block mb-2">{stat.icon}</span>
                <div className="text-2xl md:text-3xl font-bold text-purple-light">{stat.value}</div>
                <div className="text-[11px] text-muted-light mt-1 uppercase tracking-wider">{stat.label}</div>
                {stat.note && <div className="text-[11px] text-neon-light mt-1 font-semibold">{stat.note}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="py-14 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-purple/8 blur-[150px]" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <Image src="/images/logo.png" alt="The Scene" width={100} height={100} className="mx-auto mb-6 drop-shadow-2xl" />
          <h2 className="text-2xl md:text-4xl font-bold mb-4 text-foreground">
            Ready to Join <span className="text-neon-light text-glow-neon">The Scene</span>?
          </h2>
          <p className="text-base text-muted-light mb-8 max-w-xl mx-auto">
            Your build deserves more than a classified ad. Give it a home. Build your garage, share your story, and connect with the community.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth/register" className="btn-neon text-sm px-8 py-3">
              Create Your Free Garage
            </Link>
            <Link href="/explore" className="btn-outline text-sm px-8 py-3">
              Browse Builds
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
