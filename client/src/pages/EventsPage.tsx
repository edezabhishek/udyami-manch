import { CalendarDays, CalendarPlus, Check, ChevronRight, Clock, List, Pencil, Plus, Trash2, Users, Video, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import type { EventListScope, UdyamiEvent } from '@trek/shared'
import { eventsApi } from '../api/udyami'
import Navbar from '../components/Layout/Navbar'
import CommunityCalendar from '../components/Udyami/CommunityCalendar'
import EventFormDialog, { PLATFORM_LABEL } from '../components/Udyami/EventFormDialog'
import { downloadIcs, formatWhen, isLiveSoon, localTimezone } from '../components/Udyami/eventTime'
import { useToast } from '../components/shared/Toast'
import { useAuthStore } from '../store/authStore'

const SCOPES: { id: EventListScope; label: string; adminOnly?: boolean }[] = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'past', label: 'Past' },
  { id: 'mine', label: 'Mine' },
  { id: 'pending', label: 'To review', adminOnly: true },
]

const EMPTY: Record<EventListScope, string> = {
  upcoming: 'No online events coming up yet.',
  past: 'No past events yet.',
  mine: "You haven't created an event yet.",
  pending: 'Nothing waiting for review.',
}

/** The wash behind an event with no cover picture. */
function eventGradient(id: number): string {
  const hues = [200, 205, 210, 195, 215, 190]
  const h = hues[id % hues.length] ?? 205
  return `linear-gradient(135deg, hsl(${h} 46% 26%) 0%, hsl(${h} 50% 14%) 100%)`
}

function daysUntil(iso: string): number {
  return Math.ceil((Date.parse(iso) - Date.now()) / 86_400_000)
}

const BTN = 'inline-flex items-center gap-1.5 rounded-[10px] border border-edge bg-surface-card px-3 py-1.5 text-caption font-semibold text-content hover:bg-surface-hover'
const BTN_PRIMARY = 'inline-flex items-center gap-1.5 rounded-[10px] bg-accent px-3 py-1.5 text-caption font-semibold text-accent-text hover:opacity-90'

/**
 * Events: Udyami Manch's online events (webinars, workshops, networking).
 * Every time shows in the viewer's own timezone, with the host's beside it.
 */
