'use client'

import { useState } from 'react'
import Link from 'next/link'

const FREE_FEATURES = [
  '2 vehicles in your garage',
  '5 photos per vehicle',
  'Basic specs & mod list',
  'Feed posting (1 photo per post)',
  'Guestbook & props',
  'Follow other members',
  'Browse explore, events & clubs',
  'Attend events & check in',
  'Join clubs',
]

const PREMIUM_FEATURES = [
  'Unlimited vehicles in your garage',
  'Unlimited photos per vehicle',
  'Multiple photos per post',
  'Premium badge on your profile',
  'Priority placement in Explore',
  'Custom garage URL slug',
  'Garage analytics (views, visitors, props over time)',
  'See who viewed your garage',
  'Premium props count 2x in Ride of the Week voting',
  'Create events immediately (free waits 60 days)',
  'Featured event placement',
  'Event analytics (views, RSVPs)',
  'Create car clubs (free can only join)',
  'Unlimited marketplace listings (free gets 2)',
  'Verified seller badge in marketplace',
  'Premium flair on all posts & comments',
  'Build cost tracker -- log what you spent on every mod',
  'Instagram feed embed on your garage page',
  'Sound clip uploads (exhaust clips)',
  'Garage tour creator (structured walkaround)',
]

const PREMIUM_HIGHLIGHTS = [
  { title: 'Unlimited Garage', desc: 'Add every car you own or have owned. No limits on vehicles or photos.' },
  { title: 'Garage Analytics', desc: 'See who viewed your garage, where they\'re from, and how your props trend over time.' },
  { title: 'Premium Badge', desc: 'Stand out in the community with a verified premium badge on your profile and every post.' },
  { title: '2x Voting Power', desc: 'Your props count double toward Ride of the Week. Help your favorites get featured.' },
  { title: 'Event & Club Creator', desc: 'Create events and clubs immediately. Free users wait 60 days.' },
  { title: 'Marketplace Power', desc: 'Unlimited listings, featured placement, and a verified seller badge.' },
]

