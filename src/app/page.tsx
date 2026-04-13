import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  return (
    <>
      {/* ===== HERO ===== */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-surface to-background" />
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full bg-purple/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-neon/8 blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-20">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 max-w-2xl">
              <div className="inline-block mb-6 px-4 py-2 rounded-full border border-purple/30 bg-purple/5">
                <span className="text-xs font-semibold uppercase tracking-[3px] text-purple-light">
                  The car community, reimagined
                </span>
              </div>

              <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-6">
                Your Ride Is Your
                <br />
                <span className="text-purple-light text-glow-purple">Identity.</span>
              </h1>

              <p className="text-lg md:text-xl text-muted-light max-w-xl mb-10 leading-relaxed">
                Build your garage. Show off your build. Connect with enthusiasts. Discover car shows and events across the country. Welcome to <strong className="text-neon-light">The Scene</strong>.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/auth/register" className="btn-neon text-center">
                  Build Your Garage
                </Link>
                <Link href="/explore" className="btn-outline text-center">
                  Explore Builds
                </Link>
              </div>
            </div>

            {/* Logo */}
            <div className="flex-shrink-0 relative">
              <div className="absolute inset-0 bg-purple/20 blur-[60px] rounded-full" />
              <Image
                src="/images/logo.png"
                alt="The Scene"
                width={360}
                height={360}
                className="relative z-10 drop-shadow-2xl"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold uppercase tracking-[3px] text-neon-light">How It Works</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-3 text-foreground">
              More Than a Profile. <span className="text-purple-light">It&apos;s a Garage.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass p-8 card-hover">
              <div className="w-12 h-12 rounded-lg bg-purple/20 flex items-center justify-center mb-5">
                <span className="text-2xl">🏠</span>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-3">Build Your Garage</h3>
              <p className="text-muted-light text-sm leading-relaxed">
                Your car gets its own dedicated page with specs, mods, photos, build status, and a guestbook. Just like the original CarDomain -- but better.
              </p>
            </div>

            <div className="glass p-8 card-hover">
              <div className="w-12 h-12 rounded-lg bg-neon/20 flex items-center justify-center mb-5">
                <span className="text-2xl">🤙</span>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-3">Give &amp; Get Props</h3>
              <p className="text-muted-light text-sm leading-relaxed">
                Show love for builds you respect. Props, guestbook entries, fire reactions, and trophy badges. The more props, the higher you climb on the leaderboard.
              </p>
            </div>

            <div className="glass p-8 card-hover">
              <div className="w-12 h-12 rounded-lg bg-purple/20 flex items-center justify-center mb-5">
                <span className="text-2xl">📍</span>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-3">Discover &amp; Connect</h3>
              <p className="text-muted-light text-sm leading-relaxed">
                Find car shows, meets, and track days near you. Browse builds by make, model, or location. Check in at events and share photos with the community.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PLATFORM FEATURES ===== */}
      <section className="py-24 border-y border-border">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold uppercase tracking-[3px] text-purple-light">The Platform</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-3 text-foreground">
              Everything Your Build <span className="text-neon-light">Deserves</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass p-6 flex items-start gap-4 card-hover">
              <div className="w-10 h-10 rounded-lg bg-neon/15 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-lg">🔧</span>
              </div>
              <div>
                <h3 className="font-bold text-foreground mb-1">Structured Mod Lists</h3>
                <p className="text-sm text-muted-light leading-relaxed">Every mod categorized: engine, exhaust, suspension, wheels, exterior, interior, tuning. Browse other builds by specific parts -- &quot;Show me everyone running Pedders coilovers.&quot;</p>
              </div>
            </div>

            <div className="glass p-6 flex items-start gap-4 card-hover">
              <div className="w-10 h-10 rounded-lg bg-purple/15 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-lg">📖</span>
              </div>
              <div>
                <h3 className="font-bold text-foreground mb-1">Guestbook</h3>
                <p className="text-sm text-muted-light leading-relaxed">Every garage page has a guestbook where visitors leave messages. Built-in profanity and spam filter keeps it clean and car-focused.</p>
              </div>
            </div>

            <div className="glass p-6 flex items-start gap-4 card-hover">
              <div className="w-10 h-10 rounded-lg bg-neon/15 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-lg">🏆</span>
              </div>
              <div>
                <h3 className="font-bold text-foreground mb-1">Ride of the Week</h3>
                <p className="text-sm text-muted-light leading-relaxed">The most-propped builds get featured on the homepage. Community-driven voting puts the best builds in the spotlight.</p>
              </div>
            </div>

            <div className="glass p-6 flex items-start gap-4 card-hover">
              <div className="w-10 h-10 rounded-lg bg-purple/15 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-lg">🌎</span>
              </div>
              <div>
                <h3 className="font-bold text-foreground mb-1">Regional Discovery</h3>
                <p className="text-sm text-muted-light leading-relaxed">Find builds near you. &quot;Cars near Dallas, TX&quot; or &quot;Corvettes in Pennsylvania.&quot; Location-based browsing makes local connections easy.</p>
              </div>
            </div>

            <div className="glass p-6 flex items-start gap-4 card-hover">
              <div className="w-10 h-10 rounded-lg bg-neon/15 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-lg">📸</span>
              </div>
              <div>
                <h3 className="font-bold text-foreground mb-1">Event Check-In &amp; Photos</h3>
                <p className="text-sm text-muted-light leading-relaxed">At a car show? Check in to tag your car as attending. After the event, photos get tagged to both the event and the cars. Relive it with the community.</p>
              </div>
            </div>

            <div className="glass p-6 flex items-start gap-4 card-hover">
              <div className="w-10 h-10 rounded-lg bg-purple/15 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-lg">🔍</span>
              </div>
              <div>
                <h3 className="font-bold text-foreground mb-1">Similar Builds</h3>
                <p className="text-sm text-muted-light leading-relaxed">Every garage page shows other builds of the same make and model. Discover how others have built the same platform -- and get inspired.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== RIDE OF THE WEEK ===== */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold uppercase tracking-[3px] text-neon-light">Featured</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-3 text-foreground">
              Ride of the <span className="text-neon-light text-glow-neon">Week</span>
            </h2>
            <p className="text-muted-light mt-3 max-w-lg mx-auto">The most-propped build this week earns the spotlight. Vote with props to put your favorite on the homepage.</p>
          </div>

          <div className="max-w-4xl mx-auto glass overflow-hidden glow-purple">
            <div className="h-80 bg-gradient-to-br from-surface-light to-surface flex items-center justify-center relative">
              <div className="text-center">
                <span className="text-6xl mb-4 block">🏆</span>
                <p className="text-muted-light">Featured rides will appear here once the community starts voting.</p>
              </div>
              <div className="absolute top-4 right-4 flex items-center gap-2 bg-background/80 border border-neon/30 rounded-full px-4 py-2">
                <span className="text-neon-light text-sm font-bold">🤙 Vote with Props</span>
              </div>
            </div>
            <div className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-foreground">Your car could be here.</h3>
                <p className="text-sm text-muted-light mt-1">Build your garage. Get props. Earn the spotlight.</p>
              </div>
              <Link href="/auth/register" className="btn-primary text-xs flex-shrink-0">
                Join The Scene
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== BROWSE BY CATEGORY ===== */}
      <section className="py-24 border-y border-border">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold uppercase tracking-[3px] text-purple-light">Discover</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-3 text-foreground">
              Find Your <span className="text-purple-light">People</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Muscle Cars', emoji: '💪', desc: 'American V8 power' },
              { label: 'JDM', emoji: '🇯🇵', desc: 'Japanese performance' },
              { label: 'Euro', emoji: '🇩🇪', desc: 'German engineering' },
              { label: 'Trucks', emoji: '🛻', desc: 'Built to work & play' },
              { label: 'Exotic', emoji: '🏎️', desc: 'Supercars & hypercars' },
              { label: 'Classic', emoji: '🏁', desc: 'Timeless machines' },
              { label: 'Off-Road', emoji: '⛰️', desc: 'Trail-ready rigs' },
              { label: 'Stance', emoji: '📐', desc: 'Low & wide' },
            ].map((cat) => (
              <Link
                key={cat.label}
                href={`/explore?category=${cat.label.toLowerCase().replace(' ', '-')}`}
                className="glass p-6 text-center card-hover group"
              >
                <span className="text-3xl block mb-3">{cat.emoji}</span>
                <span className="text-sm font-semibold uppercase tracking-wider text-foreground group-hover:text-purple-light transition-colors block">
                  {cat.label}
                </span>
                <span className="text-xs text-muted mt-1 block">{cat.desc}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== GARAGE STATS ===== */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold uppercase tracking-[3px] text-neon-light">The Numbers</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-3 text-foreground">
              Growing Every <span className="text-neon-light">Day</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: '0', label: 'Garages Built', icon: '🏠', note: 'Be the first!' },
              { value: '0', label: 'Props Given', icon: '🤙' },
              { value: '0', label: 'Events Listed', icon: '📅' },
              { value: '0', label: 'Guestbook Signs', icon: '📖' },
            ].map((stat) => (
              <div key={stat.label} className="glass p-6 text-center card-hover">
                <span className="text-2xl block mb-2">{stat.icon}</span>
                <div className="text-3xl md:text-4xl font-bold text-purple-light">{stat.value}</div>
                <div className="text-xs text-muted-light mt-1 uppercase tracking-wider">{stat.label}</div>
                {stat.note && <div className="text-xs text-neon-light mt-2 font-semibold">{stat.note}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== REACTIONS ===== */}
      <section className="py-16 border-y border-border">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-10">
            <span className="text-xs font-semibold uppercase tracking-[3px] text-purple-light">React</span>
            <h2 className="text-3xl font-bold mt-3 text-foreground">
              Show Love, <span className="text-neon-light">Car Culture Style</span>
            </h2>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            {[
              { emoji: '🤙', label: 'Props', desc: 'Respect the build' },
              { emoji: '🔥', label: 'Fire', desc: 'That thing is hot' },
              { emoji: '🔧', label: 'Wrench', desc: 'Built right' },
              { emoji: '🏆', label: 'Trophy', desc: 'Show winner' },
              { emoji: '🏁', label: 'Checkered', desc: 'Track proven' },
            ].map((r) => (
              <div key={r.label} className="glass px-6 py-5 text-center card-hover w-36">
                <span className="text-4xl block mb-2">{r.emoji}</span>
                <span className="text-sm font-bold text-foreground block">{r.label}</span>
                <span className="text-xs text-muted block mt-1">{r.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-purple/8 blur-[150px]" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
          <Image src="/images/logo.png" alt="The Scene" width={120} height={120} className="mx-auto mb-8 drop-shadow-2xl" />
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-foreground">
            Ready to Join <span className="text-neon-light text-glow-neon">The Scene</span>?
          </h2>
          <p className="text-lg text-muted-light mb-10 max-w-xl mx-auto">
            Your build deserves more than a classified ad. Give it a home. Build your garage, share your story, and connect with the community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register" className="btn-neon text-base px-10 py-4">
              Create Your Free Garage
            </Link>
            <Link href="/explore" className="btn-outline text-base px-10 py-4">
              Browse Builds
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
