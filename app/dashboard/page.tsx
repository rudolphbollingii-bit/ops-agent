'use client'

import { useState, useEffect, useRef } from 'react'
import { Task, Alert, ScheduleBlock, Domain, ChatMessage, Priority, BlockType, AlertSeverity } from '@/types'
import CalendarPanel from '@/components/CalendarPanel'

// ── Color maps ────────────────────────────────────────────────────────────────
const DOMAIN_COLOR: Record<string, string> = {
  blue: '#2563EB', green: '#16A34A', amber: '#D97706',
  purple: '#7C3AED', pink: '#DB2777', gray: '#6B7280',
}
const PRI_BG: Record<Priority, string>   = { high: '#FEF2F2', medium: '#FFFBEB', low: '#F0FDF4' }
const PRI_TX: Record<Priority, string>   = { high: '#B91C1C', medium: '#92400E', low: '#166534' }
const BLOCK_COLOR: Record<BlockType, string> = {
  deep_work: '#2563EB', admin: '#D97706', family: '#DB2777',
  health: '#16A34A', buffer: '#D1D5DB',
}
const SEV_COLOR: Record<string, string>  = { high: '#EF4444', medium: '#F59E0B', info: '#3B82F6' }
const SEV_BG: Record<string, string>     = { high: '#FEE2E2', medium: '#FEF3C7', info: '#DBEAFE' }

// ── Shared input style ────────────────────────────────────────────────────────
const inp: React.CSSProperties = {
  width: '100%', fontSize: 13, padding: '8px 10px', border: '1px solid #E5E7EB',
  borderRadius: 8, outline: 'none', fontFamily: 'inherit', color: '#111827',
  background: '#fff', boxSizing: 'border-box',
}

type Tab = 'home' | 'tasks' | 'alerts' | 'schedule' | 'agent' | 'settings'

