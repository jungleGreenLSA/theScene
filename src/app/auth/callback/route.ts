import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/feed'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thescene.fyi'

  try {
    if (code) {
      const supabase = await createClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (!error) {
        return NextResponse.redirect(`${siteUrl}${next}`)
      }
      console.error('Auth callback error:', error.message)
    }
  } catch (err) {
    console.error('Auth callback exception:', err)
  }

  return NextResponse.redirect(`${siteUrl}/auth/login?error=auth_failed`)
}
