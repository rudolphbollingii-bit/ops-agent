import { NextResponse } from 'next/server'
import { getGoogleAuthUrl } from '@/lib/google-calendar'

// When user clicks "Connect Google Calendar", send them here first.
// This redirects them to Google's login/permission screen.
export async function GET() {
  const url = getGoogleAuthUrl()
  return NextResponse.redirect(url)
}
