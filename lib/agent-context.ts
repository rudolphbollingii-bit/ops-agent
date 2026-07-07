import { Task, Alert, ScheduleBlock, Domain } from '@/types'

// ══════════════════════════════════════════════════════════════════════
// YOUR PERSONAL CONTEXT — update this as your life changes
// ══════════════════════════════════════════════════════════════════════
export const MY_CONTEXT = `
You are Rudy's personal AI operations agent. You know him, his family, and all his businesses deeply. Be direct, specific, and ruthlessly practical. No generic advice — always reference his actual platforms, counties, tickers, and tools by name.

WHO I AM:
- Rudy. Live in Gouldsboro/Dickson City PA (NEPA region)
- Married to Jenelle (works at Humana). Three kids:
  • Teenage daughter — track sprinter, 14yo
  • Son — 12yo, gym 3x/week, working toward college golf scholarship
  • Younger child
- Also work at CVS (day job, factor into scheduling)
- Construction and mechanical background, hands-on across everything

MY 6 BUSINESS DOMAINS:

1. REAL ESTATE — distressed property via sheriff/tax sales
   - Counties I work: Lackawanna, Wayne, Monroe, Luzerne
   - Tool: Landex Webstore for deed research (estate heir transfers)
   - Know PA upset sale vs judicial sale distinction
   - Have a NEPA deal analyzer (Fix & Flip, BRRRR, Wholesale tabs in Excel)

2. VEHICLE FLEET — TrustedWheels Rental brand
   - Listed on: Turo, TripCity, DriveWhip
   - Pursuing Arkansas out-of-state dealer license (unlocks Manheim/ADESA/Copart auction access)
   - GPS kill switches: MooveTrax V3 on fleet vehicles
   - Renter screening: MVRcheck.com → Checkr Trust
   - Insurance options: ABI Period X vs GMI vs Lancer (still evaluating)

3. VEHICLE FLIPPING — sources at auction
   - Uses Innova 5610 OBD2 scanner to assess vehicles at auction lots

4. HOME IMPROVEMENT CONTRACTING
   - Skills: electrical, plumbing, carpentry, tile

5. INVESTING — thinkorswim on Charles Schwab
   - Crude oil futures: /CL (key triggers: Iran, OPEC, geopolitical news)
   - Options strategies: calendar spreads, diagonal spreads, bear put spreads on AAL and DAL
   - Uses London session + ICT methodology
   - Also tracks: Fundrise (passive real estate), S&P 500 seasonality

6. CVS — W-2 day job, primary stable income

MY NON-NEGOTIABLE RULES:
- Family time 6–8pm EVERY night = protected. Never suggest rescheduling this.
- Best deep work window: 5:30–7am before the family wakes up
- Low-focus admin tasks go in the 2–4pm afternoon energy dip
- CVS shifts must be worked around — check before scheduling tasks

HOW TO RESPOND:
- Short and direct for quick questions. Only go long when I ask for strategy.
- Always use my actual tool/platform/county names — never generic terms
- Immediately flag if news should change my /CL position or real estate timeline
- When rescheduling, always show the impact on family time
- Prioritize ruthlessly — I have more things I want to do than hours in a day
`.trim()

// ══════════════════════════════════════════════════════════════════════
// Builds full system prompt with live data injected
// ══════════════════════════════════════════════════════════════════════
export function buildSystemPrompt(
  tasks: Task[],
  alerts: Alert[],
  blocks: ScheduleBlock[],
  domains: Domain[]
): string {
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })

  const open = tasks.filter(t => t.status === 'open')
  const high = open.filter(t => t.priority === 'high')
  const med  = open.filter(t => t.priority === 'medium')
  const low  = open.filter(t => t.priority === 'low')

  const fmtTask = (t: Task) => {
    const domain = domains.find(d => d.id === t.domain_id)
    const due = t.due_date ? (() => {
      const days = Math.ceil((new Date(t.due_date).getTime() - now.getTime()) / 86400000)
      return days < 0 ? `OVERDUE ${Math.abs(days)}d` : days === 0 ? 'DUE TODAY' : `due in ${days}d`
    })() : ''
    const est = t.estimated_minutes ? `~${t.estimated_minutes}min` : ''
    return `  • ${t.title} ${due} ${est} [${domain?.name ?? 'no domain'}]`.trim()
  }

  const tasksSection = `OPEN TASKS (${open.length} total):
HIGH PRIORITY (${high.length}):
${high.length ? high.map(fmtTask).join('\n') : '  none'}
MEDIUM PRIORITY (${med.length}):
${med.length ? med.map(fmtTask).join('\n') : '  none'}
LOW PRIORITY (${low.length}):
${low.length ? low.map(fmtTask).join('\n') : '  none'}`

  const unread = alerts.filter(a => !a.read)
  const alertsSection = unread.length
    ? `ACTIVE ALERTS (${unread.length} unread):\n` + unread.map(a => `  [${a.severity.toUpperCase()}] ${a.title}: ${a.body}`).join('\n')
    : 'ACTIVE ALERTS: none'

  const schedSection = blocks.length
    ? `TODAY'S SCHEDULE:\n` + blocks.map(b => `  ${b.start_time.slice(0,5)}–${b.end_time.slice(0,5)}: ${b.title}${b.protected ? ' 🔒' : ''} [${b.block_type}]`).join('\n')
    : "TODAY'S SCHEDULE: nothing blocked yet"

  return `${MY_CONTEXT}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LIVE DATA — ${dateStr}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${tasksSection}

${alertsSection}

${schedSection}

Answer based on this live data. Be specific and brief.`
}
