// ─────────────────────────────────────────────────────────────────────────────
// Twilio SMS Alerts
// Sign up free at twilio.com — trial gives ~$15 credit (hundreds of texts)
// ─────────────────────────────────────────────────────────────────────────────

export interface SmsAlert {
  title:    string
  body:     string
  severity: 'high' | 'medium' | 'info'
}

// ── Send a single SMS ─────────────────────────────────────────────────────────
export async function sendSms(message: string): Promise<{ ok: boolean; error?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken  = process.env.TWILIO_AUTH_TOKEN
  const fromPhone  = process.env.TWILIO_PHONE_FROM
  const toPhone    = process.env.TWILIO_PHONE_TO

  if (!accountSid || !authToken || !fromPhone || !toPhone) {
    return { ok: false, error: 'Twilio not configured' }
  }

  try {
    const url  = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64')

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ From: fromPhone, To: toPhone, Body: message }),
    })

    const data = await res.json()
    if (data.error_code) {
      return { ok: false, error: data.message }
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: String(err) }
  }
}

// ── Format and send an alert SMS ─────────────────────────────────────────────
export async function sendAlertSms(alert: SmsAlert): Promise<boolean> {
  const emoji = alert.severity === 'high' ? '🔴' : alert.severity === 'medium' ? '🟡' : 'ℹ️'
  const message = `${emoji} OPS ALERT: ${alert.title}\n\n${alert.body}\n\nOpen your ops app to act.`
  const result = await sendSms(message)
  if (!result.ok) console.error('SMS failed:', result.error)
  return result.ok
}

// ── Send a test SMS to confirm setup works ────────────────────────────────────
export async function sendTestSms(): Promise<{ ok: boolean; error?: string }> {
  return sendSms('✅ Ops Agent SMS is working. You\'ll get texts here for high-priority alerts.')
}
