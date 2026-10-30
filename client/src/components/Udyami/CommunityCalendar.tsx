import { ChevronLeft, ChevronRight, Video } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { UdyamiEvent } from '@trek/shared'
import { eventsApi } from '../../api/udyami'
import { formatWhen, localTimezone, utcToZoned } from './eventTime'
import { FESTIVAL_YEARS, FESTIVALS, KIND_LABEL, festivalsOn, type Festival } from './festivals'
import { PLATFORM_LABEL } from './EventFormDialog'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const EVENT_COLOR = '#1F4455'
const FESTIVAL_COLOR = '#F2A900'
const NZ_COLOR = '#93A3A9'

const pad = (n: number) => String(n).padStart(2, '0')
const key = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`

function dotColor(f: Festival): string { return f.kind === 'nz' ? NZ_COLOR : FESTIVAL_COLOR }

/**
 * A year of months in the style of the original Vacay calendar: online events in
 * Udyami Manch blue, Nepali and Indian festivals in marigold, New Zealand public
 * holidays in grey. Pick a day to see what is on it.
 */
export default function CommunityCalendar() {
  const tz = localTimezone()
  const today = useMemo(() => utcToZoned(new Date().toISOString(), tz).date, [tz])
  const [year, setYear] = useState(() => Math.min(Math.max(Number(today.slice(0, 4)), FESTIVAL_YEARS[0]), FESTIVAL_YEARS[FESTIVAL_YEARS.length - 1]))
  const [events, setEvents] = useState<UdyamiEvent[]>([])
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    Promise.all([eventsApi.list('upcoming'), eventsApi.list('past')])
      .then(([a, b]) => { if (alive) setEvents([...a.events, ...b.events]) })
      .catch(() => { /* the festivals still show */ })
    return () => { alive = false }
  }, [])

  const eventsByDay = useMemo(() => {
    const m = new Map<string, UdyamiEvent[]>()
    for (const ev of events) {
      const d = utcToZoned(ev.starts_at, tz).date
      m.set(d, [...(m.get(d) ?? []), ev])
    }
    return m
  }, [events, tz])

  const comingUp = useMemo(() => {
    const items: { date: string; title: string; kind: 'event' | Festival['kind']; note?: string; ev?: UdyamiEvent }[] = []
    for (const [d, list] of eventsByDay) if (d >= today) for (const ev of list) items.push({ date: d, title: ev.title, kind: 'event', ev })
    for (const f of FESTIVALS) if ((f.end ?? f.date) >= today && f.kind !== 'nz') items.push({ date: f.date < today ? today : f.date, title: f.name, kind: f.kind, note: f.note })
    return items.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 8)
  }, [eventsByDay, today])

  const dayItems = selected ? { events: eventsByDay.get(selected) ?? [], festivals: festivalsOn(selected) } : null

  const month = (m: number) => {
    const first = new Date(Date.UTC(year, m, 1))
    const offset = (first.getUTCDay() + 6) % 7
    const days = new Date(Date.UTC(year, m + 1, 0)).getUTCDate()
    const cells: (number | null)[] = [...Array(offset).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)]
    return (
      <div key={m} className="rounded-[20px] border border-edge bg-surface-card p-4 shadow-card">
        <div className="mb-2 text-[15px] font-bold text-content">{MONTHS[m]}</div>
        <div className="grid grid-cols-7 gap-y-1 text-center">
          {WEEK.map(w => <div key={w} className="text-[10px] font-semibold text-content-faint">{w}</div>)}
          {cells.map((d, i) => {
            if (d === null) return <div key={`e${i}`} />
            const k = key(year, m, d)
            const ev = eventsByDay.get(k)
            const fest = festivalsOn(k)
            const isToday = k === today
            const sel = k === selected
            const major = fest.find(f => f.kind !== 'nz')
            return (
              <button
                key={k}
                type="button"
                onClick={() => setSelected(sel ? null : k)}
                title={[...(ev ?? []).map(e => e.title), ...fest.map(f => f.name)].join(', ') || undefined}
                className="relative mx-auto flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-semibold"
                style={{
                  background: ev ? EVENT_COLOR : major ? 'rgba(242,169,0,.22)' : fest.length ? 'rgba(147,163,169,.2)' : 'transparent',
                  color: ev ? '#fff' : 'var(--text-primary)',
                  outline: sel ? `2px solid ${EVENT_COLOR}` : isToday ? `1.5px solid ${FESTIVAL_COLOR}` : 'none',
                  outlineOffset: 1,
                }}
              >
                {d}
                {ev && major && <span className="absolute bottom-[2px] h-[4px] w-[4px] rounded-full" style={{ background: FESTIVAL_COLOR }} />}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  const legend = (color: string, label: string) => (
    <span className="inline-flex items-center gap-1.5 text-caption text-content-secondary"><span className="h-3 w-3 rounded-full" style={{ background: color }} /> {label}</span>
  )

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2">
        <div className="flex items-center gap-1 rounded-full border border-edge bg-surface-card p-1">
          <button type="button" disabled={year <= FESTIVAL_YEARS[0]} onClick={() => setYear(y => y - 1)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-surface-hover disabled:opacity-30" aria-label="Previous year"><ChevronLeft size={16} /></button>
          <span className="min-w-[56px] text-center text-body font-bold text-content">{year}</span>
          <button type="button" disabled={year >= FESTIVAL_YEARS[FESTIVAL_YEARS.length - 1]} onClick={() => setYear(y => y + 1)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-surface-hover disabled:opacity-30" aria-label="Next year"><ChevronRight size={16} /></button>
        </div>
        {legend(EVENT_COLOR, 'Online event')}
        {legend(FESTIVAL_COLOR, 'Nepali and Indian festival')}
        {legend(NZ_COLOR, 'NZ public holiday')}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">{MONTHS.map((_, m) => month(m))}</div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-[calc(var(--nav-h)+16px)] lg:self-start">
          <div className="rounded-[20px] border border-edge bg-surface-card p-4 shadow-card">
            <div className="mb-2 text-caption font-semibold uppercase tracking-[.08em] text-content-muted">
              {selected ? formatWhen(`${selected}T12:00:00Z`, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }, 'UTC') : 'Coming up'}
            </div>
            {selected ? (
              dayItems && dayItems.events.length + dayItems.festivals.length > 0 ? (
                <ul className="m-0 flex list-none flex-col gap-2 p-0">
                  {dayItems.events.map(ev => (
                    <li key={ev.id} className="flex items-start gap-2 text-body text-content"><Video size={15} className="mt-[3px] flex-none" style={{ color: EVENT_COLOR }} /><span>{ev.title}<span className="block text-caption text-content-muted">{formatWhen(ev.starts_at, { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })} · {PLATFORM_LABEL[ev.platform]}</span></span></li>
                  ))}
                  {dayItems.festivals.map(f => (
                    <li key={f.name + f.date} className="flex items-start gap-2 text-body text-content"><span className="mt-[7px] h-2.5 w-2.5 flex-none rounded-full" style={{ background: dotColor(f) }} /><span>{f.name}<span className="block text-caption text-content-muted">{KIND_LABEL[f.kind]}{f.note ? `. ${f.note}` : ''}</span></span></li>
                  ))}
                </ul>
              ) : <p className="m-0 text-body text-content-muted">Nothing on this day.</p>
            ) : comingUp.length === 0 ? (
              <p className="m-0 text-body text-content-muted">Nothing coming up.</p>
            ) : (
              <ul className="m-0 flex list-none flex-col gap-3 p-0">
                {comingUp.map((it, i) => (
                  <li key={i}>
                    <button type="button" onClick={() => { setYear(Number(it.date.slice(0, 4))); setSelected(it.date) }} className="flex w-full items-start gap-3 text-start">
                      <span className="mt-[7px] h-2.5 w-2.5 flex-none rounded-full" style={{ background: it.kind === 'event' ? EVENT_COLOR : FESTIVAL_COLOR }} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-body font-semibold text-content">{it.title}</span>
                        <span className="block text-caption text-content-muted">{formatWhen(`${it.date}T12:00:00Z`, { weekday: 'short', day: 'numeric', month: 'short' }, 'UTC')}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <p className="m-0 px-1 text-[11px] leading-snug text-content-muted">Festival dates follow the lunar calendars, and Nepal and India can differ by a day. Check with your local temple or community society before you plan around one.</p>
        </aside>
      </div>
    </div>
  )
}
