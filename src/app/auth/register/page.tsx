'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import GoogleButton from '@/components/GoogleButton'

const PERKS = [
  'Free. There’s no paid tier — every member gets every feature.',
  'Unlimited cars and photos in your garage.',
  'Build journal, analytics, collections, marketplace, events, clubs.',
]

export default function RegisterPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) window.location.href = '/feed'
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const handle = username.trim().toLowerCase()
    if (handle.length < 3) { setError('Username must be at least 3 characters'); return }
    if (!/^[a-z0-9_]+$/.test(handle)) { setError('Username can only contain letters, numbers, and underscores'); return }

    setLoading(true)
    const site = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username: handle, first_name: firstName.trim(), last_name: lastName.trim(), full_name: `${firstName} ${lastName}`.trim() },
        emailRedirectTo: `${site}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div style={{ minHeight: 'calc(100vh - 58px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div className="panel panel-accent" style={{ padding: '32px 28px', maxWidth: '440px', width: '100%' }}>
          <p className="eyebrow" style={{ marginBottom: '10px' }}>One more step</p>
          <h1 style={{ fontSize: '2.2rem' }}>Check your email</h1>
          <p className="text-muted-light" style={{ marginTop: '10px', fontSize: '14px', lineHeight: 1.55 }}>
            We sent a confirmation link to <span style={{ color: 'var(--color-foreground)', fontWeight: 600 }}>{email}</span>. Tap it and you&apos;ll land straight in your garage.
          </p>
          <p className="spec" style={{ marginTop: '18px', fontSize: '12px' }}>Nothing there? Check spam, or <Link href="/auth/login">sign in</Link> once you&apos;ve confirmed.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: 'clamp(32px, 6vw, 72px) 20px 48px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '36px', alignItems: 'start' }}>
        {/* Pitch */}
        <div>
          <p className="eyebrow" style={{ marginBottom: '14px' }}>Membership · Free</p>
          <h1 style={{ fontSize: 'clamp(2.6rem, 7vw, 4.4rem)', lineHeight: 0.92, fontStyle: 'italic', fontWeight: 800 }}>
            Get your car<br />its own <span style={{ color: 'var(--color-accent)' }}>page.</span>
          </h1>
          <ul style={{ listStyle: 'none', marginTop: '26px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {PERKS.map(p => (
              <li key={p} style={{ display: 'grid', gridTemplateColumns: '18px 1fr', gap: '10px', fontSize: '15px', color: 'var(--color-foreground-soft)' }}>
                <span className="spec" style={{ color: 'var(--color-accent)' }}>✓</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
          <p className="spec" style={{ marginTop: '26px', fontSize: '12px', maxWidth: '44ch' }}>
            Takes about a minute. Sign up with Google and we&apos;ll pull your name and photo; you pick your handle next.
          </p>
        </div>

        {/* Form */}
        <div className="panel panel-accent" style={{ padding: '28px 26px' }}>
          <GoogleButton label="Sign up with Google" onError={setError} />

          <div className="auth-divider"><span>or with email</span></div>

          <form onSubmit={handleRegister}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label htmlFor="first" className="eyebrow" style={{ display: 'block', marginBottom: '6px' }}>First name</label>
                <input id="first" type="text" autoComplete="given-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="input" placeholder="Jeff" required />
              </div>
              <div>
                <label htmlFor="last" className="eyebrow" style={{ display: 'block', marginBottom: '6px' }}>Last name</label>
                <input id="last" type="text" autoComplete="family-name" value={lastName} onChange={(e) => setLastName(e.target.value)} className="input" placeholder="Optional" />
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label htmlFor="username" className="eyebrow" style={{ display: 'block', marginBottom: '6px' }}>Username</label>
              <input id="username" type="text" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} className="input" placeholder="ex: chevyguy95" required minLength={3} />
              <p className="spec" style={{ fontSize: '11px', marginTop: '5px' }}>thescene.fyi/user/<span style={{ color: 'var(--color-foreground)' }}>{username.trim().toLowerCase() || 'yourname'}</span></p>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label htmlFor="email" className="eyebrow" style={{ display: 'block', marginBottom: '6px' }}>Email</label>
              <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="you@example.com" required />
            </div>
            <div style={{ marginBottom: '18px' }}>
              <label htmlFor="password" className="eyebrow" style={{ display: 'block', marginBottom: '6px' }}>Password</label>
              <input id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" placeholder="At least 8 characters" required minLength={8} />
            </div>

            {error && <div className="form-error" role="alert">{error}</div>}

            <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', padding: '14px 20px' }}>
              {loading ? 'Creating your garage…' : 'Create account'}
            </button>

            <p className="spec" style={{ fontSize: '11px', marginTop: '14px', textAlign: 'center' }}>
              By joining you agree to the <Link href="/terms">terms</Link> and <Link href="/privacy">privacy policy</Link>.
            </p>
          </form>

          <p className="text-muted-light" style={{ textAlign: 'center', marginTop: '18px', fontSize: '14px', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
            Already a member? <Link href="/auth/login" style={{ fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
