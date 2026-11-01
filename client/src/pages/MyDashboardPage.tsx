import { Bookmark, Briefcase, CalendarDays, Clock, LayoutDashboard, Plus, Store, Video } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { businessPath, type Business, type UdyamiEvent } from '@trek/shared'
import { businessesApi, eventsApi } from '../api/udyami'
import PageShell from '../components/Layout/PageShell'
import PageSidebar, { type PageSidebarTab } from '../components/Layout/PageSidebar'
import { SettingsHeader } from '../components/Settings/settingsKit'
import { useToast } from '../components/shared/Toast'
import BusinessCard from '../components/Udyami/BusinessCard'
import BusinessDetailDialog from '../components/Udyami/BusinessDetailDialog'
import BusinessFormDialog from '../components/Udyami/BusinessFormDialog'
import EventFormDialog from '../components/Udyami/EventFormDialog'
import { formatWhen } from '../components/Udyami/eventTime'
import { useAuthStore } from '../store/authStore'
import AdminStatCard from './admin/AdminStatCard'

const STATUS: Record<string, string> = { pending: 'In review', approved: 'Live', rejected: 'Not approved' }
const CARD = 'rounded-[16px] border border-edge bg-surface-card p-5 shadow-sm'
const PRIMARY = 'inline-flex items-center gap-1.5 rounded-[10px] bg-accent px-4 py-2 text-caption font-semibold text-accent-text hover:opacity-90'

const TABS: PageSidebarTab[] = [
  { id: 'businesses', label: 'My businesses', icon: Store },
  { id: 'events', label: 'My events', icon: CalendarDays },
  { id: 'saved', label: 'Saved', icon: Bookmark },
]

/**
 * Everyone's own dashboard, built like the admin panel: the same header with counts and
 * the same side menu, holding only what an owner needs. Businesses, events, saved listings.
 */
