import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForTokens } from '@/lib/google-calendar'
import { createServiceClient } from '@/lib/supabase'

// Google redirects back here after the user approves access.
// We swap the temporary code for real tokens and save them.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code  = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(new URL('/dashboard?gcal=error', req.url))
  }

  try {
    const tokens = await exchangeCodeForTokens(code)
    const db     = createServiceClient()

    // Save tokens to Supabase so all API routes can use them
    await db.from('app_settings').upsert({
      key:   'gcal_tokens',
      value: JSON.stringify({
        access_token:  tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry:        Date.now() + (tokens.expires_in * 1000),
      }),
    })

    return NextResponse.redirect(new URL('/dashboard?gcal=connected', req.url))
  } catch (err) {
    console.error('Google OAuth error:', err)
    return NextResponse.redirect(new URL('/dashboard?gcal=error', req.url))
  }
}