export default function EventsPage() {
  const toast = useToast()
  const isAdmin = useAuthStore(s => s.user?.role === 'admin')
  const signedIn = useAuthStore(s => !!s.user)
  const [scope, setScope] = useState<EventListScope>('upcoming')
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [events, setEvents] = useState<UdyamiEvent[] | null>(null)
  const [next, setNext] = useState<UdyamiEvent | null>(null)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<UdyamiEvent | null>(null)
  const tz = localTimezone()
  const [params, setParams] = useSearchParams()

  // The phone dock's "+" opens the event form here.
  useEffect(() => {
    if (params.get('create') === '1') {
      setCreating(true)
      setParams(prev => { const next = new URLSearchParams(prev); next.delete('create'); return next }, { replace: true })
    }
  }, [params, setParams])

  const load = useCallback(async () => {
    try { setEvents((await eventsApi.list(scope)).events) } catch { setEvents([]); toast.error('Could not load events') }
  }, [scope, toast])
  useEffect(() => { setEvents(null); load() }, [load])
  // The hero is always the next approved event, whichever tab the grid is on.
  useEffect(() => { eventsApi.list('upcoming').then(r => setNext(r.events.find(e => e.status === 'approved') ?? null)).catch(() => setNext(null)) }, [events])

  const replace = (ev: UdyamiEvent) => setEvents(list => list?.map(x => (x.id === ev.id ? ev : x)) ?? null)
  const toggleGoing = async (ev: UdyamiEvent) => {
    try {
      const { event } = ev.is_going ? await eventsApi.unrsvp(ev.id) : await eventsApi.rsvp(ev.id)
      replace(event)
      if (event.is_going) toast.success("You're registered. The meeting link is now on the event.")
    } catch { toast.error('Could not update your registration') }
  }
  const remove = async (ev: UdyamiEvent) => {
    if (!window.confirm(`Delete "${ev.title}"?`)) return
    try { await eventsApi.remove(ev.id); setEvents(list => list?.filter(x => x.id !== ev.id) ?? null) } catch { toast.error('Could not delete the event') }
  }
  const review = async (ev: UdyamiEvent, status: 'approved' | 'rejected') => {
    try { await eventsApi.setStatus(ev.id, status); setEvents(list => list?.filter(x => x.id !== ev.id) ?? null); toast.success(status === 'approved' ? 'Approved and listed' : 'Rejected') } catch { toast.error('Could not update the event') }
  }

  const registered = (ev: UdyamiEvent) => ev.is_going
  const heroDays = next ? daysUntil(next.starts_at) : 0

  return (
    <div className="min-h-screen bg-surface-secondary">
      <Navbar />
      <main className={`mx-auto w-full px-4 pb-[120px] md:px-[35px] md:pb-12 ${view === 'calendar' ? 'max-w-[1500px]' : 'max-w-[1800px]'}`} style={{ paddingTop: 'calc(var(--nav-h) + 28px)' }}>
        {view === 'list' && (
          <section className="relative mb-10 flex min-h-[310px] flex-col justify-end overflow-hidden rounded-[28px] p-6 text-white shadow-elevated md:p-9" style={{ background: next?.cover_url ? undefined : next ? eventGradient(next.id) : 'linear-gradient(135deg, #1F4455 0%, #0B1A21 100%)' }}>{/* theme-lint-disable: hero over a photo */}
            {next?.cover_url && <img src={next.cover_url} alt="" className="absolute inset-0 h-full w-full object-cover" />}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,.66) 0%, rgba(0,0,0,.15) 70%)' }} />{/* theme-lint-disable: scrim */}
            <div className="relative flex flex-wrap items-end gap-5">
              <div className="min-w-0 flex-1">
                <div className="mb-3 text-[11px] font-bold uppercase tracking-[.16em] opacity-80">{next ? 'Next event' : 'Online events'}</div>
                <h1 className="m-0 text-[34px] font-bold leading-[1.05] md:text-[52px]">{next ? next.title : 'Meet the community online'}</h1>
                <p className="m-0 mt-2 max-w-[640px] text-[15px] opacity-90 md:text-[17px]">
                  {next
                    ? (next.description ? next.description.split('\n')[0]?.slice(0, 140) : `Hosted by ${next.organizer_name ?? 'Udyami Manch'}`)
                    : `Webinars, workshops and meetups for Nepali and Indian business owners. Times show in your timezone (${tz.replace(/_/g, ' ')}).`}
                </p>
                {next && (
                  <div className="mt-5 inline-flex flex-wrap items-stretch gap-x-6 gap-y-3 rounded-[18px] border border-white/25 bg-white/15 px-5 py-3 backdrop-blur-md">{/* theme-lint-disable: glass stats on the photo */}
                    <div><div className="text-[24px] font-bold leading-none">{next.going_count}</div><div className="mt-1 text-[10px] font-semibold uppercase tracking-[.1em] opacity-80">Registered</div></div>
                    <div><div className="text-[24px] font-bold leading-none">{heroDays <= 0 ? 'Today' : heroDays}</div><div className="mt-1 text-[10px] font-semibold uppercase tracking-[.1em] opacity-80">{heroDays <= 0 ? formatWhen(next.starts_at, { hour: 'numeric', minute: '2-digit' }) : heroDays === 1 ? 'Day to go' : 'Days to go'}</div></div>
                    <div><div className="text-[24px] font-bold leading-none">{PLATFORM_LABEL[next.platform]}</div><div className="mt-1 text-[10px] font-semibold uppercase tracking-[.1em] opacity-80">{formatWhen(next.starts_at, { day: 'numeric', month: 'short' })}</div></div>
                  </div>
                )}
              </div>
              {next && Date.parse(next.ends_at) > Date.now() ? (
                <button type="button" onClick={() => (!registered(next) ? toggleGoing(next) : downloadIcs(next))}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[15px] font-bold text-[#0B1A21] shadow-lg hover:opacity-90">{/* theme-lint-disable: button on the photo */}
                  {next && registered(next) ? <><Check size={16} /> Registered</> : <>Register <ChevronRight size={16} /></>}
                </button>
              ) : (
                <button type="button" onClick={() => setCreating(true)} className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[15px] font-bold text-[#0B1A21] shadow-lg hover:opacity-90">{/* theme-lint-disable: button on the photo */}
                  <Plus size={16} /> {isAdmin ? 'Create event' : 'Suggest an event'}
                </button>
              )}
            </div>
          </section>
        )}

        <div className="mb-5 flex flex-wrap items-center gap-3">
          <h2 className="m-0 me-auto text-[11px] font-bold uppercase tracking-[.14em] text-content-muted">{view === 'calendar' ? 'Community calendar' : 'All events'}</h2>
          <div className="flex items-center gap-1 rounded-full border border-edge bg-surface-card p-1" role="group" aria-label="View">
            <button type="button" onClick={() => setView('list')} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-caption font-semibold ${view === 'list' ? 'bg-accent text-accent-text' : 'text-content-secondary'}`}><List size={13} /> List</button>
            <button type="button" onClick={() => setView('calendar')} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-caption font-semibold ${view === 'calendar' ? 'bg-accent text-accent-text' : 'text-content-secondary'}`}><CalendarDays size={13} /> Calendar</button>
          </div>
          {view === 'list' && (
            <div className="flex items-center gap-1 rounded-full border border-edge bg-surface-card p-1">
              {SCOPES.filter(s => (!s.adminOnly || isAdmin) && (signedIn || s.id !== 'mine')).map(s => (
                <button key={s.id} type="button" onClick={() => setScope(s.id)}
                  className={`rounded-full px-3.5 py-1 text-caption font-semibold ${scope === s.id ? 'bg-accent text-accent-text' : 'text-content-secondary hover:bg-surface-hover'}`}>
                  {s.label}
                </button>
              ))}
            </div>
          )}
          {view === 'calendar' && (
            <button type="button" className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-caption font-semibold text-accent-text hover:opacity-90" onClick={() => setCreating(true)}>
              <Plus size={14} strokeWidth={2.4} /> {isAdmin ? 'Create event' : 'Suggest an event'}
            </button>
          )}
        </div>

        {view === 'calendar' && <CommunityCalendar />}

        <div className={view === 'list' ? 'grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3' : 'hidden'}>
          {events?.map(ev => {
            const start = new Date(ev.starts_at)
            const past = Date.parse(ev.ends_at) < Date.now()
            const hostDiffers = ev.host_timezone !== tz
            const canChange = ev.is_mine || isAdmin
            const days = daysUntil(ev.starts_at)
            return (
              <article key={ev.id} className="flex min-w-0 flex-col overflow-hidden rounded-[20px] border border-edge bg-surface-card shadow-card transition-shadow hover:shadow-elevated">
                <div className="relative h-[200px] flex-none">
                  {ev.cover_url
                    ? <img src={ev.cover_url} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                    : <div className="absolute inset-0" style={{ background: eventGradient(ev.id) }} />}
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,.55) 0%, rgba(0,0,0,0) 60%)' }} />{/* theme-lint-disable: scrim */}
                  <span className="absolute start-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-sm">{/* theme-lint-disable: badge on the photo */}
                    <CalendarDays size={12} />{start.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <span className="absolute end-3 top-3 rounded-full bg-black/55 px-3 py-1 text-[10.5px] font-bold uppercase tracking-[.08em] text-white">{/* theme-lint-disable: badge on the photo */}
                    {ev.status === 'pending' ? 'In review' : ev.status === 'rejected' ? 'Not approved' : past ? 'Past' : isLiveSoon(ev) ? 'Live now' : days <= 0 ? 'Today' : `In ${days} ${days === 1 ? 'day' : 'days'}`}
                  </span>
                  <h3 className="absolute inset-x-4 bottom-3 m-0 text-[20px] font-bold leading-tight text-white [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden">{ev.title}</h3>{/* theme-lint-disable: title over the photo */}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
                  <div className="flex flex-wrap items-center gap-x-2 text-[11px] font-semibold uppercase tracking-[.06em] text-content-muted">
                    <span>{ev.category}</span><span>·</span>
                    <span className="inline-flex items-center gap-1"><Video size={12} />{PLATFORM_LABEL[ev.platform]}</span>
                  </div>
                  <div className="flex flex-col gap-1 text-caption text-content-secondary">
                    <span className="inline-flex items-center gap-1.5"><Clock size={13} className="flex-none" />
                      {formatWhen(ev.starts_at, { weekday: 'short', hour: 'numeric', minute: '2-digit' })}
                      {' – '}{formatWhen(ev.ends_at, { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })}
                    </span>
                    {hostDiffers && (
                      <span className="text-content-muted">Host time: {formatWhen(ev.starts_at, { hour: 'numeric', minute: '2-digit', weekday: 'short' }, ev.host_timezone)} ({ev.host_timezone.replace(/_/g, ' ')})</span>
                    )}
                    <span className="inline-flex items-center gap-1.5"><Users size={13} className="flex-none" />{ev.going_count} registered{ev.organizer_name ? ` · Hosted by ${ev.organizer_name}` : ''}</span>
                  </div>
                  {ev.description && <p className="m-0 line-clamp-2 whitespace-pre-line text-caption text-content-muted">{ev.description}</p>}
                  <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-edge-faint pt-3">
                    {ev.status === 'approved' && !past && (
                      <button type="button" className={ev.is_going ? BTN : BTN_PRIMARY} onClick={() => toggleGoing(ev)}>
                        {ev.is_going ? <><Check size={14} /> Registered</> : 'Register'}
                      </button>
                    )}
                    {ev.join_url && !past && (
                      <a className={isLiveSoon(ev) ? BTN_PRIMARY : BTN} href={ev.join_url} target="_blank" rel="noopener noreferrer"><Video size={14} /> Join</a>
                    )}
                    {(ev.is_going || ev.is_mine) && !past && (
                      <button type="button" className={BTN} onClick={() => downloadIcs(ev)} aria-label="Add to calendar" title="Add to calendar"><CalendarPlus size={14} /></button>
                    )}
                    <span className="flex-1" />
                    {isAdmin && ev.status === 'pending' && (
                      <>
                        <button type="button" className={BTN} onClick={() => review(ev, 'approved')}><Check size={14} /> Approve</button>
                        <button type="button" className={BTN} onClick={() => review(ev, 'rejected')}><X size={14} /></button>
                      </>
                    )}
                    {canChange && <button type="button" className={BTN} onClick={() => setEditing(ev)} aria-label="Edit event"><Pencil size={14} /></button>}
                    {canChange && <button type="button" className={`${BTN} text-danger`} onClick={() => remove(ev)} aria-label="Delete event"><Trash2 size={14} /></button>}
                  </div>
                </div>
              </article>
            )
          })}
          {events !== null && scope === 'upcoming' && (
            <button type="button" onClick={() => setCreating(true)} className="flex min-h-[260px] flex-col items-center justify-center gap-3 rounded-[20px] border border-dashed border-edge bg-transparent p-6 text-center hover:bg-surface-hover">
              <span className="grid h-12 w-12 place-items-center rounded-full" style={{ background: 'var(--accent)', color: '#fff' }}><Plus size={22} /></span>
              <span className="text-[15px] font-semibold text-content">{isAdmin ? 'Create event' : 'Suggest an event'}</span>
              <span className="text-caption text-content-muted">Webinar, workshop or meetup, online</span>
            </button>
          )}
        </div>

        {view === 'list' && events !== null && events.length === 0 && scope !== 'upcoming' && (
          <div className="flex flex-col items-center gap-2 rounded-[20px] border border-dashed border-edge bg-surface-card px-6 py-14 text-center">
            <CalendarDays size={30} className="text-content-faint" />
            <p className="m-0 text-body text-content-secondary">{EMPTY[scope]}</p>
          </div>
        )}
      </main>
      {creating && <EventFormDialog onClose={() => setCreating(false)} onSaved={load} />}
      {editing && <EventFormDialog event={editing} onClose={() => setEditing(null)} onSaved={load} />}
    </div>
  )
}
