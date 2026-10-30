import { Calendar, Clock, Video } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import type { UdyamiEvent } from '@trek/shared'
import { eventsApi } from '../../api/udyami'
import { PLATFORM_LABEL } from './EventFormDialog'
import { formatWhen } from './eventTime'

/**
 * The bottom card of Home, the way the original listed upcoming reservations: the
 * next online events, a date block, the title and time, and the platform at the end.
 * Times show in the reader's own timezone.
 */
export default function UpcomingEvents() {
  const navigate = useNavigate()
  const [events, setEvents] = useState<UdyamiEvent[] | null>(null)

  useEffect(() => {
    let alive = true
    eventsApi.list('upcoming').then(r => { if (alive) setEvents(r.events.slice(0, 6)) }).catch(() => { if (alive) setEvents([]) })
    return () => { alive = false }
  }, [])

  if (events === null) return null
  return (
    <div className="tool" style={{ marginTop: 40 }}>
      <div className="tool-head">
        <div className="tool-title"><Calendar size={14} /> Upcoming online events</div>
      </div>
      {events.length === 0 ? (
        <div style={{ fontSize: 'calc(13px * var(--fs-scale-body, 1))', color: 'var(--ink-3)' }}>No online events coming up yet.</div>
      ) : (
        <div className="upc-list">
          {events.map(ev => (
            <div
              className="upc-item"
              key={ev.id}
              onClick={() => navigate('/vacay')}
              role="button"
              data-no-press
              tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/vacay') } }}
            >
              <div className="upc-date">
                <div className="d mono">{formatWhen(ev.starts_at, { day: 'numeric' })}</div>
                <div className="m">{formatWhen(ev.starts_at, { month: 'short' })}</div>
              </div>
              <div className="upc-info">
                <div className="t">{ev.title}</div>
                <div className="s"><Clock size={11} /> {formatWhen(ev.starts_at, { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })} · {PLATFORM_LABEL[ev.platform]}</div>
              </div>
              <div className="upc-type other"><Video size={16} /></div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
