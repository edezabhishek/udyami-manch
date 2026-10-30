import { Bookmark, BookmarkCheck, LayoutGrid, List, Plus, Search, Store, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import type { Business, BusinessListScope } from '@trek/shared'
import { businessesApi, COMMUNITY_LABEL } from '../../api/udyami'
import { useAuthStore } from '../../store/authStore'
import { useToast } from '../shared/Toast'
import BusinessCard, { BusinessStatusPill, businessGradient } from './BusinessCard'
import BusinessDetailDialog from './BusinessDetailDialog'
import BusinessFormDialog from './BusinessFormDialog'

const SCOPES: { id: BusinessListScope; label: string; adminOnly?: boolean }[] = [
  { id: 'all', label: 'All' },
  { id: 'mine', label: 'Mine' },
  { id: 'saved', label: 'Saved' },
  { id: 'pending', label: 'To review', adminOnly: true },
]

const EMPTY_TEXT: Record<BusinessListScope, string> = {
  all: 'No businesses listed yet. Add the first one.',
  mine: "You haven't added a business yet.",
  saved: 'Save businesses to find them here quickly.',
  pending: 'Nothing waiting for review.',
}

/**
 * The directory on Home: All / Mine / Saved (and To review for admins), a
 * search box, and a grid of listings. Opens details, add and edit dialogs.
 */
export default function BusinessesSection({ addOpen, onAddClose, onChanged, onAdd }: {
  /** The "New" tile at the end of the grid; left out when nothing handles it. */
  onAdd?: () => void
  /** The page's "Add business" button sets this. */
  addOpen: boolean
  onAddClose: () => void
  /** Called after anything changes, so the stats row can refresh. */
  onChanged: () => void
}) {
  const toast = useToast()
  const isAdmin = useAuthStore(s => s.user?.role === 'admin')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const signedIn = useAuthStore(s => !!s.user)
  const [scope, setScope] = useState<BusinessListScope>('all')
  const [query, setQuery] = useState('')
  const [businesses, setBusinesses] = useState<Business[] | null>(null)
  const [open, setOpen] = useState<Business | null>(null)
  const [editing, setEditing] = useState<Business | null>(null)

  const load = useCallback(async () => {
    try {
      const { businesses: list } = await businessesApi.list({ scope, q: query.trim() || undefined })
      setBusinesses(list)
    } catch {
      setBusinesses([])
      toast.error('Could not load businesses')
    }
  }, [scope, query, toast])

  useEffect(() => {
    const timer = setTimeout(load, query ? 250 : 0)
    return () => clearTimeout(timer)
  }, [load, query])

  const replace = (b: Business) => {
    setBusinesses(list => list?.map(x => (x.id === b.id ? b : x)) ?? null)
    setOpen(o => (o && o.id === b.id ? b : o))
  }

  const toggleSave = async (b: Business) => {
    try {
      const { business } = b.saved ? await businessesApi.unsave(b.id) : await businessesApi.save(b.id)
      if (scope === 'saved' && !business.saved) setBusinesses(list => list?.filter(x => x.id !== b.id) ?? null)
      else replace(business)
      onChanged()
    } catch { toast.error('Could not update saved businesses') }
  }

  const remove = async (b: Business) => {
    if (!window.confirm(`Delete "${b.name}" from the directory?`)) return
    try {
      await businessesApi.remove(b.id)
      setBusinesses(list => list?.filter(x => x.id !== b.id) ?? null)
      setOpen(null)
      onChanged()
      toast.success('Listing deleted')
    } catch { toast.error('Could not delete the listing') }
  }

  const review = async (b: Business, status: 'approved' | 'rejected') => {
    try {
      const { business } = await businessesApi.setStatus(b.id, status)
      if (scope === 'pending') setBusinesses(list => list?.filter(x => x.id !== b.id) ?? null)
      else replace(business)
      setOpen(null)
      onChanged()
      toast.success(status === 'approved' ? 'Approved, now visible to everyone' : 'Rejected')
    } catch { toast.error('Could not update the listing') }
  }

  const afterSave = () => { load(); onChanged() }

  return (
    <section>
      <div className="sec-head">
        <h3 className="sec-title">Businesses</h3>
        <div className="sec-tools">
          <label className={`dash-search${query ? ' on' : ''}`}>
            <Search size={15} strokeWidth={2.2} aria-hidden />
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Escape') setQuery('') }}
              placeholder="Search name, type, city or country"
              aria-label="Search businesses"
            />
            {query && (
              <button type="button" className="dash-search-clear" onClick={() => setQuery('')} aria-label="Clear search">
                <X size={13} strokeWidth={2.4} />
              </button>
            )}
          </label>
          <div className="seg">
            {SCOPES.filter(s => (!s.adminOnly || isAdmin) && (signedIn || s.id === 'all')).map(s => (
              <button key={s.id} type="button" className={scope === s.id ? 'on' : ''} onClick={() => setScope(s.id)}>{s.label}</button>
            ))}
          </div>
          <div className="seg" role="group" aria-label="Layout">
            <button type="button" className={view === 'grid' ? 'on' : ''} onClick={() => setView('grid')} aria-label="Grid view" title="Grid view"><LayoutGrid size={15} /></button>
            <button type="button" className={view === 'list' ? 'on' : ''} onClick={() => setView('list')} aria-label="List view" title="List view"><List size={15} /></button>
          </div>
        </div>
      </div>

      {businesses !== null && businesses.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-[20px] border border-dashed border-edge px-6 py-12 text-center">
          <Store size={28} className="text-content-faint" />
          <p className="m-0 text-body text-content-secondary">{query ? `No businesses match "${query.trim()}".` : EMPTY_TEXT[scope]}</p>
        </div>
      )}

      {view === 'list' && (
        <div className="flex flex-col gap-2">
          {businesses?.map(b => (
            <div
              key={b.id}
              role="button"
              tabIndex={0}
              onClick={() => setOpen(b)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(b) } }}
              className="flex cursor-pointer items-center gap-3 rounded-[16px] border border-edge bg-surface-card p-2 pe-4 shadow-card transition-shadow hover:shadow-elevated"
            >
              <div className="h-14 w-20 flex-none overflow-hidden rounded-[12px]" style={b.photo_url ? undefined : { background: businessGradient(b.id) }}>
                {b.photo_url && <img src={b.photo_url} alt="" className="h-full w-full object-cover" loading="lazy" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[15px] font-semibold text-content">{b.name}</div>
                <div className="truncate text-caption text-content-muted">{b.category} · {b.city}, {b.country}</div>
              </div>
              <span className="hidden flex-none rounded-full bg-accent-subtle px-2.5 py-[3px] text-[10.5px] font-bold uppercase tracking-[.06em] text-accent-on sm:inline">{COMMUNITY_LABEL[b.community]}</span>
              <BusinessStatusPill status={b.status} />
              <button type="button" onClick={e => { e.stopPropagation(); void toggleSave(b) }} aria-label={b.saved ? 'Remove from saved' : 'Save business'} className="grid h-8 w-8 flex-none place-items-center rounded-full text-content-muted hover:bg-surface-hover">
                {b.saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
              </button>
            </div>
          ))}
        </div>
      )}
      <div className={view === 'list' ? 'hidden' : 'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3'}>
        {businesses?.map(b => (
          <BusinessCard key={b.id} business={b} onOpen={() => setOpen(b)} onToggleSave={() => toggleSave(b)} />
        ))}
        {onAdd && businesses !== null && scope === 'all' && !query && (
          <button type="button" onClick={onAdd} className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-[20px] border border-dashed border-edge bg-transparent p-6 text-center hover:bg-surface-hover">
            <span className="grid h-12 w-12 place-items-center rounded-full" style={{ background: "var(--accent)", color: "#fff" }}><Plus size={22} /></span>
            <span className="text-[15px] font-semibold text-content">Add business</span>
            <span className="text-caption text-content-muted">List a business in the directory</span>
          </button>
        )}
      </div>

      {open && (
        <BusinessDetailDialog
          business={open}
          onClose={() => setOpen(null)}
          onToggleSave={() => toggleSave(open)}
          onEdit={() => { setEditing(open); setOpen(null) }}
          onDelete={() => remove(open)}
          onReview={status => review(open, status)}
        />
      )}
      {editing && <BusinessFormDialog business={editing} onClose={() => setEditing(null)} onSaved={afterSave} />}
      {addOpen && <BusinessFormDialog onClose={onAddClose} onSaved={afterSave} />}
    </section>
  )
}
