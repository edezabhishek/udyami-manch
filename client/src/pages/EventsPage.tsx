import { CalendarDays, CalendarPlus, Check, Clock, List, Pencil, Plus, Trash2, Users, Video, X } from 'lucide-react'
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

  return (
    <div className="min-h-screen bg-surface-secondary">
      <Navbar />
      <main className={`mx-auto w-full px-4 pb-[120px] pt-6 md:pb-12 ${view === 'calendar' ? 'max-w-[1280px]' : 'max-w-[960px]'}`} style={{ paddingTop: 'calc(var(--nav-h) + 24px)' }}>
        <div className="mb-5 flex flex-wrap items-end gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="m-0 text-title font-bold text-content">Online events</h1>
            <p className="m-0 mt-1 text-body text-content-muted">Webinars, workshops and meetups for Nepali and Indian business owners. Times are in your timezone ({tz.replace(/_/g, ' ')}).</p>
          </div>
          <button type="button" className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-body font-semibold text-accent-text shadow-card hover:opacity-90" onClick={() => setCreating(true)}>
            <Plus size={16} strokeWidth={2.4} /> {isAdmin ? 'Create event' : 'Suggest an event'}
          </button>
        </div>

        <div className="mb-5 flex flex-wrap items-center gap-2">
          <div className="me-2 flex items-center gap-1 rounded-full border border-edge bg-surface-card p-1" role="group" aria-label="View">
            <button type="button" onClick={() => setView('list')} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-caption font-semibold ${view === 'list' ? 'bg-accent text-accent-text' : 'text-content-secondary'}`}><List size={13} /> List</button>
            <button type="button" onClick={() => setView('calendar')} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-caption font-semibold ${view === 'calendar' ? 'bg-accent text-accent-text' : 'text-content-secondary'}`}><CalendarDays size={13} /> Calendar</button>
          </div>
          {view === 'list' && SCOPES.filter(s => (!s.adminOnly || isAdmin) && (signedIn || s.id !== 'mine')).map(s => (
            <button key={s.id} type="button" onClick={() => setScope(s.id)}
              className={`rounded-full px-4 py-1.5 text-caption font-semibold ${scope === s.id ? 'bg-accent text-accent-text' : 'border border-edge bg-surface-card text-content-secondary hover:bg-surface-hover'}`}>
              {s.label}
            </button>
          ))}
        </div>

        {view === 'calendar' && <CommunityCalendar />}

        {view === 'list' && events !== null && events.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-[20px] border border-dashed border-edge bg-surface-card px-6 py-14 text-center">
            <CalendarDays size={30} className="text-content-faint" />
            <p className="m-0 text-body text-content-secondary">{EMPTY[scope]}</p>
          </div>
        )}

        <div className={view === 'list' ? 'flex flex-col gap-4' : 'hidden'}>
          {events?.map(ev => {
            const start = new Date(ev.starts_at)
            const past = Date.parse(ev.ends_at) < Date.now()
            const hostDiffers = ev.host_timezone !== tz
            const canChange = ev.is_mine || isAdmin
            return (
              <article key={ev.id} className="flex flex-col overflow-hidden rounded-[20px] border border-edge bg-surface-card shadow-card sm:flex-row">
                {ev.cover_url
                  ? <img src={ev.cover_url} alt="" className="h-[140px] w-full flex-none object-cover sm:h-auto sm:w-[200px]" />
                  : (
                    <div className="flex h-[110px] w-full flex-none flex-col items-center justify-center text-white sm:h-auto sm:w-[150px]" style={{ background: 'linear-gradient(135deg, #1F4455 0%, #0B1A21 100%)' }}>
                      <div className="text-[13px] font-semibold uppercase tracking-[.12em] opacity-80">{formatWhen(ev.starts_at, { month: 'short' })}</div>
                      <div className="text-[40px] font-bold leading-none">{start.toLocaleDateString(undefined, { day: 'numeric' })}</div>
                      <div className="mt-1 text-[12px] opacity-80">{formatWhen(ev.starts_at, { weekday: 'long' })}</div>
                    </div>
                  )}
                <div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[.06em] text-content-muted">
                    <span>{ev.category}</span><span>·</span>
                    <span className="inline-flex items-center gap-1"><Video size={12} />{PLATFORM_LABEL[ev.platform]}</span>
                    {ev.status === 'pending' && <span className="rounded-full bg-warning-soft px-2 py-[1px] normal-case tracking-normal text-warning">In review</span>}
                    {ev.status === 'rejected' && <span className="rounded-full bg-danger-soft px-2 py-[1px] normal-case tracking-normal text-danger">Not approved</span>}
                    {!past && isLiveSoon(ev) && <span className="rounded-full bg-danger px-2 py-[1px] normal-case tracking-normal text-white">Live now</span>}
                  </div>
                  <h2 className="m-0 text-subtitle font-semibold text-content">{ev.title}</h2>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-content-secondary">
                    <span className="inline-flex items-center gap-1"><Clock size={13} />
                      {formatWhen(ev.starts_at, { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
                      {' – '}{formatWhen(ev.ends_at, { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })}
                    </span>
                    {hostDiffers && (
                      <span className="text-content-muted">Host time: {formatWhen(ev.starts_at, { hour: 'numeric', minute: '2-digit', weekday: 'short' }, ev.host_timezone)} ({ev.host_timezone.replace(/_/g, ' ')})</span>
                    )}
                    <span className="inline-flex items-center gap-1"><Users size={13} />{ev.going_count} registered</span>
                  </div>
                  {ev.description && <p className="m-0 line-clamp-3 whitespace-pre-line text-body text-content-secondary">{ev.description}</p>}
                  {ev.organizer_name && <div className="text-caption text-content-muted">Hosted by {ev.organizer_name}</div>}
                  <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
                    {ev.status === 'approved' && !past && (
                      <button type="button" className={ev.is_going ? BTN : BTN_PRIMARY} onClick={() => toggleGoing(ev)}>
                        {ev.is_going ? <><Check size={14} /> Registered</> : 'Register'}
                      </button>
                    )}
                    {ev.join_url && !past && (
                      <a className={isLiveSoon(ev) ? BTN_PRIMARY : BTN} href={ev.join_url} target="_blank" rel="noopener noreferrer"><Video size={14} /> Join</a>
                    )}
                    {(ev.is_going || ev.is_mine) && !past && (
                      <button type="button" className={BTN} onClick={() => downloadIcs(ev)}><CalendarPlus size={14} /> Add to calendar</button>
                    )}
                    <span className="flex-1" />
                    {isAdmin && ev.status === 'pending' && (
                      <>
                        <button type="button" className={BTN} onClick={() => review(ev, 'approved')}><Check size={14} /> Approve</button>
                        <button type="button" className={BTN} onClick={() => review(ev, 'rejected')}><X size={14} /> Reject</button>
                      </>
                    )}
                    {canChange && <button type="button" className={BTN} onClick={() => setEditing(ev)} aria-label="Edit event"><Pencil size={14} /></button>}
                    {canChange && <button type="button" className={`${BTN} text-danger`} onClick={() => remove(ev)} aria-label="Delete event"><Trash2 size={14} /></button>}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </main>
      {creating && <EventFormDialog onClose={() => setCreating(false)} onSaved={load} />}
      {editing && <EventFormDialog event={editing} onClose={() => setEditing(null)} onSaved={load} />}
    </div>
  )
}