export default function PricingPage() {
  const [showPremiumDetails, setShowPremiumDetails] = useState(false)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')

  const price = billingCycle === 'monthly' ? '$4.99' : '$50'
  const perMonth = billingCycle === 'yearly' ? '$4.17' : '$4.99'
  const savings = billingCycle === 'yearly' ? 'Save $10/year!' : ''

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '80px 32px 40px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '3px', color: '#5fa8dd' }}>Choose Your Plan</span>
        <h1 className="font-bold text-foreground" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', marginTop: '8px' }}>
          Join <span className="text-neon-light text-glow-neon">The Scene</span>
        </h1>
        <p className="text-muted-light" style={{ marginTop: '12px', fontSize: '1rem', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>
          Start free. Upgrade when you&apos;re ready to unlock the full experience.
        </p>
      </div>

      {/* Members-only notice */}
      <div className="glass" style={{ padding: '16px 24px', marginBottom: '32px', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto', textAlign: 'center', border: '1px solid rgba(44, 121, 196, 0.2)' }}>
        <p className="text-foreground" style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>Members-Only Community</p>
        <p className="text-muted-light" style={{ fontSize: '13px', lineHeight: 1.5 }}>
          Explore, Events, Clubs, What Would You Do, Spot a Ride, Crew Runs, Challenges, and Leaderboards are exclusively available to registered members. Create a free account to access the full Scene.
        </p>
      </div>

      {/* Billing toggle */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
        <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e4e4e4' }}>
          <button
            onClick={() => setBillingCycle('monthly')}
            style={{
              padding: '10px 24px', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer',
              background: billingCycle === 'monthly' ? 'rgba(44, 121, 196, 0.2)' : '#f0f0f0',
              color: billingCycle === 'monthly' ? '#5fa8dd' : '#555555',
            }}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            style={{
              padding: '10px 24px', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer',
              background: billingCycle === 'yearly' ? 'rgba(44, 121, 196, 0.2)' : '#f0f0f0',
              color: billingCycle === 'yearly' ? '#5fa8dd' : '#555555',
            }}
          >
            Yearly
            {billingCycle === 'yearly' && <span style={{ marginLeft: '8px', color: '#22c55e', fontSize: '11px' }}>Save 27%</span>}
          </button>
        </div>
      </div>

      {/* Plan cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))', gap: '24px', marginBottom: '40px' }}>
        {/* FREE */}
        <div className="glass" style={{ padding: '36px 32px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: '24px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px', color: '#555555' }}>Free</span>
            <div style={{ marginTop: '8px' }}>
              <span className="text-foreground font-bold" style={{ fontSize: '3rem', lineHeight: 1 }}>$0</span>
              <span className="text-muted" style={{ fontSize: '14px', marginLeft: '4px' }}>forever</span>
            </div>
            <p className="text-muted-light" style={{ fontSize: '14px', marginTop: '8px' }}>Everything you need to get started.</p>
          </div>

          <Link href="/auth/register" className="btn-outline" style={{ width: '100%', justifyContent: 'center', padding: '14px', marginBottom: '24px' }}>
            Get Started Free
          </Link>

          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
            {FREE_FEATURES.map((f) => (
              <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '14px', color: '#555555' }}>
                <span style={{ color: '#22c55e', flexShrink: 0 }}>•</span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* PREMIUM */}
        <div className="glass" style={{ padding: '36px 32px', display: 'flex', flexDirection: 'column', border: '1px solid rgba(44, 121, 196, 0.3)', position: 'relative', overflow: 'hidden' }}>
          {/* Popular badge */}
          <div style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(95, 168, 221, 0.15)', border: '1px solid rgba(95, 168, 221, 0.3)', borderRadius: '50px', padding: '4px 14px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#90caf9' }}>Best Value</span>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px', color: '#5fa8dd' }}>Premium</span>
            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span className="text-foreground font-bold" style={{ fontSize: '3rem', lineHeight: 1 }}>{price}</span>
              <span className="text-muted" style={{ fontSize: '14px' }}>/{billingCycle === 'monthly' ? 'month' : 'year'}</span>
            </div>
            {billingCycle === 'yearly' && (
              <p style={{ fontSize: '13px', color: '#22c55e', marginTop: '4px', fontWeight: 600 }}>{savings} ({perMonth}/mo)</p>
            )}
            <p className="text-muted-light" style={{ fontSize: '14px', marginTop: '8px' }}>The full Scene experience. Unlock everything.</p>
          </div>

          <Link href="/auth/register?plan=premium" className="btn-neon" style={{ width: '100%', justifyContent: 'center', padding: '14px', marginBottom: '24px' }}>
            Start Premium
          </Link>

          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
            {FREE_FEATURES.map((f) => (
              <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '14px', color: '#555555' }}>
                <span style={{ color: '#22c55e', flexShrink: 0 }}>•</span>
                {f}
              </li>
            ))}
            <li style={{ borderTop: '1px solid #e4e4e4', paddingTop: '12px', marginTop: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: '#5fa8dd' }}>Plus Premium:</span>
            </li>
            {PREMIUM_FEATURES.slice(0, 6).map((f) => (
              <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '14px', color: '#1a1a1a', fontWeight: 500 }}>
                <span style={{ color: '#5fa8dd', flexShrink: 0 }}>•</span>
                {f}
              </li>
            ))}
            {!showPremiumDetails && (
              <li>
                <button
                  onClick={() => setShowPremiumDetails(true)}
                  style={{ background: 'none', border: 'none', color: '#5fa8dd', fontSize: '13px', fontWeight: 600, cursor: 'pointer', padding: '4px 0' }}
                >
                  + {PREMIUM_FEATURES.length - 6} more features →
                </button>
              </li>
            )}
            {showPremiumDetails && PREMIUM_FEATURES.slice(6).map((f) => (
              <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '14px', color: '#1a1a1a', fontWeight: 500 }}>
                <span style={{ color: '#5fa8dd', flexShrink: 0 }}>•</span>
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Premium deep dive (expanded) */}
      {showPremiumDetails && (
        <div style={{ marginBottom: '40px' }}>
          <h2 className="font-bold text-foreground" style={{ fontSize: '1.5rem', textAlign: 'center', marginBottom: '24px' }}>
            What You Get with <span className="text-purple-light">Premium</span>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '16px' }}>
            {PREMIUM_HIGHLIGHTS.map((h) => (
              <div key={h.title} className="glass card-hover" style={{ padding: '24px' }}>
                <h3 className="font-bold text-foreground" style={{ fontSize: '0.95rem', marginBottom: '10px' }}>{h.title}</h3>
                <p className="text-muted-light text-sm leading-relaxed">{h.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FAQ */}
      <div className="glass" style={{ padding: '32px', maxWidth: '700px', margin: '0 auto' }}>
        <h3 className="font-bold text-foreground" style={{ fontSize: '1.1rem', marginBottom: '20px', textAlign: 'center' }}>Frequently Asked Questions</h3>
        {[
          { q: 'Can I cancel anytime?', a: 'Yes. Cancel your premium subscription at any time. You keep premium features until the end of your billing period.' },
          { q: 'Can I upgrade later?', a: 'Absolutely. Start free, build your garage, and upgrade whenever you\'re ready.' },
          { q: 'What payment methods do you accept?', a: 'We accept all major credit cards, debit cards, and Apple Pay / Google Pay through our secure payment provider (Stripe).' },
          { q: 'Is my payment information secure?', a: 'Yes. We never see or store your card details. All payments are processed securely by Stripe.' },
        ].map((faq) => (
          <div key={faq.q} style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #e4e4e4' }}>
            <p className="font-semibold text-foreground" style={{ fontSize: '14px', marginBottom: '6px' }}>{faq.q}</p>
            <p className="text-muted-light" style={{ fontSize: '13px', lineHeight: 1.6 }}>{faq.a}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
