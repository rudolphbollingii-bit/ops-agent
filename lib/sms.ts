export async function sendAlertSms(alert: { title: string; body: string; severity: string }): Promise<boolean> {
  const priority = alert.severity === 'high' ? 1 : 0
  const res = await fetch('https://api.pushover.net/1/messages.json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      token:    process.env.PUSHOVER_API_TOKEN!,
      user:     process.env.PUSHOVER_USER_KEY!,
      title:    `OPS ALERT: ${alert.title}`,
      message:  alert.body,
      priority: String(priority),
      sound:    alert.severity === 'high' ? 'siren' : 'pushover',
    }),
  })
  const data = await res.json()
  return data.status === 1
}

export async function sendTestSms(): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch('https://api.pushover.net/1/messages.json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      token:   process.env.PUSHOVER_API_TOKEN!,
      user:    process.env.PUSHOVER_USER_KEY!,
      title:   'Ops Agent',
      message: 'Push notifications are working. High priority alerts will appear here.',
    }),
  })
  const data = await res.json()
  return { ok: data.status === 1, error: data.errors?.[0] }
}

export async function sendSms(message: string): Promise<{ ok: boolean; error?: string }> {
  return sendTestSms()
}
