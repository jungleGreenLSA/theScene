'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email')
  const [otpSent, setOtpSent] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/feed')
      router.refresh()
    }
  }

  const handlePhoneSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithOtp({ phone })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setOtpSent(true)
      setLoading(false)
    }
  }

  const handlePhoneVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.verifyOtp({ phone, token: otp, type: 'sms' })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/feed')
      router.refresh()
    }
  }

  const handleOAuth = async (provider: 'google' | 'facebook') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback` },
    })
    if (error) setError(error.message)
  }

  return (
    <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 64px)', padding: '80px 32px 32px' }}>
      <div style={{ maxWidth: '440px', width: '100%' }}>
        <div className="text-center" style={{ marginBottom: '32px' }}>
          <h1 className="text-3xl font-bold">
            Welcome Back to <span className="text-purple-light">The Scene</span>
          </h1>
          <p className="text-muted-light" style={{ marginTop: '8px', fontSize: '0.9rem' }}>Sign in to your garage</p>
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
              Continue with Google
            </button>
            <button
              onClick={() => handleOAuth('facebook')}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '12px 20px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, border: 'none', cursor: 'pointer', backgroundColor: '#1877F2', color: 'white' }}
            >
              <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24" fill="white">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Continue with Facebook
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
              onClick={() => { setAuthMethod('email'); setOtpSent(false); setError('') }}
              style={{ flex: 1, padding: '10px', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', border: 'none', cursor: 'pointer', background: authMethod === 'email' ? 'rgba(124,58,237,0.2)' : 'rgba(18,18,30,0.5)', color: authMethod === 'email' ? '#a78bfa' : '#6b7280' }}
            >
              Email
            </button>
            <button
              type="button"
              onClick={() => { setAuthMethod('phone'); setError('') }}
              style={{ flex: 1, padding: '10px', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', border: 'none', cursor: 'pointer', background: authMethod === 'phone' ? 'rgba(124,58,237,0.2)' : 'rgba(18,18,30,0.5)', color: authMethod === 'phone' ? '#a78bfa' : '#6b7280' }}
            >
              Phone
            </button>
          </div>

          {authMethod === 'email' ? (
            <form onSubmit={handleEmailLogin}>
              <div style={{ marginBottom: '16px' }}>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-light" style={{ display: 'block', marginBottom: '6px' }}>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="you@example.com" required />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-light" style={{ display: 'block', marginBottom: '6px' }}>Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" placeholder="Your password" required />
              </div>

              {error && (
                <div className="text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#ef4444' }}>{error}</div>
              )}

              <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px 20px', opacity: loading ? 0.5 : 1 }}>
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          ) : !otpSent ? (
            <form onSubmit={handlePhoneSendOtp}>
              <div style={{ marginBottom: '20px' }}>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-light" style={{ display: 'block', marginBottom: '6px' }}>Phone Number</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="input" placeholder="+1 (555) 123-4567" required />
                <p className="text-muted" style={{ fontSize: '11px', marginTop: '4px' }}>Include country code (e.g. +1 for US)</p>
              </div>

              {error && (
                <div className="text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#ef4444' }}>{error}</div>
              )}

              <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px 20px', opacity: loading ? 0.5 : 1 }}>
                {loading ? 'Sending code...' : 'Send Verification Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handlePhoneVerify}>
              <p className="text-muted-light" style={{ fontSize: '0.85rem', marginBottom: '16px' }}>Enter the code sent to {phone}</p>
              <div style={{ marginBottom: '20px' }}>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-light" style={{ display: 'block', marginBottom: '6px' }}>Verification Code</label>
                <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} className="input" placeholder="123456" required style={{ textAlign: 'center', fontSize: '1.2rem', letterSpacing: '8px' }} />
              </div>

              {error && (
                <div className="text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#ef4444' }}>{error}</div>
              )}

              <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px 20px', opacity: loading ? 0.5 : 1 }}>
                {loading ? 'Verifying...' : 'Verify & Sign In'}
              </button>
            </form>
          )}

          <p className="text-center text-sm text-muted-light" style={{ marginTop: '24px' }}>
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="text-purple-light hover:text-neon-light font-medium">Join The Scene</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
