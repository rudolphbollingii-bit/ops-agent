const GCAL_BASE = 'https://www.googleapis.com/calendar/v3'

// ── Build Google OAuth URL ────────────────────────────────────────────────────
export function getGoogleAuthUrl(): string {
  const params = new URLSearchParams({
    client_id:     process.env.GOOGLE_CLIENT_ID!,
    redirect_uri:  process.env.GOOGLE_REDIRECT_URI!,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',
    access_type:   'offline',   // FIXED: was access_token_type before
    prompt:        'consent',
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

// ── Exchange code for tokens ──────────────────────────────────────────────────
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

// ── Refresh access token ──────────────────────────────────────────────────────
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
export async function getStoredTokens(db: any) {
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

// ── Get valid access token (auto-refreshes if expired) ───────────────────────
export async function getValidAccessToken(db: any): Promise<string | null> {
  const tokens = await getStoredTokens(db)
  if (!tokens) return null

  const needsRefresh = tokens.expiry < Date.now() + 5 * 60 * 1000
  if (needsRefresh && tokens.refresh_token) {
    try {
      const newToken = await refreshAccessToken(tokens.refresh_token)
      await db.from('app_settings').upsert({
        key:   'gcal_tokens',
        value: JSON.stringify({
          ...tokens,
          access_token: newToken,
          expiry: Date.now() + 3600 * 1000,
        }),
      })
      return newToken
    } catch (err) {
      console.error('Token refresh failed:', err)
      return null
    }
  }

  return tokens.access_token
}

// ── Fetch events for a specific date ─────────────────────────────────────────
export async function getTodayEvents(accessToken: string, startDate?: string, endDate?: string) {
const start = startDate ? new Date(startDate) : new Date()
start.setHours(0, 0, 0, 0)
const end = endDate ? new Date(endDate) : new Date(start)
end.setHours(23, 59, 59, 999)
  const params = new URLSearchParams({
    timeMin:      start.toISOString(),
    timeMax:      end.toISOString(),
    singleEvents: 'true',
    orderBy:      'startTime',
  })

  const res = await fetch(`${GCAL_BASE}/calendars/primary/events?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok) {
    console.error('GCal events fetch failed:', res.status)
    return []
  }

  const data = await res.json()
  return data.items || []
}

// ── Create a Google Calendar event ───────────────────────────────────────────
export async function createCalendarEvent(
  accessToken: string,
  { title, description, startTime, endTime, colorId }: {
    title: string
    description?: string
    startTime: Date
    endTime: Date
    colorId?: string
  }
) {
  const res = await fetch(`${GCAL_BASE}/calendars/primary/events`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
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

// ── Delete a Google Calendar event ───────────────────────────────────────────
export async function deleteCalendarEvent(accessToken: string, eventId: string) {
  await fetch(`${GCAL_BASE}/calendars/primary/events/${eventId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

// ── Domain name → Google Calendar color ID ───────────────────────────────────
export function domainToColor(domainName: string): string {
  const map: Record<string, string> = {
    'Real Estate':      '9',   // blueberry
    'Fleet / Vehicles': '10',  // basil
    'Investing':        '5',   // banana
    'Home Improvement': '3',   // grape
    'Family':           '4',   // flamingo
    'CVS / Day Job':    '8',   // graphite
  }
  return map[domainName] || '7'
}

export interface GCalEvent {
  id: string
  summary: string
  description?: string
  start: { dateTime?: string; date?: string }
  end:   { dateTime?: string; date?: string }
  colorId?: string
}