export default function MyDashboardPage() {
  const toast = useToast()
  // Held in a ref so a toast object that changes between renders cannot restart the load.
  const toastRef = useRef(toast)
  toastRef.current = toast
  const user = useAuthStore(s => s.user)
  const [tab, setTab] = useState('businesses')
  const [mine, setMine] = useState<Business[] | null>(null)
  const [saved, setSaved] = useState<Business[] | null>(null)
  const [myEvents, setMyEvents] = useState<UdyamiEvent[] | null>(null)
  const [going, setGoing] = useState<UdyamiEvent[] | null>(null)
  const [open, setOpen] = useState<Business | null>(null)
  const [editing, setEditing] = useState<Business | null>(null)
  const [adding, setAdding] = useState(false)
  const [addingEvent, setAddingEvent] = useState(false)

  const load = useCallback(async () => {
    try {
      const [m, s, e, up] = await Promise.all([businessesApi.list({ scope: 'mine' }), businessesApi.list({ scope: 'saved' }), eventsApi.list('mine'), eventsApi.list('upcoming')])
      setMine(m.businesses); setSaved(s.businesses); setMyEvents(e.events); setGoing(up.events.filter(x => x.is_going))
    } catch { setMine([]); setSaved([]); setMyEvents([]); setGoing([]); toastRef.current.error('Could not load your dashboard') }
  }, [])
  useEffect(() => { void load() }, [load])

  const toggleSave = async (b: Business) => {
    try { if (b.saved) await businessesApi.unsave(b.id); else await businessesApi.save(b.id); await load(); setOpen(o => (o?.id === b.id ? { ...o, saved: !b.saved } : o)) } catch { toastRef.current.error('Could not update saved businesses') }
  }
  const remove = async (b: Business) => {
    if (!window.confirm(`Delete "${b.name}" from the directory?`)) return
    try { await businessesApi.remove(b.id); setOpen(null); await load() } catch { toastRef.current.error('Could not delete the listing') }
  }

  const empty = (icon: React.ReactNode, text: React.ReactNode) => (
    <div className="flex flex-col items-center gap-2 rounded-[14px] border border-dashed border-edge px-6 py-10 text-center">
      {icon}<p className="m-0 text-body text-content-secondary">{text}</p>
    </div>
  )

  return (
    <PageShell background="var(--bg-primary)">
      <div className="w-full px-4 py-6 sm:px-6 lg:px-8">
        <SettingsHeader
          icon={LayoutDashboard}
          title="My dashboard"
          subtitle={`${user?.username ?? ''}. Your businesses, events and saved listings.`}
          actions={(
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <AdminStatCard label="Businesses" value={mine?.length ?? 0} icon={Briefcase} />
              <AdminStatCard label="In review" value={mine?.filter(b => b.status === 'pending').length ?? 0} icon={Clock} />
              <AdminStatCard label="Saved" value={saved?.length ?? 0} icon={Bookmark} />
              <AdminStatCard label="Registered" value={going?.length ?? 0} icon={CalendarDays} />
            </div>
          )}
        />

        <PageSidebar sidebarLabel="MY DASHBOARD" tabs={TABS} activeTab={tab} onTabChange={setTab} footer="">
          {tab === 'businesses' && (
            <div className={CARD}>
              <div className="mb-4 flex items-center gap-3">
                <h3 className="m-0 flex-1 text-subtitle font-semibold text-content">My businesses</h3>
                <button type="button" className={PRIMARY} onClick={() => setAdding(true)}><Plus size={14} /> Add business</button>
              </div>
              <p className="m-0 mb-4 text-caption text-content-muted">New listings and edits are reviewed before they appear in the directory.</p>
              {mine !== null && mine.length === 0 && empty(<Store size={26} className="text-content-faint" />, 'You have not listed a business yet.')}
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {mine?.map(b => <BusinessCard key={b.id} business={b} onOpen={() => setOpen(b)} onToggleSave={() => toggleSave(b)} />)}
              </div>
            </div>
          )}

          {tab === 'events' && (
            <div className="flex flex-col gap-5">
              <div className={CARD}>
                <div className="mb-4 flex items-center gap-3">
                  <h3 className="m-0 flex-1 text-subtitle font-semibold text-content">Events I suggested</h3>
                  <button type="button" className={PRIMARY} onClick={() => setAddingEvent(true)}><Plus size={14} /> Suggest an event</button>
                </div>
                {myEvents !== null && myEvents.length === 0 && empty(<Video size={26} className="text-content-faint" />, 'You have not suggested an event yet.')}
                <ul className="m-0 flex list-none flex-col gap-2 p-0">
                  {myEvents?.map(ev => (
                    <li key={ev.id} className="flex flex-wrap items-center gap-3 rounded-[12px] border border-edge-faint px-3 py-2">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-body font-semibold text-content">{ev.title}</div>
                        <div className="text-caption text-content-muted">{formatWhen(ev.starts_at, { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })} · {ev.going_count} registered</div>
                      </div>
                      <span className="rounded-full bg-accent-subtle px-2.5 py-[2px] text-[11px] font-semibold text-accent-on">{STATUS[ev.status] ?? ev.status}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className={CARD}>
                <h3 className="m-0 mb-4 text-subtitle font-semibold text-content">Events I registered for</h3>
                {going !== null && going.length === 0 && empty(<CalendarDays size={26} className="text-content-faint" />, <>Nothing yet. <Link to="/vacay" className="text-accent-on">See upcoming events</Link>.</>)}
                <ul className="m-0 flex list-none flex-col gap-2 p-0">
                  {going?.map(ev => (
                    <li key={ev.id} className="flex flex-wrap items-center gap-3 rounded-[12px] border border-edge-faint px-3 py-2">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-body font-semibold text-content">{ev.title}</div>
                        <div className="text-caption text-content-muted">{formatWhen(ev.starts_at, { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })}</div>
                      </div>
                      {ev.join_url && <a href={ev.join_url} target="_blank" rel="noopener noreferrer" className="rounded-full bg-accent px-3 py-1 text-caption font-semibold text-accent-text no-underline">Join</a>}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {tab === 'saved' && (
            <div className={CARD}>
              <h3 className="m-0 mb-4 text-subtitle font-semibold text-content">Saved businesses</h3>
              {saved !== null && saved.length === 0 && empty(<Bookmark size={26} className="text-content-faint" />, 'Tap the bookmark on a business to save it here.')}
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {saved?.map(b => <BusinessCard key={b.id} business={b} onOpen={() => { window.location.assign(businessPath(b)) }} onToggleSave={() => toggleSave(b)} />)}
              </div>
            </div>
          )}
        </PageSidebar>
      </div>

      {open && (
        <BusinessDetailDialog
          business={open}
          onClose={() => setOpen(null)}
          onToggleSave={() => toggleSave(open)}
          onEdit={() => { setEditing(open); setOpen(null) }}
          onDelete={() => remove(open)}
          onReview={() => {}}
        />
      )}
      {editing && <BusinessFormDialog business={editing} onClose={() => setEditing(null)} onSaved={() => void load()} />}
      {adding && <BusinessFormDialog onClose={() => setAdding(false)} onSaved={() => void load()} />}
      {addingEvent && <EventFormDialog onClose={() => setAddingEvent(false)} onSaved={() => void load()} />}
    </PageShell>
  )
}
