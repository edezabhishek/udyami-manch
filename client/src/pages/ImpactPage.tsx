import { ChevronRight, HeartHandshake, MapPin, Plus, Users } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { IMPACT_CATEGORIES, type ImpactListScope, type ImpactStory } from '@trek/shared'
import { impactApi } from '../api/udyami'
import Navbar from '../components/Layout/Navbar'
import GuestNavbar from '../components/Layout/GuestNavbar'
import ImpactDetailDialog from '../components/Udyami/ImpactDetailDialog'
import ImpactFormDialog from '../components/Udyami/ImpactFormDialog'
import { impactGradient } from '../components/Udyami/impact'
import { useToast } from '../components/shared/Toast'
import { useAuthStore } from '../store/authStore'

const SCOPES: { id: ImpactListScope; label: string; adminOnly?: boolean; memberOnly?: boolean }[] = [
  { id: 'all', label: 'All' },
  { id: 'mine', label: 'Mine', memberOnly: true },
  { id: 'pending', label: 'To review', adminOnly: true },
]

const yearOf = (s: ImpactStory) => s.happened_on.slice(0, 4)

/**
 * Impact: what Nepali and Indian owned businesses around the world have done for
 * Nepal and Nepalese people. Open to everyone; sharing a story needs an account and
 * a link that backs it up, and every story is checked before it is shown. Laid out
 * like the original Journey page: a big latest story, then a grid of cards.
 */
