'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  )
}

function RegisterForm() {
  const supabaseCheck = createClient()
  const searchParams = useSearchParams()
  const initialTier: 'free' | 'premium' = searchParams.get('plan') === 'premium' ? 'premium' : 'free'

  useEffect(() => {
    supabaseCheck.auth.getSession().then(({ data: { session } }) => {
      if (session) window.location.href = '/feed'
    })
  }, [])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email')
  const [tier, setTier] = useState<'free' | 'premium'>(initialTier)
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (username.length < 3) {
      setError('Username must be at least 3 characters')
      setLoading(false)
      return
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('Username can only contain letters, numbers, and underscores')
      setLoading(false)
      return
    }

    // Stash the chosen tier on the new user's metadata so the rest of
    // the app (and the pricing/checkout flow) can read it back. Free
    // users don't need a Stripe trip; premium selection redirects to
    // /pricing?signup=1 after email confirmation where Stripe takes over.
    const metadata = {
      username: username.toLowerCase(),
      first_name: firstName,
      last_name: lastName,
      full_name: `${firstName} ${lastName}`.trim(),
      intended_tier: tier,
    }
    const nextParam = tier === 'premium' ? '?next=/pricing%3Fsignup%3D1' : ''

    let result
    if (authMethod === 'phone') {
      result = await supabase.auth.signInWithOtp({
        phone,
        options: { data: metadata },
      })
    } else {
      result = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://thescene.fyi'}/auth/callback${nextParam}`,
        },
      })
    }

    if (result.error) {
      setError(result.error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  function PostSignupRedirect() {
    useEffect(() => {
      const dest = tier === 'premium'
        ? '/pricing?signup=1'
        : 'https://thescene.fyi'
      const t = setTimeout(() => { window.location.href = dest }, 2500)
      return () => clearTimeout(t)
    }, [])
    return null
  }

  const handleOAuth = async (provider: 'google' | 'discord') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://thescene.fyi'}/auth/callback`,
        queryParams: { prompt: 'select_account' },
      },
    })
    if (error) setError(error.message)
  }

  // Post-signup toast — copy adapts to the picked tier so premium
  // users know we're taking them to checkout after confirmation.
  if (success) {
    return (
      <>
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 64px)', padding: '80px 32px 32px' }}>
          <div className="section-block" style={{ padding: '20px 24px', maxWidth: '420px', width: '100%' }}>
            <p style={{ fontSize: '15px', fontWeight: 800, color: '#0d3556', marginBottom: '4px' }}>Check your email!</p>
            <p style={{ fontSize: '13px', color: '#2c3e50', lineHeight: 1.5 }}>
              Verification link sent to <strong>{email}</strong>.{' '}
              {tier === 'premium'
                ? 'Once you confirm, we\u2019ll take you to checkout for Premium ($4.99/mo).'
                : 'Redirecting you back to the homepage...'}
            </p>
          </div>
        </div>
        <PostSignupRedirect />
      </>
    )
  }

  return (
    <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 64px)', padding: '80px 32px 32px' }}>
      <div style={{ maxWidth: '440px', width: '100%' }}>
        <div className="text-center" style={{ marginBottom: '32px' }}>
          <h1 className="text-3xl font-bold">
            Join <span className="text-neon-light text-glow-neon">The Scene</span>
          </h1>
          <p className="text-muted-light" style={{ marginTop: '8px', fontSize: '0.9rem' }}>Create your garage and show off your build</p>
        </div>

        <div className="glass" style={{ padding: '28px 28px' }}>
          {/* Tier picker — visible at top so users pick Free vs Premium
              before filling the form. Defaults to ?plan= from URL. */}
          <fieldset style={{ border: 'none', padding: 0, margin: '0 0 22px' }}>
            <legend className="text-xs font-semibold uppercase tracking-wider text-muted-light" style={{ marginBottom: '8px', color: '#1d4d7a' }}>
              Pick your plan
            </legend>
            <div role="radiogroup" aria-label="Membership tier" style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px',
            }}>
              {(['free', 'premium'] as const).map(opt => {
                const active = tier === opt
                return (
                  <button
                    key={opt}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setTier(opt)}
                    style={{
                      padding: '12px 14px',
                      textAlign: 'left',
                      background: active
                        ? (opt === 'premium' ? 'linear-gradient(180deg, #eaf4fb 0%, #d7e9f5 100%)' : '#ffffff')
                        : '#fafafa',
                      border: active
                        ? (opt === 'premium' ? '2px solid #2c79c4' : '2px solid #1d4d7a')
                        : '1px solid #c4c4c4',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      minHeight: '80px',
                      display: 'flex', flexDirection: 'column', justifyContent: 'center',
                      transition: 'border-color 0.12s, transform 0.12s',
                      boxShadow: active ? '0 2px 6px rgba(44,121,196,0.2)' : 'none',
                    }}
                  >
                    <span style={{
                      fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px',
                      color: opt === 'premium' ? '#1d4d7a' : '#3a3a3a',
                    }}>
                      {opt === 'premium' ? 'Premium' : 'Free'}
                    </span>
                    <span style={{ fontSize: '18px', fontWeight: 800, color: '#0d3556', marginTop: '2px' }}>
                      {opt === 'premium' ? '$4.99' : '$0'}
                      <span style={{ fontSize: '11px', fontWeight: 500, color: '#2c3e50' }}>/mo</span>
                    </span>
                    <span style={{ fontSize: '11px', color: '#2c3e50', marginTop: '4px', lineHeight: 1.35 }}>
                      {opt === 'premium'
                        ? 'Unlimited vehicles, analytics, priority placement.'
                        : '1 vehicle, 5 photos each, full community access.'}
                    </span>
                  </button>
                )
              })}
            </div>
            {tier === 'premium' && (
              <p style={{ fontSize: '11px', color: '#2c3e50', marginTop: '8px' }}>
                After you confirm your email, we&apos;ll send you to checkout ($4.99/mo or $49.99/yr).
              </p>
            )}
          </fieldset>
          {/* OAuth Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
            <button
              onClick={() => handleOAuth('google')}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '12px 20px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, border: 'none', cursor: 'pointer', backgroundColor: 'white', color: '#333' }}
            >
              <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign up with Google
            </button>
            <button
              onClick={() => handleOAuth('discord')}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '12px 20px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, border: 'none', cursor: 'pointer', backgroundColor: '#5865F2', color: 'white' }}
            >
              <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24" fill="white">
                <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028 14.09 14.09 0 001.226-1.994.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              Sign up with Discord
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
            <span className="text-xs text-muted uppercase tracking-wider">or</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
          </div>

          {/* Auth method toggle */}
          <div style={{ display: 'flex', marginBottom: '20px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
            <button
              type="button"
              onClick={() => setAuthMethod('email')}
              style={{ flex: 1, padding: '10px', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', border: 'none', cursor: 'pointer', background: authMethod === 'email' ? 'rgba(44, 121, 196, 0.2)' : '#f0f0f0', color: authMethod === 'email' ? '#5fa8dd' : '#555555' }}
            >
              Email
            </button>
            <button
              type="button"
              onClick={() => setAuthMethod('phone')}
              style={{ flex: 1, padding: '10px', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', border: 'none', cursor: 'pointer', background: authMethod === 'phone' ? 'rgba(44, 121, 196, 0.2)' : '#f0f0f0', color: authMethod === 'phone' ? '#5fa8dd' : '#555555' }}
            >
              Phone
            </button>
          </div>

          <form onSubmit={handleRegister} noValidate aria-describedby={error ? 'reg-form-error' : undefined}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label htmlFor="reg-first" className="text-xs font-semibold uppercase tracking-wider text-muted-light" style={{ display: 'block', marginBottom: '6px' }}>
                  First Name <span aria-hidden="true">*</span> <span className="sr-only">(required)</span>
                </label>
                <input id="reg-first" type="text" autoComplete="given-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="input" placeholder="Jeff" required />
              </div>
              <div>
                <label htmlFor="reg-last" className="text-xs font-semibold uppercase tracking-wider text-muted-light" style={{ display: 'block', marginBottom: '6px' }}>
                  Last Name <span style={{ color: '#3a5876', fontWeight: 400, textTransform: 'none' }}>(optional)</span>
                </label>
                <input id="reg-last" type="text" autoComplete="family-name" value={lastName} onChange={(e) => setLastName(e.target.value)} className="input" placeholder="Optional" />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="reg-username" className="text-xs font-semibold uppercase tracking-wider text-muted-light" style={{ display: 'block', marginBottom: '6px' }}>
                Username <span aria-hidden="true">*</span> <span className="sr-only">(required)</span>
              </label>
              <input
                id="reg-username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onBlur={(e) => {
                  const v = e.target.value
                  if (v && v.length < 3) setError('Username must be at least 3 characters')
                  else if (v && !/^[a-zA-Z0-9_]+$/.test(v)) setError('Username can only contain letters, numbers, and underscores')
                  else if (error.startsWith('Username')) setError('')
                }}
                className="input"
                placeholder="ex: chevyGuy95"
                required
                minLength={3}
                aria-describedby="reg-username-help"
              />
              <p id="reg-username-help" style={{ fontSize: '11px', marginTop: '4px', color: '#3a3a3a' }}>This will be your profile URL</p>
            </div>

            {authMethod === 'email' ? (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <label htmlFor="reg-email" className="text-xs font-semibold uppercase tracking-wider text-muted-light" style={{ display: 'block', marginBottom: '6px' }}>
                    Email <span aria-hidden="true">*</span> <span className="sr-only">(required)</span>
                  </label>
                  <input id="reg-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="you@example.com" required />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label htmlFor="reg-password" className="text-xs font-semibold uppercase tracking-wider text-muted-light" style={{ display: 'block', marginBottom: '6px' }}>
                    Password <span aria-hidden="true">*</span> <span className="sr-only">(required, minimum 8 characters)</span>
                  </label>
                  <input
                    id="reg-password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input"
                    placeholder="Min 8 characters"
                    required
                    minLength={8}
                    aria-describedby="reg-password-help"
                  />
                  <p id="reg-password-help" style={{ fontSize: '11px', marginTop: '4px', color: '#3a3a3a' }}>At least 8 characters.</p>
                </div>
              </>
            ) : (
              <div style={{ marginBottom: '20px' }}>
                <label htmlFor="reg-phone" className="text-xs font-semibold uppercase tracking-wider text-muted-light" style={{ display: 'block', marginBottom: '6px' }}>
                  Phone Number <span aria-hidden="true">*</span> <span className="sr-only">(required)</span>
                </label>
                <input id="reg-phone" type="tel" autoComplete="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="input" placeholder="+1 (555) 123-4567" required aria-describedby="reg-phone-help" />
                <p id="reg-phone-help" style={{ fontSize: '11px', marginTop: '4px', color: '#3a3a3a' }}>Include country code (e.g. +1 for US)</p>
              </div>
            )}

            {error && (
              <div id="reg-form-error" role="alert" aria-live="polite" style={{ background: '#fce9e9', border: '1px solid #c02b2b', borderRadius: '3px', padding: '12px 16px', marginBottom: '16px', color: '#7a1818', fontSize: '13px' }}>
                <span aria-hidden="true" style={{ marginRight: '4px' }}>⚠</span>{error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-neon" style={{ width: '100%', justifyContent: 'center', padding: '14px 20px', opacity: loading ? 0.5 : 1 }}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center" style={{ marginTop: '24px', fontSize: '14px', color: '#2c3e50' }}>
            Already have an account?{' '}
            <Link href="/auth/login" style={{ color: '#1c58b8', fontWeight: 700 }}>Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
