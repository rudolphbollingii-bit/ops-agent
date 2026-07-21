'use client'

import { useState, useEffect } from 'react'
import { ScheduleBlock, Domain } from '@/types'

// ── Color maps ────────────────────────────────────────────────────────────────
const BLOCK_COLOR: Record<string, string> = {
  deep_work: '#2563EB',
  admin:     '#D97706',
  family:    '#DB2777',
  health:    '#16A34A',
  buffer:    '#9CA3AF',
}

const BLOCK_BG: Record<string, string> = {
  deep_work: '#EFF6FF',
  admin:     '#FFFBEB',
  family:    '#FDF2F8',
  health:    '#F0FDF4',
  buffer:    '#F9FAFB',
}

type CalView = 'day' | 'week' | 'month' | 'year'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const HOURS = Array.from({ length: 24 }, (_, i) => i)

function fmt12(h: number) {
  if (h === 0) return '12 AM'
  if (h === 12) return '12 PM'
  return h < 12 ? `${h} AM` : `${h - 12} PM`
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function startOfWeek(d: Date) {
  const day = new Date(d)
  day.setDate(day.getDate() - day.getDay())
  day.setHours(0, 0, 0, 0)
  return day
}

// ── Main Calendar Panel ───────────────────────────────────────────────────────
export default function CalendarPanel({
  blocks,
  domains,
  onRefresh,
}: {
  blocks: ScheduleBlock[]
  domains: Domain[]
  onRefresh: () => void
}) {
  const [view, setView] = useState<CalView>('month')
  const [current, setCurrent] = useState(new Date())
  const [allBlocks, setAllBlocks] = useState<ScheduleBlock[]>(blocks)
  const [showAdd, setShowAdd] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [form, setForm] = useState({
    title: '', block_type: 'deep_work', start_time: '09:00', end_time: '10:00', domain_id: '', protected: false,
  })

  // Load blocks for current view range
  useEffect(() => {
    loadBlocks()
  }, [current, view])

  const loadBlocks = async () => {
    // For simplicity load a wide range and filter client side
    const start = new Date(current.getFullYear(), current.getMonth() - 1, 1)
    const end   = new Date(current.getFullYear(), current.getMonth() + 2, 0)

    // Fetch per day — in a real app you'd have a range endpoint
    // For now use the blocks passed as props + fetch today
    const today = new Date().toISOString().split('T')[0]
    const year = current.getFullYear()
    const month = current.getMonth()
    const startRange = new Date(year, month, 1).toISOString().split('T')[0]
    const endRange = new Date(year, month + 1, 0).toISOString().split('T')[0]
    const res = await fetch(`/api/schedule?start=${startRange}&end=${endRange}`)
    const data = await res.json()
    setAllBlocks(Array.isArray(data) ? data : blocks)
  }

  const blocksForDate = (d: Date) => {
    const dateStr = d.toISOString().split('T')[0]
    return allBlocks.filter(b => b.date === dateStr)
  }

  const addBlock = async (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    await fetch('/api/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        date: dateStr,
        domain_id: form.domain_id || null,
      }),
    })
    setShowAdd(false)
    setSelectedDate(null)
    setForm({ title: '', block_type: 'deep_work', start_time: '09:00', end_time: '10:00', domain_id: '', protected: false })
    await loadBlocks()
    onRefresh()
  }

  const deleteBlock = async (id: string) => {
    await fetch(`/api/schedule?id=${id}`, { method: 'DELETE' })
    await loadBlocks()
    onRefresh()
  }

  // Navigation
  const prev = () => {
    const d = new Date(current)
    if (view === 'day')   d.setDate(d.getDate() - 1)
    if (view === 'week')  d.setDate(d.getDate() - 7)
    if (view === 'month') d.setMonth(d.getMonth() - 1)
    if (view === 'year')  d.setFullYear(d.getFullYear() - 1)
    setCurrent(d)
  }

  const next = () => {
    const d = new Date(current)
    if (view === 'day')   d.setDate(d.getDate() + 1)
    if (view === 'week')  d.setDate(d.getDate() + 7)
    if (view === 'month') d.setMonth(d.getMonth() + 1)
    if (view === 'year')  d.setFullYear(d.getFullYear() + 1)
    setCurrent(d)
  }

  const goToday = () => setCurrent(new Date())

  // Title
  const title = () => {
    if (view === 'day')   return current.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    if (view === 'week')  {
      const ws = startOfWeek(current)
      const we = new Date(ws); we.setDate(we.getDate() + 6)
      return `${ws.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${we.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    }
    if (view === 'month') return current.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    if (view === 'year')  return current.getFullYear().toString()
    return ''
  }

  const s: Record<string, React.CSSProperties> = {
    root:      { display: 'flex', flexDirection: 'column', height: '100%', background: '#F9FAFB' },
    header:    { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px', background: '#fff', borderBottom: '1px solid #F3F4F6', flexShrink: 0 },
    title:     { fontSize: 15, fontWeight: 600, color: '#111827', flex: 1 },
    navBtn:    { padding: '5px 10px', border: '1px solid #E5E7EB', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 13, color: '#374151' },
    body:      { flex: 1, overflow: 'auto' },
    inp:       { width: '100%', fontSize: 13, padding: '7px 10px', border: '1px solid #E5E7EB', borderRadius: 7, outline: 'none', fontFamily: 'inherit', color: '#111827', background: '#fff', boxSizing: 'border-box' as const },
  }

  const viewBtnStyle = (active: boolean): React.CSSProperties => ({ padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: active ? 600 : 400, background: active ? '#111827' : '#F3F4F6', color: active ? '#fff' : '#6B7280' })

  return (
    <div style={s.root}>
      {/* Header */}
      <div style={s.header}>
        <button style={s.navBtn} onClick={prev}>‹</button>
        <button style={s.navBtn} onClick={next}>›</button>
        <button style={{ ...s.navBtn, marginRight: 8 }} onClick={goToday}>Today</button>
        <span style={s.title}>{title()}</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['day','week','month','year'] as CalView[]).map(v => (
            <button key={v} style={viewBtnStyle(view === v)} onClick={() => setView(v)}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
        <button
          onClick={() => { setSelectedDate(current); setShowAdd(true) }}
          style={{ padding: '6px 14px', background: '#111827', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', marginLeft: 8 }}
        >
          + Add
        </button>
      </div>

      {/* Add block modal */}
      {showAdd && selectedDate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 24, width: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 16 }}>
              Add block — {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Title *" style={{ ...s.inp, marginBottom: 8 }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
              <input type="time" value={form.start_time} onChange={e => setForm(p => ({ ...p, start_time: e.target.value }))} style={s.inp} />
              <input type="time" value={form.end_time}   onChange={e => setForm(p => ({ ...p, end_time: e.target.value }))}   style={s.inp} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
              <select value={form.block_type} onChange={e => setForm(p => ({ ...p, block_type: e.target.value }))} style={s.inp}>
                <option value="deep_work">Deep work</option>
                <option value="admin">Admin</option>
                <option value="family">Family</option>
                <option value="health">Health</option>
                <option value="buffer">Buffer</option>
              </select>
              <select value={form.domain_id} onChange={e => setForm(p => ({ ...p, domain_id: e.target.value }))} style={s.inp}>
                <option value="">Domain (opt)</option>
                {domains.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151', marginBottom: 16, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.protected} onChange={e => setForm(p => ({ ...p, protected: e.target.checked }))} />
              Protected (can't be deleted)
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => addBlock(selectedDate)} disabled={!form.title} style={{ flex: 1, padding: '9px', background: '#111827', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', opacity: form.title ? 1 : 0.4 }}>
                Add block
              </button>
              <button onClick={() => { setShowAdd(false); setSelectedDate(null) }} style={{ padding: '9px 16px', background: '#F3F4F6', color: '#6B7280', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Views */}
      <div style={s.body}>
        {view === 'day'   && <DayView   date={current} blocks={blocksForDate(current)} onDelete={deleteBlock} onAdd={(d) => { setSelectedDate(d); setShowAdd(true) }} />}
        {view === 'week'  && <WeekView  startDate={startOfWeek(current)} blocksForDate={blocksForDate} onDelete={deleteBlock} onAdd={(d) => { setSelectedDate(d); setShowAdd(true) }} />}
        {view === 'month' && <MonthView current={current} blocksForDate={blocksForDate} onDayClick={(d) => { setCurrent(d); setView('day') }} onAdd={(d) => { setSelectedDate(d); setShowAdd(true) }} />}
        {view === 'year'  && <YearView  year={current.getFullYear()} blocksForDate={blocksForDate} onMonthClick={(m) => { const d = new Date(current.getFullYear(), m, 1); setCurrent(d); setView('month') }} />}
      </div>
    </div>
  )
}

// ── Day View ──────────────────────────────────────────────────────────────────
function DayView({ date, blocks, onDelete, onAdd }: { date: Date, blocks: ScheduleBlock[], onDelete: (id: string) => void, onAdd: (d: Date) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', background: '#fff' }}>
      {HOURS.map(h => {
        const hourBlocks = blocks.filter(b => {
          const bh = parseInt(b.start_time.split(':')[0])
          return bh === h
        })
        return (
          <div key={h} style={{ display: 'flex', minHeight: 56, borderBottom: '1px solid #F3F4F6' }}>
            <div style={{ width: 56, flexShrink: 0, fontSize: 10, color: '#9CA3AF', padding: '4px 8px', textAlign: 'right', paddingTop: 6 }}>{fmt12(h)}</div>
            <div style={{ flex: 1, padding: '4px 8px', cursor: 'pointer' }} onClick={() => onAdd(date)}>
              {hourBlocks.map(b => (
                <BlockPill key={b.id} block={b} onDelete={onDelete} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Week View ─────────────────────────────────────────────────────────────────
function WeekView({ startDate, blocksForDate, onDelete, onAdd }: { startDate: Date, blocksForDate: (d: Date) => ScheduleBlock[], onDelete: (id: string) => void, onAdd: (d: Date) => void }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startDate); d.setDate(d.getDate() + i); return d
  })
  const today = new Date()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', background: '#fff', minHeight: '100%' }}>
      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: '56px repeat(7, 1fr)', borderBottom: '2px solid #F3F4F6', position: 'sticky', top: 0, background: '#fff', zIndex: 10 }}>
        <div />
        {days.map((d, i) => {
          const isToday = sameDay(d, today)
          return (
            <div key={i} style={{ textAlign: 'center', padding: '10px 4px', borderLeft: '1px solid #F3F4F6' }}>
              <div style={{ fontSize: 11, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{DAYS_SHORT[d.getDay()]}</div>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: isToday ? '#111827' : 'transparent', color: isToday ? '#fff' : '#111827', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '2px auto 0' }}>{d.getDate()}</div>
            </div>
          )
        })}
      </div>
      {/* Hours */}
      {HOURS.map(h => (
        <div key={h} style={{ display: 'grid', gridTemplateColumns: '56px repeat(7, 1fr)', minHeight: 52, borderBottom: '1px solid #F3F4F6' }}>
          <div style={{ fontSize: 10, color: '#9CA3AF', padding: '4px 8px', textAlign: 'right', paddingTop: 6 }}>{fmt12(h)}</div>
          {days.map((d, i) => {
            const dayBlocks = blocksForDate(d).filter(b => parseInt(b.start_time.split(':')[0]) === h)
            return (
              <div key={i} style={{ borderLeft: '1px solid #F3F4F6', padding: '3px 4px', cursor: 'pointer', minHeight: 52 }} onClick={() => onAdd(d)}>
                {dayBlocks.map(b => <BlockPill key={b.id} block={b} onDelete={onDelete} compact />)}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

// ── Month View ────────────────────────────────────────────────────────────────
function MonthView({ current, blocksForDate, onDayClick, onAdd }: { current: Date, blocksForDate: (d: Date) => ScheduleBlock[], onDayClick: (d: Date) => void, onAdd: (d: Date) => void }) {
  const today = new Date()
  const year = current.getFullYear()
  const month = current.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (Date | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div style={{ background: '#fff', minHeight: '100%' }}>
      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '2px solid #F3F4F6' }}>
        {DAYS_SHORT.map(d => (
          <div key={d} style={{ textAlign: 'center', padding: '8px 0', fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{d}</div>
        ))}
      </div>
      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {cells.map((d, i) => {
          if (!d) return <div key={i} style={{ minHeight: 100, borderRight: '1px solid #F3F4F6', borderBottom: '1px solid #F3F4F6', background: '#FAFAFA' }} />
          const isToday = sameDay(d, today)
          const dayBlocks = blocksForDate(d)
          return (
            <div
              key={i}
              onClick={() => onDayClick(d)}
              style={{ minHeight: 100, borderRight: '1px solid #F3F4F6', borderBottom: '1px solid #F3F4F6', padding: 6, cursor: 'pointer', background: isToday ? '#FAFFF4' : '#fff', transition: 'background 0.1s' }}
              onMouseEnter={e => (e.currentTarget.style.background = isToday ? '#F0FDF4' : '#F9FAFB')}
              onMouseLeave={e => (e.currentTarget.style.background = isToday ? '#FAFFF4' : '#fff')}
            >
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: isToday ? '#111827' : 'transparent', color: isToday ? '#fff' : '#374151', fontSize: 12, fontWeight: isToday ? 700 : 400, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                {d.getDate()}
              </div>
              {dayBlocks.slice(0, 3).map(b => (
                <div key={b.id} style={{ fontSize: 10, padding: '2px 5px', borderRadius: 4, marginBottom: 2, background: BLOCK_BG[b.block_type] || '#F3F4F6', color: BLOCK_COLOR[b.block_type] || '#374151', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {b.start_time.slice(0,5)} {b.title}
                </div>
              ))}
              {dayBlocks.length > 3 && (
                <div style={{ fontSize: 10, color: '#9CA3AF', paddingLeft: 4 }}>+{dayBlocks.length - 3} more</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Year View ─────────────────────────────────────────────────────────────────
function YearView({ year, blocksForDate, onMonthClick }: { year: number, blocksForDate: (d: Date) => ScheduleBlock[], onMonthClick: (m: number) => void }) {
  const today = new Date()
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, padding: 20, background: '#F9FAFB' }}>
      {MONTHS.map((monthName, monthIdx) => {
        const firstDay = new Date(year, monthIdx, 1).getDay()
        const daysInMonth = new Date(year, monthIdx + 1, 0).getDate()
        const cells: (number | null)[] = [
          ...Array(firstDay).fill(null),
          ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
        ]
        while (cells.length % 7 !== 0) cells.push(null)

        const isCurrentMonth = today.getFullYear() === year && today.getMonth() === monthIdx

        return (
          <div
            key={monthIdx}
            onClick={() => onMonthClick(monthIdx)}
            style={{ background: '#fff', borderRadius: 12, padding: 12, cursor: 'pointer', border: isCurrentMonth ? '2px solid #111827' : '1px solid #F3F4F6', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: '#111827', marginBottom: 8 }}>{monthName}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
              {['S','M','T','W','T','F','S'].map((d, i) => (
                <div key={i} style={{ fontSize: 8, color: '#9CA3AF', textAlign: 'center', fontWeight: 600 }}>{d}</div>
              ))}
              {cells.map((day, i) => {
                if (!day) return <div key={i} />
                const d = new Date(year, monthIdx, day)
                const isToday = sameDay(d, today)
                const hasBlocks = blocksForDate(d).length > 0
                return (
                  <div key={i} style={{ position: 'relative', textAlign: 'center', fontSize: 9, color: isToday ? '#fff' : '#374151', background: isToday ? '#111827' : 'transparent', borderRadius: '50%', width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontWeight: isToday ? 700 : 400 }}>
                    {day}
                    {hasBlocks && !isToday && <span style={{ position: 'absolute', bottom: 1, left: '50%', transform: 'translateX(-50%)', width: 3, height: 3, borderRadius: '50%', background: '#2563EB' }} />}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Block Pill ────────────────────────────────────────────────────────────────
function BlockPill({ block, onDelete, compact }: { block: ScheduleBlock, onDelete: (id: string) => void, compact?: boolean }) {
  const color = BLOCK_COLOR[block.block_type] || '#374151'
  const bg    = BLOCK_BG[block.block_type]   || '#F3F4F6'
  return (
    <div
      style={{ background: bg, borderLeft: `3px solid ${color}`, borderRadius: 5, padding: compact ? '2px 5px' : '5px 8px', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden' }}
      onClick={e => e.stopPropagation()}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: compact ? 10 : 12, fontWeight: 500, color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {block.start_time.slice(0,5)} {block.title}
        </div>
      </div>
      {!block.protected && (
        <button onClick={() => onDelete(block.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D1D5DB', fontSize: 12, lineHeight: 1, padding: '0 2px', flexShrink: 0 }}>✕</button>
      )}
      {block.protected && <span style={{ fontSize: 9, color: '#9CA3AF', flexShrink: 0 }}>🔒</span>}
    </div>
  )
}