export default function ImpactPage() {
  const toast = useToast()
  const navigate = useNavigate()
  const signedIn = useAuthStore(s => !!s.user)
  const isAdmin = useAuthStore(s => s.user?.role === 'admin')
  const [scope, setScope] = useState<ImpactListScope>('all')
  const [category, setCategory] = useState<string>('')
  const [stories, setStories] = useState<ImpactStory[] | null>(null)
  const [latest, setLatest] = useState<ImpactStory | null>(null)
  const [totals, setTotals] = useState({ stories: 0, businesses: 0, countries: 0 })
  const [open, setOpen] = useState<ImpactStory | null>(null)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<ImpactStory | null>(null)
  const [params, setParams] = useSearchParams()

  const share = useCallback(() => {
    if (!signedIn) { navigate(`/login?redirect=${encodeURIComponent('/impact?create=1')}`); return }
    setCreating(true)
  }, [signedIn, navigate])

  // The phone dock's "+" and the way back from signing in both open the form.
  useEffect(() => {
    if (params.get('create') !== '1') return
    setParams(prev => { const next = new URLSearchParams(prev); next.delete('create'); return next }, { replace: true })
    share()
  }, [params, setParams, share])

  const load = useCallback(async () => {
    try {
      const [list, all] = await Promise.all([impactApi.list(scope), scope === 'all' ? null : impactApi.list('all')])
      setStories(list.stories)
      const approved = (all ?? list).stories
      setLatest(approved[0] ?? null)
      setTotals({
        stories: approved.length,
        businesses: new Set(approved.map(s => s.business_name.trim().toLowerCase())).size,
        countries: new Set(approved.map(s => s.business_country.trim().toLowerCase())).size,
      })
    } catch { setStories([]); toast.error('Could not load stories') }
  }, [scope, toast])
  useEffect(() => { setStories(null); void load() }, [load])

  const shown = useMemo(() => (stories ?? []).filter(s => !category || s.category === category), [stories, category])

  const remove = async (s: ImpactStory) => {
    if (!window.confirm(`Delete "${s.title}"?`)) return
    try { await impactApi.remove(s.id); setOpen(null); void load() } catch { toast.error('Could not delete the story') }
  }
  const review = async (s: ImpactStory, status: 'approved' | 'rejected') => {
    try { await impactApi.setStatus(s.id, status); setOpen(null); void load(); toast.success(status === 'approved' ? 'Approved and shown' : 'Rejected') } catch { toast.error('Could not update the story') }
  }

  return (
    <div className="min-h-screen bg-surface-secondary">
      {signedIn ? <Navbar /> : <GuestNavbar />}
      <main className="mx-auto w-full max-w-[1800px] px-4 pb-[120px] md:px-[35px] md:pb-12" style={{ paddingTop: 'calc(var(--nav-h) + 28px)' }}>
        <section
          className="relative mb-10 flex min-h-[310px] flex-col justify-end overflow-hidden rounded-[28px] p-6 text-white shadow-elevated md:p-9"
          style={{ background: latest?.cover_url ? undefined : latest ? impactGradient(latest.id) : 'linear-gradient(135deg, #1F4455 0%, #0B1A21 100%)' }}
        >{/* theme-lint-disable: hero over a photo */}
          {latest?.cover_url && <img src={latest.cover_url} alt="" className="absolute inset-0 h-full w-full object-cover" />}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,.66) 0%, rgba(0,0,0,.15) 70%)' }} />{/* theme-lint-disable: scrim */}
          <div className="relative flex flex-wrap items-end gap-5">
            <div className="min-w-0 flex-1">
              <div className="mb-3 text-[11px] font-bold uppercase tracking-[.16em] opacity-80">{latest ? 'Latest impact' : 'Impact'}</div>
              <h1 className="m-0 text-[34px] font-bold leading-[1.05] md:text-[52px]">{latest ? latest.title : 'What our businesses give back'}</h1>
              <p className="m-0 mt-2 max-w-[680px] text-[15px] opacity-90 md:text-[17px]">
                {latest ? latest.summary : 'Nepali and Indian owned businesses around the world have helped Nepal and Nepalese people. Share what yours has done, and see what others have.'}
              </p>
              <div className="mt-5 inline-flex flex-wrap items-stretch gap-x-6 gap-y-3 rounded-[18px] border border-white/25 bg-white/15 px-5 py-3 backdrop-blur-md">{/* theme-lint-disable: glass stats on the photo */}
                {[['Stories', totals.stories], ['Businesses', totals.businesses], ['Countries', totals.countries]].map(([label, n]) => (
                  <div key={label as string}><div className="text-[24px] font-bold leading-none">{n}</div><div className="mt-1 text-[10px] font-semibold uppercase tracking-[.1em] opacity-80">{label}</div></div>
                ))}
              </div>
            </div>
            <button type="button" onClick={latest ? () => setOpen(latest) : share}
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[15px] font-bold text-[#0B1A21] shadow-lg hover:opacity-90">{/* theme-lint-disable: button on the photo */}
              {latest ? <>Read the story <ChevronRight size={16} /></> : <><Plus size={16} /> Share a story</>}
            </button>
          </div>
        </section>

        <div className="mb-5 flex flex-wrap items-center gap-3">
          <h2 className="m-0 me-auto text-[11px] font-bold uppercase tracking-[.14em] text-content-muted">All stories</h2>
          <select value={category} onChange={e => setCategory(e.target.value)} aria-label="Kind of help"
            className="rounded-full border border-edge bg-surface-card px-3 py-1.5 text-caption font-semibold text-content-secondary">
            <option value="">All kinds of help</option>
            {IMPACT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="flex items-center gap-1 rounded-full border border-edge bg-surface-card p-1">
            {SCOPES.filter(s => (!s.adminOnly || isAdmin) && (!s.memberOnly || signedIn)).map(s => (
              <button key={s.id} type="button" onClick={() => setScope(s.id)}
                className={`rounded-full px-3.5 py-1 text-caption font-semibold ${scope === s.id ? 'bg-accent text-accent-text' : 'text-content-secondary hover:bg-surface-hover'}`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {shown.map(s => (
            <article
              key={s.id}
              role="button"
              tabIndex={0}
              onClick={() => setOpen(s)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(s) } }}
              className="group flex min-w-0 cursor-pointer flex-col overflow-hidden rounded-[20px] border border-edge bg-surface-card shadow-card transition-shadow hover:shadow-elevated"
            >
              <div className="relative h-[210px] flex-none">
                {s.cover_url
                  ? <img src={s.cover_url} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                  : <div className="absolute inset-0" style={{ background: impactGradient(s.id) }} />}
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,.6) 0%, rgba(0,0,0,0) 62%)' }} />{/* theme-lint-disable: scrim */}
                <span className="absolute start-3 top-3 rounded-full bg-black/40 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-sm">{yearOf(s)}</span>{/* theme-lint-disable: badge on the photo */}
                <span className="absolute end-3 top-3 rounded-full bg-black/55 px-3 py-1 text-[10.5px] font-bold uppercase tracking-[.08em] text-white">{s.status === 'pending' ? 'In review' : s.status === 'rejected' ? 'Not approved' : s.category}</span>{/* theme-lint-disable: badge on the photo */}
                <h3 className="absolute inset-x-4 bottom-3 m-0 text-[20px] font-bold leading-tight text-white [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden">{s.title}</h3>{/* theme-lint-disable: title over the photo */}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
                <div className="truncate text-[13px] font-semibold text-content">{s.business_name} <span className="font-normal text-content-muted">· {s.business_country}</span></div>
                <p className="m-0 line-clamp-2 text-caption text-content-secondary">{s.summary}</p>
                <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-edge-faint pt-3 text-caption text-content-muted">
                  <span className="inline-flex items-center gap-1"><MapPin size={12} />{s.impact_place}</span>
                  {s.people_helped != null && <span className="inline-flex items-center gap-1"><Users size={12} />{s.people_helped.toLocaleString()} helped</span>}
                </div>
              </div>
            </article>
          ))}
          {stories !== null && scope === 'all' && !category && (
            <button type="button" onClick={share} className="flex min-h-[260px] flex-col items-center justify-center gap-3 rounded-[20px] border border-dashed border-edge bg-transparent p-6 text-center hover:bg-surface-hover">
              <span className="grid h-12 w-12 place-items-center rounded-full" style={{ background: 'var(--accent)', color: '#fff' }}><Plus size={22} /></span>
              <span className="text-[15px] font-semibold text-content">Share a story</span>
              <span className="text-caption text-content-muted">What has your business done for Nepal?</span>
            </button>
          )}
        </div>

        {stories !== null && shown.length === 0 && (scope !== 'all' || category) && (
          <div className="mt-2 flex flex-col items-center gap-2 rounded-[20px] border border-dashed border-edge bg-surface-card px-6 py-14 text-center">
            <HeartHandshake size={30} className="text-content-faint" />
            <p className="m-0 text-body text-content-secondary">{scope === 'mine' ? "You haven't shared a story yet." : scope === 'pending' ? 'Nothing waiting for review.' : 'No stories of this kind yet.'}</p>
          </div>
        )}
      </main>

      {open && <ImpactDetailDialog story={open} onClose={() => setOpen(null)} onEdit={() => { setEditing(open); setOpen(null) }} onDelete={() => remove(open)} onReview={status => review(open, status)} />}
      {creating && <ImpactFormDialog onClose={() => setCreating(false)} onSaved={load} />}
      {editing && <ImpactFormDialog story={editing} onClose={() => setEditing(null)} onSaved={load} />}
    </div>
  )
}
