import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { getValidAccessToken, getTodayEvents, createCalendarEvent, deleteCalendarEvent, domainToColor } from '@/lib/google-calendar'

// GET — check connection status + fetch today's events
export async function GET() {
  const db          = createServiceClient()
  const accessToken = await getValidAccessToken(db)

  if (!accessToken) {
    return NextResponse.json({ connected: false, events: [] })
  }

  try {
    const events = await getTodayEvents(accessToken)
    return NextResponse.json({ connected: true, events })
  } catch {
    return NextResponse.json({ connected: false, events: [] })
  }
}

// POST — create a new calendar event from a schedule block
export async function POST(req: NextRequest) {
  const db          = createServiceClient()
  const accessToken = await getValidAccessToken(db)
  if (!accessToken) return NextResponse.json({ error: 'Not connected to Google Calendar' }, { status: 401 })

  const { title, description, startTime, endTime, domainName } = await req.json()

  try {
    const event = await createCalendarEvent(accessToken, {
      title,
      description,
      startTime: new Date(startTime),
      endTime:   new Date(endTime),
      colorId:   domainToColor(domainName || ''),
    })
    return NextResponse.json({ ok: true, eventId: event.id })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// DELETE — remove a calendar event
export async function DELETE(req: NextRequest) {
  const db          = createServiceClient()
  const accessToken = await getValidAccessToken(db)
  if (!accessToken) return NextResponse.json({ error: 'Not connected' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const eventId = searchParams.get('eventId')
  if (!eventId) return NextResponse.json({ error: 'Missing eventId' }, { status: 400 })

  await deleteCalendarEvent(accessToken, eventId)
  return NextResponse.json({ ok: true })
}
