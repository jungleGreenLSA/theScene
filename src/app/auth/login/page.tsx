'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import GoogleButton from '@/components/GoogleButton'

// Where to send the member after sign-in. Honors ?redirect=/some/path from
// the auth guard, but only same-origin paths.
function safeRedirect(): string {
  if (typeof window === 'undefined') return '/feed'
  const r = new URLSearchParams(window.location.search).get('redirect')
  return r && r.startsWith('/') && !r.startsWith('//') ? r : '/feed'
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) window.location.href = safeRedirect()
    })
    if (new URLSearchParams(window.location.search).get('error') === 'auth_failed') {
      setError('That sign-in link didn’t work. Try again.')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setNotice('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      window.location.href = safeRedirect()
    }
  }

  const handleForgot = async () => {
    if (!email) { setError('Enter your email first, then tap “Forgot password”.'); return }
    setError('')
    const site = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${site}/auth/callback?next=/settings` })
    if (error) setError(error.message)
    else setNotice(`Reset link sent to ${email}.`)
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 58px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ marginBottom: '22px' }}>
          <p className="eyebrow" style={{ marginBottom: '10px' }}>Welcome back</p>
          <h1 style={{ fontSize: 'clamp(2.2rem, 6vw, 3rem)' }}>Sign in</h1>
          <p className="text-muted-light" style={{ marginTop: '8px', fontSize: '14px' }}>Your garage, your feed, your people — right where you left them.</p>
        </div>

        <div className="panel panel-accent" style={{ padding: '28px 26px' }}>
          <GoogleButton label="Continue with Google" next={safeRedirect()} onError={setError} />

          <div className="auth-divider"><span>or with email</span></div>

          <form onSubmit={handleEmailLogin}>
            <div style={{ marginBottom: '14px' }}>
              <label htmlFor="email" className="eyebrow" style={{ display: 'block', marginBottom: '6px' }}>Email</label>
              <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="you@example.com" required />
            </div>
            <div style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                <label htmlFor="password" className="eyebrow">Password</label>
                <button type="button" onClick={handleForgot} style={{ background: 'none', border: 'none', color: 'var(--color-accent)', fontSize: '12px', cursor: 'pointer', padding: 0 }}>
                  Forgot password?
                </button>
              </div>
              <input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" placeholder="Your password" required />
            </div>

            {error && <div className="form-error" role="alert">{error}</div>}
            {notice && <div className="form-error" role="status" style={{ background: 'rgba(86,194,113,0.08)', borderColor: 'rgba(86,194,113,0.35)', color: 'var(--color-success)' }}>{notice}</div>}

            <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', padding: '14px 20px' }}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-muted-light" style={{ textAlign: 'center', marginTop: '18px', fontSize: '14px' }}>
          New here? <Link href="/auth/register" style={{ fontWeight: 600 }}>Join free</Link>
        </p>
      </div>
    </div>
  )
}
