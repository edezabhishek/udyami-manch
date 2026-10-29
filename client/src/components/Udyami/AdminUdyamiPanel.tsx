import { Award, Inbox, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import type { Nomination, NominationStatus, Spotlight, SpotlightUpsertRequest } from '@trek/shared'
import { currentMonth, monthLabel, udyamiApi } from '../../api/udyami'
import { useToast } from '../shared/Toast'
import CountrySelect from './CountrySelect'

const FIELD = 'w-full rounded-[10px] border border-edge bg-surface-input px-3 py-2 text-body text-content outline-none focus:border-accent'
const LABEL = 'mb-1 block text-caption font-semibold text-content-secondary'
const CARD = 'rounded-[16px] border border-edge bg-surface-card p-5 shadow-sm'
const PRIMARY = 'inline-flex items-center gap-1.5 rounded-[10px] bg-accent px-4 py-2 font-medium text-accent-text hover:opacity-90 disabled:opacity-50'
const SECONDARY = 'inline-flex items-center gap-1.5 rounded-[10px] border border-edge bg-surface-card px-3 py-1.5 text-caption font-medium text-content hover:bg-surface-hover'

interface FormState {
  business_name: string; owner_name: string; owner_photo_url: string; photo_url: string
  city: string; country: string; category: string; staff_count: string; founded_year: string
  story: string; website: string
}

const EMPTY: FormState = {
  business_name: '', owner_name: '', owner_photo_url: '', photo_url: '', city: '', country: '',
  category: '', staff_count: '', founded_year: '', story: '', website: '',
}

function fromSpotlight(s: Spotlight): FormState {
  return {
    business_name: s.business_name, owner_name: s.owner_name, owner_photo_url: s.owner_photo_url ?? '',
    photo_url: s.photo_url ?? '', city: s.city, country: s.country, category: s.category,
    staff_count: s.staff_count?.toString() ?? '', founded_year: s.founded_year?.toString() ?? '',
    story: s.story ?? '', website: s.website ?? '',
  }
}

function toRequest(f: FormState): SpotlightUpsertRequest {
  const num = (v: string) => (v.trim() === '' ? null : Number(v))
  const str = (v: string) => (v.trim() === '' ? null : v.trim())
  return {
    business_name: f.business_name.trim(), owner_name: f.owner_name.trim(),
    owner_photo_url: str(f.owner_photo_url), photo_url: str(f.photo_url),
    city: f.city.trim(), country: f.country.trim(), category: f.category.trim(),
    staff_count: num(f.staff_count), founded_year: num(f.founded_year),
    story: str(f.story), website: str(f.website),
  }
}

const STATUS_LABEL: Record<NominationStatus, string> = { new: 'New', reviewed: 'Reviewed', featured: 'Featured', rejected: 'Rejected' }

/** Admin: set each month's "Udyami of the Month" and review nominations. */
export default function AdminUdyamiPanel() {
  const toast = useToast()
  const [month, setMonth] = useState(currentMonth())
  const [form, setForm] = useState<FormState>(EMPTY)
  const [spotlights, setSpotlights] = useState<Spotlight[]>([])
  const [nominations, setNominations] = useState<Nomination[]>([])
  const [saving, setSaving] = useState(false)

  const reload = useCallback(async () => {
    const [s, n] = await Promise.all([udyamiApi.listSpotlights(), udyamiApi.listNominations()])
    setSpotlights(s.spotlights)
    setNominations(n.nominations)
    return s.spotlights
  }, [])

  useEffect(() => {
    reload().then(list => {
      const existing = list.find(s => s.month === currentMonth())
      setForm(existing ? fromSpotlight(existing) : EMPTY)
    }).catch(() => toast.error('Could not load Udyami of the Month'))
  }, [reload, toast])

  const pickMonth = (m: string) => {
    setMonth(m)
    const existing = spotlights.find(s => s.month === m)
    setForm(existing ? fromSpotlight(existing) : EMPTY)
  }

  const set = (key: keyof FormState) => (e: { target: { value: string } }) => setForm(f => ({ ...f, [key]: e.target.value }))
  const canSave = !!(form.business_name.trim() && form.owner_name.trim() && form.city.trim() && form.country.trim() && form.category.trim()) && /^\d{4}-\d{2}$/.test(month) && !saving

  const save = async (e: FormEvent) => {
    e.preventDefault()
    if (!canSave) return
    setSaving(true)
    try {
      await udyamiApi.upsertSpotlight(month, toRequest(form))
      await reload()
      toast.success(`Saved Udyami of the Month for ${monthLabel(month)}`)
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error
      toast.error(msg ?? 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (m: string) => {
    if (!window.confirm(`Remove the feature for ${monthLabel(m)}?`)) return
    try {
      await udyamiApi.deleteSpotlight(m)
      await reload()
      if (m === month) setForm(EMPTY)
      toast.success('Removed')
    } catch { toast.error('Could not remove') }
  }

  const setStatus = async (id: number, status: NominationStatus) => {
    try {
      const { nomination } = await udyamiApi.setNominationStatus(id, status)
      setNominations(list => list.map(n => (n.id === id ? nomination : n)))
    } catch { toast.error('Could not update the nomination') }
  }

  const applyNomination = (n: Nomination) => {
    setForm({
      ...EMPTY,
      business_name: n.business_name, owner_name: n.owner_name ?? '', city: n.city, country: n.country,
      category: n.category ?? '', story: n.reason ?? '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="flex flex-col gap-5">
      <form className={CARD} onSubmit={save}>
        <div className="mb-4 flex items-center gap-2">
          <Award size={18} className="text-accent" />
          <h3 className="m-0 text-subtitle font-semibold text-content">Udyami of the Month</h3>
        </div>
        <p className="m-0 mb-4 text-caption text-content-muted">
          Shown at the top of Home. Feature a business only with the owner&apos;s permission.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={LABEL} htmlFor="um-month">Month</label>
            <input id="um-month" type="month" className={FIELD} value={month} onChange={e => pickMonth(e.target.value)} />
          </div>
          <div>
            <label className={LABEL} htmlFor="um-category">Type of business *</label>
            <input id="um-category" className={FIELD} value={form.category} onChange={set('category')} placeholder="Restaurant" />
          </div>
          <div>
            <label className={LABEL} htmlFor="um-business">Business name *</label>
            <input id="um-business" className={FIELD} value={form.business_name} onChange={set('business_name')} />
          </div>
          <div>
            <label className={LABEL} htmlFor="um-owner">Owner name *</label>
            <input id="um-owner" className={FIELD} value={form.owner_name} onChange={set('owner_name')} />
          </div>
          <div>
            <label className={LABEL} htmlFor="um-city">City *</label>
            <input id="um-city" className={FIELD} value={form.city} onChange={set('city')} />
          </div>
          <div>
            <label className={LABEL} htmlFor="um-country">Country *</label>
            <CountrySelect id="um-country" className={FIELD} value={form.country} onChange={v => setForm(f => ({ ...f, country: v }))} />
          </div>
          <div>
            <label className={LABEL} htmlFor="um-founded">Founded (year)</label>
            <input id="um-founded" type="number" className={FIELD} value={form.founded_year} onChange={set('founded_year')} min={1800} max={2100} />
          </div>
          <div>
            <label className={LABEL} htmlFor="um-staff">Staff</label>
            <input id="um-staff" type="number" className={FIELD} value={form.staff_count} onChange={set('staff_count')} min={0} />
          </div>
          <div>
            <label className={LABEL} htmlFor="um-photo">Business photo URL</label>
            <input id="um-photo" className={FIELD} value={form.photo_url} onChange={set('photo_url')} placeholder="https://" />
          </div>
          <div>
            <label className={LABEL} htmlFor="um-owner-photo">Owner photo URL</label>
            <input id="um-owner-photo" className={FIELD} value={form.owner_photo_url} onChange={set('owner_photo_url')} placeholder="https://" />
          </div>
          <div className="sm:col-span-2">
            <label className={LABEL} htmlFor="um-website">Website</label>
            <input id="um-website" className={FIELD} value={form.website} onChange={set('website')} placeholder="https://" />
          </div>
          <div className="sm:col-span-2">
            <label className={LABEL} htmlFor="um-story">Their story</label>
            <textarea id="um-story" className={`${FIELD} min-h-[120px] resize-y`} value={form.story} onChange={set('story')} />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button type="submit" className={PRIMARY} disabled={!canSave}>{saving ? 'Saving…' : `Save for ${monthLabel(month)}`}</button>
        </div>
      </form>

      {spotlights.length > 0 && (
        <div className={CARD}>
          <h3 className="m-0 mb-3 text-subtitle font-semibold text-content">Past and planned features</h3>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {spotlights.map(s => (
              <li key={s.id} className="flex items-center gap-3 rounded-[12px] border border-edge px-3 py-2">
                <span className="w-[120px] flex-none text-caption font-semibold text-content-secondary">{monthLabel(s.month)}</span>
                <span className="min-w-0 flex-1 truncate text-body text-content">{s.business_name} · {s.city}, {s.country}</span>
                <button type="button" className={SECONDARY} onClick={() => pickMonth(s.month)}>Edit</button>
                <button type="button" className={SECONDARY} onClick={() => remove(s.month)} aria-label={`Remove ${monthLabel(s.month)}`}><Trash2 size={14} /></button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={CARD}>
        <div className="mb-3 flex items-center gap-2">
          <Inbox size={18} className="text-accent" />
          <h3 className="m-0 text-subtitle font-semibold text-content">Nominations</h3>
          <span className="text-caption text-content-muted">({nominations.length})</span>
        </div>
        {nominations.length === 0 && <p className="m-0 text-caption text-content-muted">No nominations yet.</p>}
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {nominations.map(n => (
            <li key={n.id} className="rounded-[12px] border border-edge p-3">
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-body font-semibold text-content">{n.business_name}</div>
                  <div className="text-caption text-content-muted">
                    {[n.owner_name, `${n.city}, ${n.country}`, n.category, n.contact].filter(Boolean).join(' · ')}
                  </div>
                  {n.reason && <p className="m-0 mt-2 whitespace-pre-line text-caption text-content-secondary">{n.reason}</p>}
                </div>
                <select
                  className="rounded-[10px] border border-edge bg-surface-input px-2 py-1.5 text-caption text-content"
                  value={n.status}
                  onChange={e => setStatus(n.id, e.target.value as NominationStatus)}
                  aria-label={`Status of ${n.business_name}`}
                >
                  {(Object.keys(STATUS_LABEL) as NominationStatus[]).map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                </select>
                <button type="button" className={SECONDARY} onClick={() => applyNomination(n)}>Use for {monthLabel(month)}</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
