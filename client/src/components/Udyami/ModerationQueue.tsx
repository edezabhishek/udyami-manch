import { Check, Inbox, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { businessPath, type Business, type UdyamiEvent } from '@trek/shared'
import { businessesApi, COMMUNITY_LABEL, eventsApi } from '../../api/udyami'
import { formatWhen } from './eventTime'
import { useToast } from '../shared/Toast'

const CARD = 'rounded-[16px] border border-edge bg-surface-card p-5 shadow-sm'
const BTN = 'inline-flex items-center gap-1.5 rounded-[10px] border border-edge bg-surface-card px-3 py-1.5 text-caption font-semibold text-content hover:bg-surface-hover'

/** Admin: everything waiting for a decision, in one place. */
export default function ModerationQueue() {
  const toast = useToast()
  // Held in a ref so a toast object that changes between renders cannot restart the load.
  const toastRef = useRef(toast)
  toastRef.current = toast
  const [businesses, setBusinesses] = useState<Business[] | null>(null)
  const [events, setEvents] = useState<UdyamiEvent[] | null>(null)

  const load = useCallback(async () => {
    try {
      const [b, e] = await Promise.all([businessesApi.list({ scope: 'pending' }), eventsApi.list('pending')])
      setBusinesses(b.businesses)
      setEvents(e.events)
    } catch { setBusinesses([]); setEvents([]); toastRef.current.error('Could not load the review queue') }
  }, [])
  useEffect(() => { void load() }, [load])

  const decideBusiness = async (b: Business, status: 'approved' | 'rejected') => {
    try { await businessesApi.setStatus(b.id, status); setBusinesses(l => l?.filter(x => x.id !== b.id) ?? null); toast.success(status === 'approved' ? 'Listed' : 'Rejected') } catch { toast.error('Could not update the listing') }
  }
  const decideEvent = async (ev: UdyamiEvent, status: 'approved' | 'rejected') => {
    try { await eventsApi.setStatus(ev.id, status); setEvents(l => l?.filter(x => x.id !== ev.id) ?? null); toast.success(status === 'approved' ? 'Event listed' : 'Rejected') } catch { toast.error('Could not update the event') }
  }

  const waiting = (businesses?.length ?? 0) + (events?.length ?? 0)
  return (
    <div className={CARD}>
      <div className="mb-1 flex items-center gap-2">
        <Inbox size={18} className="text-accent" />
        <h3 className="m-0 text-subtitle font-semibold text-content">Waiting for review</h3>
        {businesses !== null && <span className="rounded-full bg-accent-subtle px-2 py-[1px] text-caption font-semibold text-accent-on">{waiting}</span>}
      </div>
      <p className="m-0 mb-4 text-caption text-content-muted">New and edited businesses and events stay hidden until you approve them.</p>
      {businesses !== null && waiting === 0 && <p className="m-0 text-body text-content-muted">Nothing is waiting. You are all caught up.</p>}

      {(businesses?.length ?? 0) > 0 && (
        <>
          <div className="mb-2 text-caption font-semibold uppercase tracking-[.08em] text-content-muted">Businesses</div>
          <ul className="m-0 mb-4 flex list-none flex-col gap-2 p-0">
            {businesses!.map(b => (
              <li key={b.id} className="flex flex-wrap items-center gap-3 rounded-[12px] border border-edge-faint px-3 py-2">
                <div className="min-w-0 flex-1">
                  <Link to={businessPath(b)} className="truncate text-body font-semibold text-content no-underline hover:underline">{b.name}</Link>
                  <div className="truncate text-caption text-content-muted">{b.category} · {b.city}, {b.country} · {COMMUNITY_LABEL[b.community]}{b.phone ? ` · ${b.phone}` : ''}</div>
                </div>
                <button type="button" className={BTN} onClick={() => decideBusiness(b, 'approved')}><Check size={14} /> Approve</button>
                <button type="button" className={BTN} onClick={() => decideBusiness(b, 'rejected')}><X size={14} /> Reject</button>
              </li>
            ))}
          </ul>
        </>
      )}

      {(events?.length ?? 0) > 0 && (
        <>
          <div className="mb-2 text-caption font-semibold uppercase tracking-[.08em] text-content-muted">Events</div>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {events!.map(ev => (
              <li key={ev.id} className="flex flex-wrap items-center gap-3 rounded-[12px] border border-edge-faint px-3 py-2">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-body font-semibold text-content">{ev.title}</div>
                  <div className="truncate text-caption text-content-muted">{formatWhen(ev.starts_at, { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })} · {ev.category}{ev.organizer_name ? ` · by ${ev.organizer_name}` : ''}</div>
                </div>
                <button type="button" className={BTN} onClick={() => decideEvent(ev, 'approved')}><Check size={14} /> Approve</button>
                <button type="button" className={BTN} onClick={() => decideEvent(ev, 'rejected')}><X size={14} /> Reject</button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
