import type { UdyamiEvent } from '@trek/shared'

/** The viewer's own IANA timezone, e.g. "Pacific/Auckland". */
export function localTimezone(): string {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' } catch { return 'UTC' }
}

/** Every timezone the browser knows, the viewer's own first. */
export function allTimezones(): string[] {
  const own = localTimezone()
  let list: string[] = []
  try { list = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf?.('timeZone') ?? [] } catch { list = [] }
  if (list.length === 0) list = ['UTC', 'Pacific/Auckland', 'Australia/Sydney', 'Asia/Kathmandu', 'Asia/Kolkata', 'Europe/London', 'America/New_York', 'America/Toronto', 'Asia/Dubai', 'Asia/Qatar']
  return [own, ...list.filter(t => t !== own)]
}

/** Minutes `timeZone` is ahead of UTC at the instant `utcMs`. */
function offsetMinutes(utcMs: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(new Date(utcMs))
  const get = (t: string) => Number(parts.find(p => p.type === t)?.value)
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'))
  return Math.round((asUtc - utcMs) / 60_000)
}

/** A wall-clock date and time in `timeZone` as a UTC ISO string ("…Z"). */
export function zonedToUtcIso(date: string, time: string, timeZone: string): string {
  const [y, m, d] = date.split('-').map(Number)
  const [hh, mm] = time.split(':').map(Number)
  const wall = Date.UTC(y, m - 1, d, hh, mm)
  let utc = wall - offsetMinutes(wall, timeZone) * 60_000
  utc = wall - offsetMinutes(utc, timeZone) * 60_000 // second pass settles daylight-saving edges
  return new Date(utc).toISOString()
}

/** The date ("2026-11-08") and time ("19:00") of a UTC instant on the clock of `timeZone`. */
export function utcToZoned(iso: string, timeZone: string): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  }).formatToParts(new Date(iso))
  const get = (t: string) => parts.find(p => p.type === t)?.value ?? '00'
  return { date: `${get('year')}-${get('month')}-${get('day')}`, time: `${get('hour')}:${get('minute')}` }
}

export function formatWhen(iso: string, opts: Intl.DateTimeFormatOptions, timeZone?: string): string {
  return new Date(iso).toLocaleString(undefined, { ...opts, timeZone })
}

/** True from 15 minutes before the start until the end. */
export function isLiveSoon(ev: UdyamiEvent, now = Date.now()): boolean {
  return now >= Date.parse(ev.starts_at) - 15 * 60_000 && now <= Date.parse(ev.ends_at)
}

const ics = (s: string) => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/[,;]/g, m => `\\${m}`)
const icsTime = (iso: string) => iso.replace(/[-:]/g, '').replace(/\.\d{3}/, '')

/** Downloads an .ics file so the event lands in the viewer's own calendar. */
export function downloadIcs(ev: UdyamiEvent): void {
  const body = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Udyami Manch//Events//EN', 'BEGIN:VEVENT',
    `UID:udyami-event-${ev.id}@udyamimanch`,
    `DTSTAMP:${icsTime(new Date().toISOString())}`,
    `DTSTART:${icsTime(new Date(ev.starts_at).toISOString())}`,
    `DTEND:${icsTime(new Date(ev.ends_at).toISOString())}`,
    `SUMMARY:${ics(ev.title)}`,
    `DESCRIPTION:${ics([ev.description ?? '', ev.join_url ? `Join: ${ev.join_url}` : ''].filter(Boolean).join('\n\n'))}`,
    ...(ev.join_url ? [`URL:${ev.join_url}`, `LOCATION:${ics(ev.join_url)}`] : []),
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n')
  const url = URL.createObjectURL(new Blob([body], { type: 'text/calendar' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `${ev.title.replace(/[^\w-]+/g, '-').slice(0, 60) || 'event'}.ics`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
