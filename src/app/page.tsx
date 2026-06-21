import Link from 'next/link'
import Image from 'next/image'
import MemberHeatmap from '@/components/MemberHeatmap'
import LiveStats from '@/components/LiveStats'

// Sample "Archive" entries — the carousel shows verified builds. On the live
// site this is populated from real garages; here it sets the editorial tone.
const ARCHIVE = [
  { ymm: '2021 Porsche 911', tag: 'Euro Power', hp: '443 HP', grad: 'linear-gradient(135deg,#1e293b,#0f766e)' },
  { ymm: '1998 Toyota Supra', tag: 'Import', hp: '700 HP', grad: 'linear-gradient(135deg,#2a1a3a,#7c3aed)' },
  { ymm: '1969 Chevy Camaro', tag: 'Classic', hp: '525 HP', grad: 'linear-gradient(135deg,#3a1f12,#f97316)' },
  { ymm: '2015 Subaru WRX STI', tag: 'Stance', hp: '380 HP', grad: 'linear-gradient(135deg,#0f2a3a,#2dd4bf)' },
  { ymm: '2020 Ford Mustang GT', tag: 'Domestic', hp: '480 HP', grad: 'linear-gradient(135deg,#1a1a2e,#6366f1)' },
]

// Digital Museum timeline — a build documented bone-stock to masterpiece.
const MUSEUM = [
  { date: '2023.04.12', title: 'Bone Stock — Day One', spec: 'OEM // 379 HP @ 6500 RPM', desc: 'Where every story begins. Factory spec, logged and archived before the first wrench turns.' },
  { date: '2023.09.30', title: 'Stage 2 Turbo Install', spec: 'GT2871R // +96 HP', desc: 'New hot side, intercooler, and a custom downpipe. Dyno-verified gains documented with sheets.' },
  { date: '2024.03.18', title: 'Coilovers & Big Brakes', spec: 'KW V3 // 6-POT FRONT', desc: 'Stance dialed in, fade eliminated. Corner balanced and aligned for the canyon and the track.' },
  { date: '2024.11.02', title: 'The Scene Verified', spec: 'STATUS // MASTERPIECE', desc: 'A complete, documented journey. Awarded the Verified badge for craftsmanship and presence.' },
]

