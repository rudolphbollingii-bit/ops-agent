import { NextRequest, NextResponse } from 'next/server'
import { sendAlertSms, sendTestSms } from '@/lib/sms'
import { createServiceClient } from '@/lib/supabase'

// POST /api/sms
// body: { test: true }  → sends a test text to your phone
// body: { alertId: "..." } → sends that specific alert as SMS
export async function POST(req: NextRequest) {
  const body = await req.json()

  // Test mode — just confirm SMS is working
  if (body.test) {
    const result = await sendTestSms()
    return NextResponse.json(result)
  }

  // Send a specific alert as SMS
  if (body.alertId) {
    const db = createServiceClient()
    const { data: alert } = await db
      .from('alerts')
      .select('*')
      .eq('id', body.alertId)
      .single()

    if (!alert) return NextResponse.json({ error: 'Alert not found' }, { status: 404 })

    const ok = await sendAlertSms({
      title:    alert.title,
      body:     alert.body,
      severity: alert.severity,
    })

    if (ok) {
      // Mark it as SMS sent in the DB
      await db.from('alerts').update({ sms_sent: true }).eq('id', body.alertId)
    }

    return NextResponse.json({ ok })
  }

  // Send a custom message
  if (body.title && body.message) {
    const ok = await sendAlertSms({ title: body.title, body: body.message, severity: body.severity || 'medium' })
    return NextResponse.json({ ok })
  }

  return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
}
