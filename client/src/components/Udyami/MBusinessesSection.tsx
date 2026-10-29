import { Plus, Search, Store, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import type { Business, BusinessListScope } from '@trek/shared'
import { businessesApi } from '../../api/udyami'
import { useAuthStore } from '../../store/authStore'
import { useToast } from '../shared/Toast'
import BusinessCard from './BusinessCard'
import BusinessDetailDialog from './BusinessDetailDialog'
import BusinessFormDialog from './BusinessFormDialog'

const SCOPES: { id: BusinessListScope; label: string; adminOnly?: boolean }[] = [
  { id: 'all', label: 'All' },
  { id: 'mine', label: 'Mine' },
  { id: 'saved', label: 'Saved' },
  { id: 'pending', label: 'To review', adminOnly: true },
]

/** Phone version of the directory on Home. The dock's "+" opens the add form via ?addBusiness=1. */
export default function MBusinessesSection() {
  const toast = useToast()
  const isAdmin = useAuthStore(s => s.user?.role === 'admin')
  const [params, setParams] = useSearchParams()
  const [scope, setScope] = useState<BusinessListScope>('all')
  const [query, setQuery] = useState('')
  const [businesses, setBusinesses] = useState<Business[] | null>(null)
  const [open, setOpen] = useState<Business | null>(null)
  const [editing, setEditing] = useState<Business | null>(null)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (params.get('addBusiness') === '1') {
      setAdding(true)
      setParams(prev => { const next = new URLSearchParams(prev); next.delete('addBusiness'); return next }, { replace: true })
    }
  }, [params, setParams])

  const load = useCallback(async () => {
    try {
      setBusinesses((await businessesApi.list({ scope, q: query.trim() || undefined })).businesses)
    } catch { setBusinesses([]) }
  }, [scope, query])

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
    } catch { toast.error('Could not update saved businesses') }
  }
  const remove = async (b: Business) => {
    if (!window.confirm(`Delete "${b.name}" from the directory?`)) return
    try { await businessesApi.remove(b.id); setOpen(null); load() } catch { toast.error('Could not delete the listing') }
  }
  const review = async (b: Business, status: 'approved' | 'rejected') => {
    try { await businessesApi.setStatus(b.id, status); setOpen(null); load() } catch { toast.error('Could not update the listing') }
  }

  return (
    <div className="mt-[14px]">
      <div className="flex items-center gap-2">
        <div className="text-[1.0625rem] font-bold text-m-ink">Businesses</div>
        <button type="button" onClick={() => setAdding(true)} className="ms-auto flex items-center gap-1 rounded-full bg-m-act px-3 py-[7px] text-[0.75rem] font-semibold text-m-actfg">
          <Plus size={13} strokeWidth={2.4} /> Add
        </button>
      </div>
      <label className="mt-[10px] flex items-center gap-2 rounded-full border border-[color:var(--m-gbr)] bg-[color:var(--m-glass)] px-3 py-[8px]">
        <Search size={14} className="text-m-muted" />
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search name, type, city or country"
          aria-label="Search businesses"
          className="min-w-0 flex-1 bg-transparent text-[0.8125rem] text-m-ink outline-none placeholder:text-m-faint"
        />
        {query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search"><X size={13} className="text-m-muted" /></button>}
      </label>
      <div className="m-hscroll mt-[10px] flex gap-[6px]">
        {SCOPES.filter(s => !s.adminOnly || isAdmin).map(s => (
          <button
            key={s.id}
            type="button"
            onClick={() => setScope(s.id)}
            className={`flex-none rounded-full px-3 py-[7px] text-[0.75rem] font-semibold ${scope === s.id ? 'bg-m-act text-m-actfg' : 'border border-[color:var(--m-gbr)] bg-[color:var(--m-glass)] text-m-muted'}`}
          >
            {s.label}
          </button>
        ))}
      </div>
      {businesses !== null && businesses.length === 0 && (
        <div className="mt-[10px] flex flex-col items-center gap-2 rounded-[20px] border border-[color:var(--m-gbr)] bg-[color:var(--m-glass)] px-4 py-8 text-center">
          <Store size={24} className="text-m-faint" />
          <div className="text-[0.8125rem] text-m-muted">{query ? `No businesses match "${query.trim()}".` : 'Nothing here yet.'}</div>
        </div>
      )}
      <div className="mt-[10px] flex flex-col gap-3">
        {businesses?.map(b => <BusinessCard key={b.id} business={b} onOpen={() => setOpen(b)} onToggleSave={() => toggleSave(b)} />)}
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
      {editing && <BusinessFormDialog business={editing} onClose={() => setEditing(null)} onSaved={load} />}
      {adding && <BusinessFormDialog onClose={() => setAdding(false)} onSaved={load} />}
    </div>
  )
}
