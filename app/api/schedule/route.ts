import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { getValidAccessToken, getTodayEvents, createCalendarEvent, deleteCalendarEvent, domainToColor } from '@/lib/google-calendar'

// ── GET — fetch schedule blocks + Google Calendar events ──────────────────────
export async function GET(req: NextRequest) {
  const db = createServiceClient()
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
  const startRange = searchParams.get('start') || date
  const endRange = searchParams.get('end') || date
  // Fetch local blocks from Supabase
  const { data: blocks, error } = await db
    .from('schedule_blocks')
    .select('*, domain:domains(*)')
    .order('start_time')
    .gte('date', startRange)
    .lte('date', endRange)

  if (error) return NextResponse.json({ error }, { status: 500 })

  // Fetch Google Calendar events for the same date
  let gcalEvents: any[] = []
  try {
    const accessToken = await getValidAccessToken(db)
    if (accessToken) {
    const allEvents = await getTodayEvents(accessToken, startRange, endRange)
      // Filter to match the requested date
      gcalEvents = allEvents.filter((e: any) => {
        const eventDate = e.start?.dateTime
          ? e.start.dateTime.split('T')[0]
          : e.start?.date
        return eventDate === date
      })
    }
  } catch (err) {
    console.error('GCal fetch failed:', err)
    // Don't fail the whole request if GCal is down
  }

  // Convert GCal events to schedule_block shape so the UI handles them uniformly
  const gcalAsBlocks = gcalEvents
    .filter((e: any) => {
      // Skip events that are already synced from this app (avoid duplicates)
      const alreadySynced = (blocks || []).some((b: any) => b.gcal_event_id === e.id)
      return !alreadySynced
    })
    .map((e: any) => {
      const startDT = e.start?.dateTime || `${date}T00:00:00`
      const endDT   = e.end?.dateTime   || `${date}T01:00:00`
      return {
        id:         `gcal_${e.id}`,
        title:      e.summary || '(No title)',
        block_type: 'admin' as const,
        date,
        start_time: startDT.split('T')[1]?.slice(0, 5) || '00:00',
        end_time:   endDT.split('T')[1]?.slice(0, 5)   || '01:00',
        domain_id:  null,
        protected:  false,
        notes:      e.description || null,
        gcal_event_id: e.id,
        created_at: new Date().toISOString(),
        domain:     null,
        source:     'gcal', // flag so UI knows it came from Google
      }
    })

  // Merge and sort by start_time
  const merged = [...(blocks || []), ...gcalAsBlocks].sort((a, b) =>
    a.start_time.localeCompare(b.start_time)
  )

  return NextResponse.json(merged)
}

// ── POST — create block in Supabase AND Google Calendar ───────────────────────
export async function POST(req: NextRequest) {
  const db = createServiceClient()
  const body = await req.json()
  const { domain_id, ...blockData } = body

  // Save to Supabase first
  const { data: block, error } = await db
    .from('schedule_blocks')
    .insert({ ...blockData, domain_id: domain_id || null })
    .select('*, domain:domains(*)')
    .single()

  if (error) return NextResponse.json({ error }, { status: 500 })

  // Sync to Google Calendar
  try {
    const accessToken = await getValidAccessToken(db)
    if (accessToken && block) {
      const startDateTime = new Date(`${block.date}T${block.start_time}:00`)
      const endDateTime   = new Date(`${block.date}T${block.end_time}:00`)

      const colorId = block.domain ? domainToColor(block.domain.name) : '7'

      const gcalEvent = await createCalendarEvent(accessToken, {
        title:       block.title,
        description: block.notes || `Ops Agent block — ${block.block_type}`,
        startTime:   startDateTime,
        endTime:     endDateTime,
        colorId,
      })

      if (gcalEvent?.id) {
        // Save GCal event ID back to Supabase so we can delete/update it later
        await db
          .from('schedule_blocks')
          .update({ gcal_event_id: gcalEvent.id })
          .eq('id', block.id)

        block.gcal_event_id = gcalEvent.id
      }
    }
  } catch (err) {
    console.error('GCal sync failed on create:', err)
    // Block was saved locally — don't fail the request
  }

  return NextResponse.json(block, { status: 201 })
}

// ── DELETE — remove from Supabase AND Google Calendar ────────────────────────
export async function DELETE(req: NextRequest) {
  const db = createServiceClient()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  // Handle GCal-only events (id starts with gcal_)
  if (id.startsWith('gcal_')) {
    const gcalEventId = id.replace('gcal_', '')
    try {
      const accessToken = await getValidAccessToken(db)
      if (accessToken) await deleteCalendarEvent(accessToken, gcalEventId)
    } catch (err) {
      console.error('GCal delete failed:', err)
    }
    return NextResponse.json({ ok: true })
  }

  // Fetch block to check protection + get gcal_event_id
  const { data: block } = await db
    .from('schedule_blocks')
    .select('protected, gcal_event_id')
    .eq('id', id)
    .single()

  if (block?.protected) {
    return NextResponse.json({ error: 'Cannot delete a protected block' }, { status: 403 })
  }

  // Delete from Google Calendar if linked
  if (block?.gcal_event_id) {
    try {
      const accessToken = await getValidAccessToken(db)
      if (accessToken) await deleteCalendarEvent(accessToken, block.gcal_event_id)
    } catch (err) {
      console.error('GCal delete failed:', err)
    }
  }

  // Delete from Supabase
  const { error } = await db.from('schedule_blocks').delete().eq('id', id)
  if (error) return NextResponse.json({ error }, { status: 500 })

  return NextResponse.json({ ok: true })
}
