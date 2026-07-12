// ─────────────────────────────────────────────────────────────────────────────
// Google Calendar Integration
// ─────────────────────────────────────────────────────────────────────────────

const GCAL_BASE = 'https://www.googleapis.com/calendar/v3'

// ── Build the Google OAuth login URL ─────────────────────────────────────────
export function getGoogleAuthUrl(): string {
  const params = new URLSearchParams({
    client_id:     process.env.GOOGLE_CLIENT_ID!,
    redirect_uri:  process.env.GOOGLE_REDIRECT_URI!,
    response_type: 'code',
    scope:         'https://www.googleapis.com/auth/calendar',
    access_type: 'offline',
    prompt:        'consent',
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

// ── Exchange the one-time code for real tokens ────────────────────────────────
export async function exchangeCodeForTokens(code: string) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id:     process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri:  process.env.GOOGLE_REDIRECT_URI!,
      grant_type:    'authorization_code',
    }),
  })
  return res.json()
}

// ── Use refresh token to get a new access token ───────────────────────────────
export async function refreshAccessToken(refreshToken: string): Promise<string> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id:     process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type:    'refresh_token',
    }),
  })
  const data = await res.json()
  return data.access_token
}

// ── Get stored tokens from Supabase ──────────────────────────────────────────
export async function getStoredTokens(db: ReturnType<typeof import('./supabase').createServiceClient>) {
  const { data } = await db
    .from('app_settings')
    .select('value')
    .eq('key', 'gcal_tokens')
    .single()

  if (!data) return null
  return JSON.parse(data.value) as {
    access_token: string
    refresh_token: string
    expiry: number
  }
}

// ── Get a valid access token (auto-refreshes if expired) ─────────────────────
export async function getValidAccessToken(db: ReturnType<typeof import('./supabase').createServiceClient>): Promise<string | null> {
  const tokens = await getStoredTokens(db)
  if (!tokens) return null

  // If token expires in less than 5 minutes, refresh it
  const needsRefresh = tokens.expiry < Date.now() + 5 * 60 * 1000
  if (needsRefresh) {
    const newToken = await refreshAccessToken(tokens.refresh_token)
    // Update stored access token
    await db.from('app_settings').upsert({
      key: 'gcal_tokens',
      value: JSON.stringify({ ...tokens, access_token: newToken, expiry: Date.now() + 3600 * 1000 }),
    })
    return newToken
  }

  return tokens.access_token
}

// ── Fetch today's Google Calendar events ─────────────────────────────────────
export async function getTodayEvents(accessToken: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const params = new URLSearchParams({
    timeMin:      today.toISOString(),
    timeMax:      tomorrow.toISOString(),
    singleEvents: 'true',
    orderBy:      'startTime',
  })

  const res = await fetch(`${GCAL_BASE}/calendars/primary/events?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const data = await res.json()
  return (data.items || []) as GCalEvent[]
}

// ── Create a calendar event ───────────────────────────────────────────────────
export async function createCalendarEvent(
  accessToken: string,
  { title, description, startTime, endTime, colorId }:
  { title: string; description?: string; startTime: Date; endTime: Date; colorId?: string }
) {
  const res = await fetch(`${GCAL_BASE}/calendars/primary/events`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      summary:     title,
      description,
      colorId,
      start: { dateTime: startTime.toISOString(), timeZone: 'America/New_York' },
      end:   { dateTime: endTime.toISOString(),   timeZone: 'America/New_York' },
    }),
  })
  return res.json()
}

// ── Delete a calendar event ───────────────────────────────────────────────────
export async function deleteCalendarEvent(accessToken: string, eventId: string) {
  await fetch(`${GCAL_BASE}/calendars/primary/events/${eventId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

// ── Domain → calendar color ───────────────────────────────────────────────────
// Google Calendar color IDs: 1=lavender 2=sage 3=grape 4=flamingo
// 5=banana 6=tangerine 7=peacock 8=graphite 9=blueberry 10=basil 11=tomato
export function domainToColor(domainName: string): string {
  const map: Record<string, string> = {
    'Real Estate':      '9',  // blueberry
    'Fleet / Vehicles': '10', // basil (green)
    'Investing':        '5',  // banana (yellow)
    'Home Improvement': '3',  // grape (purple)
    'Family':           '4',  // flamingo (pink)
    'CVS / Day Job':    '8',  // graphite
  }
  return map[domainName] || '7' // peacock (teal) as default
}

export interface GCalEvent {
  id: string
  summary: string
  start: { dateTime?: string; date?: string }
  end:   { dateTime?: string; date?: string }
  colorId?: string
}