// ══════════════════════════════════════════════════════════════════════════════
// ROOT
// ══════════════════════════════════════════════════════════════════════════════
export default function Dashboard() {
  const [tab, setTab]       = useState<Tab>('home')
  const [tasks, setTasks]   = useState<Task[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([])
  const [domains, setDomains] = useState<Domain[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const today = new Date().toISOString().split('T')[0]
    const [t, a, b, d] = await Promise.all([
      fetch('/api/tasks').then(r => r.json()),
      fetch('/api/alerts').then(r => r.json()),
      fetch(`/api/schedule?date=${today}`).then(r => r.json()),
      fetch('/api/domains').then(r => r.json()),
    ])
    setTasks(Array.isArray(t) ? t : [])
    setAlerts(Array.isArray(a) ? a : [])
    setBlocks(Array.isArray(b) ? b : [])
    setDomains(Array.isArray(d) ? d : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const unread   = alerts.filter(a => !a.read).length
  const highOpen = tasks.filter(t => t.priority === 'high' && t.status === 'open').length

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <p style={{ color: '#9CA3AF', fontSize: 14 }}>Loading your ops center…</p>
    </div>
  )

  const NAV: { id: Tab; label: string; badge?: number }[] = [
    { id: 'home',     label: 'Overview' },
    { id: 'tasks',    label: 'Tasks',    badge: highOpen },
    { id: 'alerts',   label: 'Alerts',   badge: unread },
    { id: 'schedule', label: 'Schedule' },
    { id: 'agent',    label: 'AI Agent' },
    { id: 'settings', label: 'Settings' },
  ]

  const PANEL_LABEL: Record<Tab, string> = {
    home: 'Overview', tasks: 'Tasks', alerts: 'Alerts', schedule: 'Schedule', agent: 'AI Agent', settings: 'Settings',
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* ── Sidebar ── */}
      <aside style={{ width: 196, background: '#fff', borderRight: '1px solid #F3F4F6', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '20px 16px 14px', borderBottom: '1px solid #F3F4F6' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Ops Agent</div>
          <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>Rudy · NEPA</div>
        </div>
        <nav style={{ padding: 8, flex: 1 }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => setTab(n.id)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
              borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, marginBottom: 2,
              background: tab === n.id ? '#F3F4F6' : 'transparent',
              color: tab === n.id ? '#111827' : '#6B7280',
              fontWeight: tab === n.id ? 600 : 400,
            }}>
              <span style={{ flex: 1, textAlign: 'left' }}>{n.label}</span>
              {!!n.badge && (
                <span style={{
                  fontSize: 10, padding: '1px 6px', borderRadius: 999, fontWeight: 700,
                  background: n.id === 'alerts' ? '#FEE2E2' : '#FEF3C7',
                  color:      n.id === 'alerts' ? '#DC2626' : '#92400E',
                }}>{n.badge}</span>
              )}
            </button>
          ))}
        </nav>
        <div style={{ padding: '10px 14px', borderTop: '1px solid #F3F4F6', fontSize: 10, color: '#D1D5DB', textAlign: 'center' }}>
          TrustedWheels · NEPA RE · /CL
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <header style={{ background: '#fff', borderBottom: '1px solid #F3F4F6', padding: '13px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>{PANEL_LABEL[tab]}</div>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} · Gouldsboro / Dickson City PA
            </div>
          </div>
          {unread > 0 && (
            <button onClick={() => setTab('alerts')} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
              borderRadius: 999, border: '1px solid #FEE2E2', background: '#FEF2F2',
              color: '#DC2626', fontSize: 12, cursor: 'pointer', fontWeight: 600,
            }}>
              <span style={{ width: 6, height: 6, background: '#EF4444', borderRadius: '50%', display: 'inline-block' }} />
              {unread} alert{unread !== 1 ? 's' : ''}
            </button>
          )}
        </header>

        {/* Active panel */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {tab === 'home'     && <HomePanel     tasks={tasks} alerts={alerts} blocks={blocks} domains={domains} setTab={setTab} />}
          {tab === 'tasks'    && <TasksPanel    tasks={tasks}  domains={domains} onRefresh={load} />}
          {tab === 'alerts'   && <AlertsPanel   alerts={alerts} onRefresh={load} />}
          {tab === 'schedule' && <CalendarPanel blocks={blocks} domains={domains} onRefresh={load} />}
          {tab === 'agent'    && <AgentPanel    tasks={tasks}   alerts={alerts} />}
          {tab === 'settings' && <SettingsPanel />}
        </div>
      </main>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// HOME PANEL
// ══════════════════════════════════════════════════════════════════════════════
function HomePanel({ tasks, alerts, blocks, domains, setTab }: {
  tasks: Task[], alerts: Alert[], blocks: ScheduleBlock[], domains: Domain[], setTab: (t: Tab) => void
}) {
  const highOpen = tasks.filter(t => t.priority === 'high' && t.status === 'open')
  const unread   = alerts.filter(a => !a.read)

  return (
    <div style={{ padding: 24, maxWidth: 860, margin: '0 auto' }}>

      {/* Domain cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
        {domains.map(d => {
          const count = tasks.filter(t => t.domain_id === d.id && t.status === 'open').length
          const color = DOMAIN_COLOR[d.color] || '#6B7280'
          return (
            <div key={d.id} onClick={() => setTab('tasks')} style={{
              background: '#fff', border: '1px solid #F3F4F6', borderLeft: `4px solid ${color}`,
              borderRadius: 10, padding: '12px 14px', cursor: 'pointer',
            }}>
              <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4 }}>{d.name}</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#111827', lineHeight: 1 }}>{count}</div>
              <div style={{ fontSize: 11, color: '#D1D5DB', marginTop: 2 }}>open tasks</div>
            </div>
          )
        })}
      </div>

      {/* High priority tasks */}
      {highOpen.length > 0 && (
        <section style={{ marginBottom: 24 }}>
          <SectionLabel color="#EF4444">Needs attention now</SectionLabel>
          {highOpen.slice(0, 3).map(t => (
            <div key={t.id} style={{ background: '#fff', border: '1px solid #F3F4F6', borderRadius: 10, padding: '11px 14px', marginBottom: 6, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ width: 7, height: 7, background: '#EF4444', borderRadius: '50%', marginTop: 4, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{t.title}</div>
                {t.due_date && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>Due {new Date(t.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>}
              </div>
              {t.domain && <span style={{ fontSize: 10, background: '#F3F4F6', color: '#6B7280', padding: '2px 8px', borderRadius: 999 }}>{t.domain.name}</span>}
            </div>
          ))}
        </section>
      )}

      {/* Today's schedule */}
      <section style={{ marginBottom: 24 }}>
        <SectionLabel>Today's schedule</SectionLabel>
        {blocks.length === 0
          ? <Empty onClick={() => setTab('schedule')} label="No blocks yet — click to add" />
          : blocks.map(b => (
            <div key={b.id} style={{ background: '#fff', border: '1px solid #F3F4F6', borderLeft: `4px solid ${BLOCK_COLOR[b.block_type]}`, borderRadius: 10, padding: '10px 14px', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 11, color: '#9CA3AF', width: 88, flexShrink: 0 }}>{b.start_time.slice(0,5)}–{b.end_time.slice(0,5)}</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#111827', flex: 1 }}>{b.title}</span>
              {b.protected && <span style={{ fontSize: 11, color: '#9CA3AF' }}>🔒</span>}
            </div>
          ))
        }
      </section>

      {/* Alerts preview */}
      {unread.length > 0 && (
        <section>
          <SectionLabel color="#F59E0B">Active alerts</SectionLabel>
          {unread.slice(0, 2).map(a => (
            <div key={a.id} onClick={() => setTab('alerts')} style={{
              background: '#fff', border: '1px solid #F3F4F6', borderLeft: `4px solid ${SEV_COLOR[a.severity]}`,
              borderRadius: 10, padding: '11px 14px', marginBottom: 6, cursor: 'pointer',
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{a.title}</div>
              <div style={{ fontSize: 12, color: '#6B7280', marginTop: 3 }}>{a.body.slice(0, 120)}{a.body.length > 120 ? '…' : ''}</div>
            </div>
          ))}
          {unread.length > 2 && (
            <button onClick={() => setTab('alerts')} style={{ background: 'none', border: 'none', fontSize: 12, color: '#2563EB', cursor: 'pointer', padding: 0 }}>
              +{unread.length - 2} more alerts →
            </button>
          )}
        </section>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// TASKS PANEL
// ══════════════════════════════════════════════════════════════════════════════
function TasksPanel({ tasks, domains, onRefresh }: { tasks: Task[], domains: Domain[], onRefresh: () => void }) {
  const [filter, setFilter]   = useState<'all' | Priority>('all')
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [form, setForm]       = useState({ title: '', description: '', domain_id: '', priority: 'medium' as Priority, due_date: '', estimated_minutes: '' })

  const open     = tasks.filter(t => t.status === 'open')
  const filtered = filter === 'all' ? open : open.filter(t => t.priority === filter)

  const complete = async (id: string) => {
    await fetch('/api/tasks', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: 'done' }) })
    onRefresh()
  }

  const add = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    await fetch('/api/tasks', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, domain_id: form.domain_id || null, due_date: form.due_date || null, estimated_minutes: form.estimated_minutes ? +form.estimated_minutes : null }),
    })
    setSaving(false)
    setShowAdd(false)
    setForm({ title: '', description: '', domain_id: '', priority: 'medium', due_date: '', estimated_minutes: '' })
    onRefresh()
  }

  return (
    <div style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
      {/* Filter + add button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 4, background: '#F3F4F6', padding: 4, borderRadius: 8 }}>
          {(['all', 'high', 'medium', 'low'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12,
              background: filter === f ? '#fff' : 'transparent', color: filter === f ? '#111827' : '#6B7280',
              fontWeight: filter === f ? 600 : 400, boxShadow: filter === f ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
            }}>{f === 'all' ? `All (${open.length})` : f}</button>
          ))}
        </div>
        <Btn onClick={() => setShowAdd(!showAdd)}>+ Add task</Btn>
      </div>

      {/* Add form */}
      {showAdd && (
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Task title *" style={inp} />
          <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Description (optional)" style={{ ...inp, marginTop: 8 }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
            <select value={form.domain_id} onChange={e => setForm(p => ({ ...p, domain_id: e.target.value }))} style={inp}>
              <option value="">Domain</option>
              {domains.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value as Priority }))} style={inp}>
              <option value="high">High priority</option>
              <option value="medium">Medium priority</option>
              <option value="low">Low priority</option>
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
            <input type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} style={inp} />
            <input type="number" placeholder="Est. minutes" value={form.estimated_minutes} onChange={e => setForm(p => ({ ...p, estimated_minutes: e.target.value }))} style={inp} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <Btn onClick={add} disabled={saving}>{saving ? 'Saving…' : 'Add task'}</Btn>
            <CancelBtn onClick={() => setShowAdd(false)} />
          </div>
        </div>
      )}

      {/* Task list */}
      {filtered.map(task => {
        const days = task.due_date ? Math.ceil((new Date(task.due_date).getTime() - Date.now()) / 86400000) : null
        return (
          <div key={task.id} style={{ background: '#fff', border: '1px solid #F3F4F6', borderRadius: 12, padding: '12px 14px', marginBottom: 8, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            {/* Complete button */}
            <button onClick={() => complete(task.id)} title="Mark complete" style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid #D1D5DB', background: 'none', cursor: 'pointer', flexShrink: 0, marginTop: 2 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#111827', flex: 1 }}>{task.title}</span>
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, background: PRI_BG[task.priority], color: PRI_TX[task.priority], fontWeight: 600, flexShrink: 0 }}>
                  {task.priority}
                </span>
              </div>
              {task.description && <p style={{ fontSize: 12, color: '#6B7280', margin: '3px 0 0' }}>{task.description}</p>}
              <div style={{ display: 'flex', gap: 10, marginTop: 5 }}>
                {task.domain && <span style={{ fontSize: 11, color: '#9CA3AF' }}>{task.domain.name}</span>}
                {days !== null && (
                  <span style={{ fontSize: 11, fontWeight: days <= 0 ? 600 : 400, color: days < 0 ? '#DC2626' : days === 0 ? '#D97706' : '#9CA3AF' }}>
                    {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due today' : `${days}d left`}
                  </span>
                )}
                {task.estimated_minutes && <span style={{ fontSize: 11, color: '#9CA3AF' }}>~{task.estimated_minutes}m</span>}
              </div>
            </div>
          </div>
        )
      })}
      {filtered.length === 0 && <Empty label="No tasks in this category" />}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// ALERTS PANEL
// ══════════════════════════════════════════════════════════════════════════════
function AlertsPanel({ alerts, onRefresh }: { alerts: Alert[], onRefresh: () => void }) {
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm]       = useState({ title: '', body: '', severity: 'medium' as AlertSeverity })

  const markRead = async (ids: string[]) => {
    await fetch('/api/alerts', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) })
    onRefresh()
  }

  const addAlert = async () => {
    if (!form.title || !form.body) return
    await fetch('/api/alerts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setForm({ title: '', body: '', severity: 'medium' })
    setShowAdd(false)
    onRefresh()
  }

  const unread = alerts.filter(a => !a.read)
  const read   = alerts.filter(a =>  a.read)

  return (
    <div style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 13, color: '#6B7280' }}>{unread.length} unread</span>
        <div style={{ display: 'flex', gap: 8 }}>
          {unread.length > 0 && <button onClick={() => markRead(unread.map(a => a.id))} style={{ fontSize: 12, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer' }}>Mark all read</button>}
          <Btn onClick={() => setShowAdd(!showAdd)}>+ Add alert</Btn>
        </div>
      </div>

      {showAdd && (
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Alert title *" style={inp} />
          <textarea value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))} placeholder="Details *" rows={3} style={{ ...inp, marginTop: 8, resize: 'vertical' }} />
          <select value={form.severity} onChange={e => setForm(p => ({ ...p, severity: e.target.value as AlertSeverity }))} style={{ ...inp, marginTop: 8 }}>
            <option value="high">High severity</option>
            <option value="medium">Medium severity</option>
            <option value="info">Info</option>
          </select>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <Btn onClick={addAlert}>Add</Btn>
            <CancelBtn onClick={() => setShowAdd(false)} />
          </div>
        </div>
      )}

      {[...unread, ...read].map(a => (
        <div key={a.id} style={{
          background: '#fff', border: '1px solid #F3F4F6', borderLeft: `4px solid ${SEV_COLOR[a.severity]}`,
          borderRadius: 12, padding: '14px 16px', marginBottom: 8, opacity: a.read ? 0.5 : 1,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 5 }}>
                <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 999, background: SEV_BG[a.severity], color: SEV_COLOR[a.severity], fontWeight: 700 }}>{a.severity}</span>
                <span style={{ fontSize: 11, color: '#9CA3AF' }}>
                  {new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                </span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 4 }}>{a.title}</div>
              <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.55 }}>{a.body}</div>
              {a.url && <a href={a.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#2563EB', marginTop: 6, display: 'block' }}>Read source →</a>}
            </div>
            {!a.read && (
              <button onClick={() => markRead([a.id])} title="Mark read" style={{ background: 'none', border: 'none', fontSize: 18, color: '#D1D5DB', cursor: 'pointer', flexShrink: 0, lineHeight: 1 }}>✓</button>
            )}
          </div>
        </div>
      ))}
      {alerts.length === 0 && <Empty label="✓ No alerts — all clear" />}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// SCHEDULE PANEL