export default function Home() {
  return (
    <>
      {/* ===== HERO — full-bleed automotive photography ===== */}
      <section className="relative overflow-hidden" style={{ minHeight: '88vh', display: 'flex', alignItems: 'flex-end' }}>
        <Image
          src="/images/hero-porsche.png"
          alt="Midnight blue sports car under neon city lights"
          fill
          priority
          sizes="100vw"
          style={{ objectFit: 'cover', objectPosition: 'center 60%' }}
        />
        {/* Dark cinematic overlay to anchor text */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(12,12,20,0.97) 0%, rgba(12,12,20,0.7) 35%, rgba(12,12,20,0.25) 70%, rgba(12,12,20,0.55) 100%)' }} />

        <div className="relative z-10 w-full" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px 64px' }}>
          <span className="eyebrow" style={{ display: 'block', marginBottom: '20px' }}>The Car Community, Reimagined</span>
          <h1 className="font-extrabold tracking-tight" style={{ fontSize: 'clamp(2.5rem, 7vw, 5rem)', lineHeight: 1.04, letterSpacing: '-0.02em', maxWidth: '14ch' }}>
            Your Ride Is Your <span className="gradient-text">Identity.</span>
          </h1>
          <p style={{ color: '#cbd2da', fontSize: 'clamp(1rem, 2vw, 1.25rem)', maxWidth: '560px', marginTop: '20px', lineHeight: 1.6 }}>
            A digital museum for your build. Document every stage from bone-stock to masterpiece, then connect with the enthusiasts who get it.
          </p>
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginTop: '32px' }}>
            <Link href="/auth/register" className="btn-primary" style={{ padding: '15px 38px', fontSize: '0.95rem' }}>
              Join The Scene
            </Link>
            <Link href="/explore" className="btn-outline" style={{ padding: '15px 38px', fontSize: '0.95rem' }}>
              Explore Garage
            </Link>
          </div>
        </div>
      </section>

      {/* ===== THE ARCHIVE — horizontal verified-build carousel ===== */}
      <section style={{ padding: '56px 0' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
          <div className="flex items-end justify-between" style={{ marginBottom: '24px', gap: '16px', flexWrap: 'wrap' }}>
            <div>
              <span className="eyebrow" style={{ display: 'block', marginBottom: '10px' }}>The Archive</span>
              <h2 className="font-bold text-foreground" style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.25rem)' }}>
                Verified Builds, <span className="text-purple-light">Curated.</span>
              </h2>
            </div>
            <Link href="/explore" className="spec" style={{ color: 'var(--color-teal)', whiteSpace: 'nowrap' }}>View all →</Link>
          </div>
        </div>

        {/* Edge-to-edge scroller with snap */}
        <div style={{ overflowX: 'auto', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch', paddingBottom: '8px' }}>
          <div style={{ display: 'flex', gap: '16px', padding: '0 24px', width: 'max-content', margin: '0 auto', maxWidth: '1280px' }}>
            {ARCHIVE.map((c) => (
              <div key={c.ymm} className="build-card card-hover" style={{ width: '280px', height: '340px', flexShrink: 0, scrollSnapAlign: 'start' }}>
                <div style={{ position: 'absolute', inset: 0, background: c.grad }} />
                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(120% 80% at 50% 0%, transparent 40%, rgba(12,12,20,0.4) 100%)' }} />
                <span className="chip" style={{ position: 'absolute', top: '14px', left: '14px' }}>✓ Verified</span>
                <div className="overlay">
                  <span className="label-mono" style={{ color: 'var(--color-purple-light)' }}>{c.tag}</span>
                  <h3 className="font-bold text-foreground" style={{ fontSize: '1.1rem', margin: '6px 0 8px' }}>{c.ymm}</h3>
                  <p className="spec" style={{ color: 'var(--color-teal-light)' }}>{c.hp}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== DIGITAL MUSEUM — vertical build timeline ===== */}
      <section className="border-y border-border" style={{ padding: '56px 0' }}>
        <div style={{ maxWidth: '780px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ marginBottom: '36px' }}>
            <span className="eyebrow" style={{ display: 'block', marginBottom: '10px' }}>The Digital Museum</span>
            <h2 className="font-bold text-foreground" style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.25rem)' }}>
              From Bone-Stock to <span className="gradient-text">Masterpiece.</span>
            </h2>
            <p className="text-muted-light" style={{ marginTop: '12px', fontSize: '0.95rem', maxWidth: '52ch' }}>
              Every car has a story. Log each milestone with photos, dyno sheets, and part numbers — a technical manual for your build.
            </p>
          </div>

          <div className="timeline">
            {MUSEUM.map((m) => (
              <div key={m.date} style={{ position: 'relative', paddingBottom: '28px' }}>
                <span className="timeline-dot" />
                <div className="glass" style={{ padding: '20px 22px' }}>
                  <div className="flex items-center justify-between" style={{ gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
                    <span className="spec" style={{ color: 'var(--color-teal)' }}>{m.date}</span>
                    <span className="label-mono" style={{ color: 'var(--color-muted)' }}>{m.spec}</span>
                  </div>
                  <h3 className="font-bold text-foreground" style={{ fontSize: '1.1rem', marginBottom: '6px' }}>{m.title}</h3>
                  <p className="text-muted-light text-sm leading-relaxed">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section style={{ padding: '56px 0' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>
          <div className="text-center" style={{ marginBottom: '32px' }}>
            <span className="eyebrow" style={{ color: 'var(--color-purple-light)' }}>How It Works</span>
            <h2 className="font-bold text-foreground" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', marginTop: '12px' }}>
              More Than a Profile. <span className="text-purple-light">It&apos;s a Garage.</span>
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '16px' }}>
            {[
              { n: '01', title: 'Build Your Garage', desc: 'Your car gets its own dedicated page with specs, mods, photos, build status, and a guestbook. The CarDomain spirit — rebuilt for today.' },
              { n: '02', title: 'Give & Get Props', desc: 'Show love for builds you respect. Props, guestbook entries, and trophy badges. The more props, the higher you climb.' },
              { n: '03', title: 'Discover & Connect', desc: 'Find car shows, meets, and track days near you. Browse builds by make, model, or location. Check in and share photos.' },
            ].map((f) => (
              <div key={f.title} className="glass card-hover" style={{ padding: '28px' }}>
                <span className="label-mono" style={{ color: 'var(--color-teal)' }}>{f.n}</span>
                <h3 className="font-bold text-foreground" style={{ fontSize: '1.05rem', margin: '12px 0' }}>{f.title}</h3>
                <p className="text-muted-light text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== COMMUNITY HEATMAP ===== */}
      <section style={{ padding: '56px 0' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <span className="eyebrow">Community Heatmap</span>
            <h2 className="font-bold text-foreground" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', marginTop: '8px' }}>
              Where The <span className="text-glow-teal" style={{ color: 'var(--color-teal)' }}>Scene</span> Is Live
            </h2>
            <p className="text-muted-light" style={{ marginTop: '8px', fontSize: '0.9rem', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>
              Pulsing markers show active meets and cruises. Click a hot spot to zoom in.
            </p>
          </div>
          <MemberHeatmap />
        </div>
      </section>

      {/* ===== PLATFORM FEATURES ===== */}
      <section className="border-y border-border" style={{ padding: '56px 0' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>
          <div className="text-center" style={{ marginBottom: '32px' }}>
            <span className="eyebrow" style={{ color: 'var(--color-purple-light)' }}>The Platform</span>
            <h2 className="font-bold text-foreground" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', marginTop: '12px' }}>
              Everything Your Build <span className="text-purple-light">Deserves</span>
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '16px' }}>
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

      {/* ===== BROWSE BY CATEGORY ===== */}
      <section style={{ padding: '56px 0' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>
          <div className="text-center" style={{ marginBottom: '28px' }}>
            <span className="eyebrow">Discover</span>
            <h2 className="font-bold text-foreground" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', marginTop: '12px' }}>
              Find Your <span className="text-glow-teal" style={{ color: 'var(--color-teal)' }}>People</span>
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
                <span className="text-xs font-semibold uppercase tracking-wider text-foreground group-hover:text-teal transition-colors block" style={{ letterSpacing: '0.1em' }}>
                  {cat.label}
                </span>
                <span className="text-muted block" style={{ fontSize: '11px', marginTop: '6px' }}>{cat.desc}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== GARAGE STATS ===== */}
      <section style={{ padding: '56px 0' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px' }}>
          <div className="text-center" style={{ marginBottom: '28px' }}>
            <span className="eyebrow" style={{ color: 'var(--color-purple-light)' }}>The Numbers</span>
            <h2 className="font-bold text-foreground" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', marginTop: '12px' }}>
              Growing Every <span className="text-purple-light">Day</span>
            </h2>
          </div>
          <LiveStats />
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="relative overflow-hidden" style={{ padding: '72px 0' }}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ width: '600px', height: '600px', background: 'rgba(45,212,191,0.08)', filter: 'blur(150px)' }} />

        <div className="relative z-10 text-center" style={{ maxWidth: '760px', margin: '0 auto', padding: '0 24px' }}>
          <h2 className="font-extrabold text-foreground" style={{ fontSize: 'clamp(1.9rem, 4vw, 3rem)', marginBottom: '20px', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            Document your journey from <span className="gradient-text">bone-stock to masterpiece.</span>
          </h2>
          <p className="text-muted-light leading-relaxed" style={{ fontSize: '1.1rem', marginBottom: '32px', maxWidth: '560px', marginLeft: 'auto', marginRight: 'auto' }}>
            Your build deserves more than a classified ad. Give it a home, archive its story, and connect with the community that gets it.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register" className="btn-primary" style={{ padding: '16px 42px', fontSize: '0.95rem' }}>
              Start Your Build Log
            </Link>
            <Link href="/pricing" className="btn-outline" style={{ padding: '16px 42px', fontSize: '0.95rem' }}>
              See Plans
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
