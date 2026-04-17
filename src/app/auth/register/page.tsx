'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function RegisterPage() {
  const supabaseCheck = createClient()
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

    let result
    if (authMethod === 'phone') {
      result = await supabase.auth.signInWithOtp({
        phone,
        options: { data: { username: username.toLowerCase() } },
      })
    } else {
      result = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username: username.toLowerCase(), first_name: firstName, last_name: lastName, full_name: `${firstName} ${lastName}`.trim() },
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://thescene.fyi'}/auth/callback`,
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

  const handleOAuth = async (provider: 'google' | 'facebook') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://thescene.fyi'}/auth/callback`,
        queryParams: { prompt: 'select_account' },
      },
    })
    if (error) setError(error.message)
  }

  if (success) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 64px)', padding: '80px 32px 32px' }}>
        <div className="glass text-center" style={{ padding: '48px 40px', maxWidth: '440px', width: '100%' }}>
          <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>{authMethod === 'phone' ? '📱' : '📧'}</span>
          <h2 className="text-2xl font-bold" style={{ marginBottom: '12px' }}>
            {authMethod === 'phone' ? 'Check Your Phone' : 'Check Your Email'}
          </h2>
          <p className="text-muted-light" style={{ marginBottom: '24px', fontSize: '0.9rem', lineHeight: '1.6' }}>
            {authMethod === 'phone'
              ? `We sent a verification code to ${phone}. Enter it to complete signup.`
              : `We sent a verification link to ${email}. Click the link to activate your account.`
            }
          </p>
          <Link href="/auth/login" className="btn-outline">Back to Sign In</Link>
        </div>
      </div>
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

        <div className="glass" style={{ padding: '36px 32px' }}>
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
              onClick={() => handleOAuth('facebook')}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '12px 20px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, border: 'none', cursor: 'pointer', backgroundColor: '#1877F2', color: 'white' }}
            >
              <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24" fill="white">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Sign up with Facebook
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
            <span className="text-xs text-muted uppercase tracking-wider">or</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
          </div>

          {/* Auth method toggle */}
          <div style={{ display: 'flex', marginBottom: '20px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
            <button
              type="button"
              onClick={() => setAuthMethod('email')}
              style={{ flex: 1, padding: '10px', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', border: 'none', cursor: 'pointer', background: authMethod === 'email' ? 'rgba(124,58,237,0.2)' : 'rgba(18,18,30,0.5)', color: authMethod === 'email' ? '#a78bfa' : '#6b7280' }}
            >
              Email
            </button>
            <button
              type="button"
              onClick={() => setAuthMethod('phone')}
              style={{ flex: 1, padding: '10px', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', border: 'none', cursor: 'pointer', background: authMethod === 'phone' ? 'rgba(124,58,237,0.2)' : 'rgba(18,18,30,0.5)', color: authMethod === 'phone' ? '#a78bfa' : '#6b7280' }}
            >
              Phone
            </button>
          </div>

          <form onSubmit={handleRegister}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-light" style={{ display: 'block', marginBottom: '6px' }}>First Name *</label>
                <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="input" placeholder="Jeff" required />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-light" style={{ display: 'block', marginBottom: '6px' }}>Last Name</label>
                <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className="input" placeholder="Optional" />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-light" style={{ display: 'block', marginBottom: '6px' }}>Username</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="input" placeholder="ex: chevyGuy95" required minLength={3} />
              <p className="text-muted" style={{ fontSize: '11px', marginTop: '4px' }}>This will be your profile URL</p>
            </div>

            {authMethod === 'email' ? (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-light" style={{ display: 'block', marginBottom: '6px' }}>Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="you@example.com" required />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-light" style={{ display: 'block', marginBottom: '6px' }}>Password</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" placeholder="Min 8 characters" required minLength={8} />
                </div>
              </>
            ) : (
              <div style={{ marginBottom: '20px' }}>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-light" style={{ display: 'block', marginBottom: '6px' }}>Phone Number</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="input" placeholder="+1 (555) 123-4567" required />
                <p className="text-muted" style={{ fontSize: '11px', marginTop: '4px' }}>Include country code (e.g. +1 for US)</p>
              </div>
            )}

            {error && (
              <div className="text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#ef4444' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-neon" style={{ width: '100%', justifyContent: 'center', padding: '14px 20px', opacity: loading ? 0.5 : 1 }}>
              {loading ? 'Creating account...' : 'Create My Garage'}
            </button>
          </form>

          <p className="text-center text-sm text-muted-light" style={{ marginTop: '24px' }}>
            Already have an account?{' '}
            <Link href="/auth/login" className="text-purple-light hover:text-neon-light font-medium">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