// ══════════════════════════════════════════════════════════════════════════════
function SchedulePanel({ blocks, domains, onRefresh }: { blocks: ScheduleBlock[], domains: Domain[], onRefresh: () => void }) {
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ title: '', block_type: 'deep_work' as BlockType, start_time: '', end_time: '', domain_id: '', protected: false, notes: '' })
  const today = new Date().toISOString().split('T')[0]

  const add = async () => {
    if (!form.title || !form.start_time || !form.end_time) return
    await fetch('/api/schedule', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, date: today, domain_id: form.domain_id || null }),
    })
    setShowAdd(false)
    setForm({ title: '', block_type: 'deep_work', start_time: '', end_time: '', domain_id: '', protected: false, notes: '' })
    onRefresh()
  }

  const del = async (id: string) => {
    await fetch(`/api/schedule?id=${id}`, { method: 'DELETE' })
    onRefresh()
  }

  const BLOCK_LABEL: Record<BlockType, string> = {
    deep_work: 'Deep work', admin: 'Admin', family: 'Family', health: 'Health', buffer: 'Buffer',
  }

  return (
    <div style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 13, color: '#6B7280' }}>
          Today · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </span>
        <Btn onClick={() => setShowAdd(!showAdd)}>+ Add block</Btn>
      </div>

      {showAdd && (
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Block title *" style={inp} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
            <input type="time" value={form.start_time} onChange={e => setForm(p => ({ ...p, start_time: e.target.value }))} style={inp} />
            <input type="time" value={form.end_time}   onChange={e => setForm(p => ({ ...p, end_time: e.target.value }))}   style={inp} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
            <select value={form.block_type} onChange={e => setForm(p => ({ ...p, block_type: e.target.value as BlockType }))} style={inp}>
              {(Object.keys(BLOCK_LABEL) as BlockType[]).map(k => <option key={k} value={k}>{BLOCK_LABEL[k]}</option>)}
            </select>
            <select value={form.domain_id} onChange={e => setForm(p => ({ ...p, domain_id: e.target.value }))} style={inp}>
              <option value="">Domain (optional)</option>
              {domains.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, fontSize: 13, color: '#374151', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.protected} onChange={e => setForm(p => ({ ...p, protected: e.target.checked }))} />
            Protected — lock this block (can't be deleted)
          </label>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <Btn onClick={add}>Add block</Btn>
            <CancelBtn onClick={() => setShowAdd(false)} />
          </div>
        </div>
      )}

      {blocks.map(b => (
        <div key={b.id} style={{
          background: '#fff', border: '1px solid #F3F4F6', borderLeft: `4px solid ${BLOCK_COLOR[b.block_type]}`,
          borderRadius: 12, padding: '11px 14px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: 11, color: '#9CA3AF', width: 94, flexShrink: 0 }}>{b.start_time.slice(0,5)} – {b.end_time.slice(0,5)}</span>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{b.title}</span>
            <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 8 }}>{BLOCK_LABEL[b.block_type]}</span>
            {b.domain && <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 6 }}>· {b.domain.name}</span>}
          </div>
          {b.protected
            ? <span style={{ fontSize: 11, color: '#9CA3AF' }}>🔒</span>
            : <button onClick={() => del(b.id)} style={{ background: 'none', border: 'none', color: '#D1D5DB', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>✕</button>
          }
        </div>
      ))}
      {blocks.length === 0 && <Empty label="Nothing scheduled — add a block above" />}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// AI AGENT PANEL
// ══════════════════════════════════════════════════════════════════════════════
function AgentPanel({ tasks, alerts }: { tasks: Task[], alerts: Alert[] }) {
  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'
  const openCount  = tasks.filter(t => t.status === 'open').length
  const unreadCount = alerts.filter(a => !a.read).length

  const [messages, setMessages] = useState<ChatMessage[]>([{
    role: 'assistant',
    content: `Good ${greeting}, Rudy. Context loaded — ${openCount} open tasks, ${unreadCount} unread alert${unreadCount !== 1 ? 's' : ''}. What do you want to work through?`,
    timestamp: new Date().toISOString(),
  }])
  const [input, setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef             = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async (text: string) => {
    if (!text.trim() || loading) return
    const userMsg: ChatMessage = { role: 'user', content: text, timestamp: new Date().toISOString() }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setInput('')
    setLoading(true)
    try {
      const res  = await fetch('/api/agent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: updated.map(m => ({ role: m.role, content: m.content })) }) })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || 'Error — try again.', timestamp: new Date().toISOString() }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Check API key.', timestamp: new Date().toISOString() }])
    }
    setLoading(false)
  }

  const QUICK = [
    'What should I focus on right now?',
    'What can I push to next week?',
    'Plan tomorrow morning for me',
    'What\'s the impact of current alerts?',
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '80%', padding: '10px 14px', borderRadius: 16, fontSize: 13, lineHeight: 1.6,
              background: m.role === 'user' ? '#111827' : '#fff',
              color:      m.role === 'user' ? '#fff' : '#111827',
              border:     m.role === 'assistant' ? '1px solid #F3F4F6' : 'none',
              borderBottomRightRadius: m.role === 'user' ? 4 : 16,
              borderBottomLeftRadius:  m.role === 'assistant' ? 4 : 16,
            }}>
              {m.role === 'assistant' && (
                <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', marginBottom: 4, letterSpacing: '0.05em' }}>AGENT</div>
              )}
              <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
              <div style={{ fontSize: 10, marginTop: 4, color: m.role === 'user' ? 'rgba(255,255,255,0.35)' : '#D1D5DB' }}>
                {new Date(m.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex' }}>
            <div style={{ background: '#fff', border: '1px solid #F3F4F6', borderRadius: 16, borderBottomLeftRadius: 4, padding: '12px 16px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', marginBottom: 6, letterSpacing: '0.05em' }}>AGENT</div>
              <div style={{ display: 'flex', gap: 4 }}>
                {[0, 150, 300].map(d => (
                  <span key={d} style={{ width: 6, height: 6, background: '#D1D5DB', borderRadius: '50%', display: 'inline-block', animation: `bounce 1s ${d}ms infinite` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      <div style={{ padding: '0 24px 8px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {QUICK.map(q => (
          <button key={q} onClick={() => send(q)} disabled={loading} style={{
            padding: '5px 12px', borderRadius: 999, border: '1px solid #E5E7EB',
            background: '#fff', color: '#6B7280', fontSize: 11, cursor: 'pointer',
          }}>{q}</button>
        ))}
      </div>

      {/* Input bar */}
      <div style={{ padding: '0 24px 24px' }}>
        <div style={{ display: 'flex', gap: 8, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: '10px 12px', alignItems: 'flex-end' }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) } }}
            placeholder="Ask your agent anything…"
            rows={1}
            style={{ flex: 1, fontSize: 13, border: 'none', outline: 'none', resize: 'none', fontFamily: 'inherit', color: '#111827', background: 'transparent' }}
          />
          <button onClick={() => send(input)} disabled={loading || !input.trim()} style={{
            width: 32, height: 32, borderRadius: 10, border: 'none', cursor: input.trim() ? 'pointer' : 'default',
            background: input.trim() && !loading ? '#111827' : '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
        <p style={{ fontSize: 11, color: '#D1D5DB', textAlign: 'center', marginTop: 6 }}>Enter to send · Shift+Enter for new line</p>
      </div>

      <style>{`@keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }`}</style>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// SMALL REUSABLE COMPONENTS
// ══════════════════════════════════════════════════════════════════════════════
function SectionLabel({ children, color = '#6B7280' }: { children: React.ReactNode, color?: string }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
      {color !== '#6B7280' && <span style={{ width: 6, height: 6, background: color, borderRadius: '50%', display: 'inline-block' }} />}
      {children}
    </div>
  )
}

function Empty({ label, onClick }: { label: string, onClick?: () => void }) {
  return (
    <div onClick={onClick} style={{ border: '2px dashed #E5E7EB', borderRadius: 12, padding: '32px 0', textAlign: 'center', color: '#9CA3AF', fontSize: 13, cursor: onClick ? 'pointer' : 'default' }}>
      {label}
    </div>
  )
}

function Btn({ onClick, disabled, children }: { onClick: () => void, disabled?: boolean, children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ padding: '7px 14px', background: '#111827', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontWeight: 500, opacity: disabled ? 0.5 : 1 }}>
      {children}
    </button>
  )
}

function CancelBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ padding: '7px 12px', background: 'none', border: 'none', fontSize: 12, color: '#6B7280', cursor: 'pointer' }}>Cancel</button>
  )
}
// ══════════════════════════════════════════════════════════════════════════════
// SETTINGS PANEL — Google Calendar + SMS setup
// ══════════════════════════════════════════════════════════════════════════════
function SettingsPanel() {
  const [gcalStatus, setGcalStatus]   = useState<'checking' | 'connected' | 'disconnected'>('checking')
  const [gcalEvents, setGcalEvents]   = useState<any[]>([])
  const [smsStatus, setSmsStatus]     = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [smsConfigured, setSmsConfigured] = useState(false)

  useEffect(() => {
    // Check Google Calendar connection
    fetch('/api/calendar')
      .then(r => r.json())
      .then(d => {
        setGcalStatus(d.connected ? 'connected' : 'disconnected')
        setGcalEvents(d.events || [])
      })
      .catch(() => setGcalStatus('disconnected'))

    // Check if SMS is configured (just tries to reach the route)
    fetch('/api/sms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ check: true }) })
      .then(r => r.json())
      .then(d => setSmsConfigured(!d.error?.includes('not configured')))
      .catch(() => {})
  }, [])

  const sendTestSms = async () => {
    setSmsStatus('sending')
    const res  = await fetch('/api/sms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ test: true }) })
    const data = await res.json()
    setSmsStatus(data.ok ? 'sent' : 'error')
    setTimeout(() => setSmsStatus('idle'), 4000)
  }

  const Card = ({ children, title }: { children: React.ReactNode, title: string }) => (
    <div style={{ background: '#fff', border: '1px solid #F3F4F6', borderRadius: 12, padding: 20, marginBottom: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 14 }}>{title}</div>
      {children}
    </div>
  )

  const Row = ({ label, value, note }: { label: string, value: string, note?: string }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 500, color: '#374151' }}>{label}</div>
        {note && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{note}</div>}
      </div>
      <div style={{ fontSize: 12, color: '#6B7280', textAlign: 'right', maxWidth: '55%', wordBreak: 'break-all' }}>{value}</div>
    </div>
  )

  return (
    <div style={{ padding: 24, maxWidth: 680, margin: '0 auto' }}>

      {/* ── Google Calendar ── */}
      <Card title="📅 Google Calendar">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 13, color: '#374151' }}>
              Status: <span style={{ fontWeight: 600, color: gcalStatus === 'connected' ? '#16A34A' : gcalStatus === 'checking' ? '#D97706' : '#DC2626' }}>
                {gcalStatus === 'connected' ? '✓ Connected' : gcalStatus === 'checking' ? 'Checking…' : '✗ Not connected'}
              </span>
            </div>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
              {gcalStatus === 'connected' ? 'Your schedule blocks sync to Google Calendar → Apple Calendar' : 'Connect to sync schedule blocks to your Apple Calendar via Google'}
            </div>
          </div>
          {gcalStatus !== 'connected' && (
            <a href="/api/auth/google" style={{
              padding: '8px 16px', background: '#111827', color: '#fff', borderRadius: 8,
              fontSize: 12, fontWeight: 500, textDecoration: 'none', whiteSpace: 'nowrap',
            }}>
              Connect →
            </a>
          )}
        </div>

        {gcalStatus === 'connected' && gcalEvents.length > 0 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Today's Calendar Events</div>
            {gcalEvents.slice(0, 5).map((e: any) => {
              const time = e.start?.dateTime
                ? new Date(e.start.dateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                : 'All day'
              return (
                <div key={e.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #F9FAFB' }}>
                  <span style={{ fontSize: 11, color: '#9CA3AF', width: 60, flexShrink: 0 }}>{time}</span>
                  <span style={{ fontSize: 13, color: '#111827' }}>{e.summary}</span>
                </div>
              )
            })}
          </div>
        )}

        {gcalStatus === 'disconnected' && (
          <div style={{ background: '#F9FAFB', borderRadius: 8, padding: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Setup steps:</div>
            <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.7 }}>
              1. Add <code style={{ background: '#E5E7EB', padding: '1px 4px', borderRadius: 3 }}>GOOGLE_CLIENT_ID</code>, <code style={{ background: '#E5E7EB', padding: '1px 4px', borderRadius: 3 }}>GOOGLE_CLIENT_SECRET</code>, and <code style={{ background: '#E5E7EB', padding: '1px 4px', borderRadius: 3 }}>GOOGLE_REDIRECT_URI</code> to your <code style={{ background: '#E5E7EB', padding: '1px 4px', borderRadius: 3 }}>.env.local</code> file<br/>
              2. See README_CALENDAR.md in your project folder for exact steps<br/>
              3. Restart the app (<code style={{ background: '#E5E7EB', padding: '1px 4px', borderRadius: 3 }}>npm run dev</code>)<br/>
              4. Click Connect above
            </div>
          </div>
        )}
      </Card>

      {/* ── SMS Alerts ── */}
      <Card title="📱 SMS Alerts (Twilio)">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 13, color: '#374151' }}>
              Status: <span style={{ fontWeight: 600, color: smsConfigured ? '#16A34A' : '#DC2626' }}>
                {smsConfigured ? '✓ Configured' : '✗ Not configured'}
              </span>
            </div>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
              {smsConfigured ? 'High-priority alerts will text your phone' : 'Add Twilio keys to get SMS alerts for high-priority events'}
            </div>
          </div>
          {smsConfigured && (
            <button onClick={sendTestSms} disabled={smsStatus === 'sending'} style={{
              padding: '8px 16px', background: smsStatus === 'sent' ? '#16A34A' : smsStatus === 'error' ? '#DC2626' : '#111827',
              color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer',
            }}>
              {smsStatus === 'idle' ? 'Send test text' : smsStatus === 'sending' ? 'Sending…' : smsStatus === 'sent' ? '✓ Sent!' : '✗ Failed'}
            </button>
          )}
        </div>

        {!smsConfigured && (
          <div style={{ background: '#F9FAFB', borderRadius: 8, padding: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Setup steps:</div>
            <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.7 }}>
              1. Go to <strong>twilio.com</strong> → sign up free (gives ~$15 trial credit)<br/>
              2. Get a phone number (free with trial)<br/>
              3. Add to <code style={{ background: '#E5E7EB', padding: '1px 4px', borderRadius: 3 }}>.env.local</code>:<br/>
              <code style={{ background: '#E5E7EB', padding: '4px 8px', borderRadius: 3, display: 'block', marginTop: 6, fontSize: 11 }}>
                TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxx<br/>
                TWILIO_AUTH_TOKEN=your_auth_token<br/>
                TWILIO_PHONE_FROM=+15705551234<br/>
                TWILIO_PHONE_TO=+15705559999
              </code>
              <br/>
              4. Restart the app and click "Send test text"
            </div>
          </div>
        )}

        {smsConfigured && (
          <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.6 }}>
            High-severity alerts automatically send a text to your phone.<br/>
            You can also text any alert manually from the Alerts tab.
          </div>
        )}
      </Card>

      {/* ── How the sync works ── */}
      <Card title="ℹ️ How Apple Calendar sync works">
        <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.8 }}>
          <strong>Apple Calendar ↔ Google Calendar ↔ This app</strong><br/>
          <span style={{ color: '#6B7280', fontSize: 12 }}>
            Your iPhone's Apple Calendar syncs to Google Calendar natively (Settings → Calendar → Accounts → Google).
            Once connected, schedule blocks you add here automatically appear on your iPhone, and Google Calendar events
            you add on your phone show up in this app's Settings page.
          </span>
        </div>
        <div style={{ marginTop: 12, padding: 12, background: '#F0FDF4', borderRadius: 8, border: '1px solid #BBF7D0' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#166534', marginBottom: 4 }}>Color coding on your calendar:</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            {[
              ['Real Estate', '#2563EB'], ['Fleet / Vehicles', '#16A34A'],
              ['Investing', '#D97706'],   ['Family', '#DB2777'],
              ['Home Improvement', '#7C3AED'], ['CVS / Day Job', '#6B7280'],
            ].map(([name, color]) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#374151' }}>
                <span style={{ width: 8, height: 8, background: color, borderRadius: '50%', display: 'inline-block', flexShrink: 0 }} />
                {name}
              </div>
            ))}
          </div>
        </div>
      </Card>

    </div>
  )
}
