import { Store } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import type { Business, BusinessCommunity, BusinessUpsertRequest } from '@trek/shared'
import { businessesApi, COMMUNITY_LABEL } from '../../api/udyami'
import { useAuthStore } from '../../store/authStore'
import { DialogButton, DialogFooter, DialogHeader, DialogShell, FooterSpacer, NEUTRAL_TINT } from '../shared/DialogShell'
import { useToast } from '../shared/Toast'
import CountrySelect from './CountrySelect'

const FIELD = 'w-full rounded-[10px] border border-edge bg-surface-input px-3 py-2 text-body text-content outline-none focus:border-accent'
const LABEL = 'mb-1 block text-caption font-semibold text-content-secondary'

type FormState = Required<{ [K in keyof BusinessUpsertRequest]: string }>

function toForm(b?: Business | null): FormState {
  return {
    name: b?.name ?? '', category: b?.category ?? '', community: b?.community ?? 'nepali',
    description: b?.description ?? '', city: b?.city ?? '', country: b?.country ?? '', address: b?.address ?? '',
    phone: b?.phone ?? '', email: b?.email ?? '', website: b?.website ?? '', photo_url: b?.photo_url ?? '',
  }
}

/** Add a business to the directory, or edit one you added. */
export default function BusinessFormDialog({ business, onClose, onSaved }: {
  business?: Business | null
  onClose: () => void
  onSaved: (b: Business) => void
}) {
  const labelId = useId()
  const toast = useToast()
  const isAdmin = useAuthStore(s => s.user?.role === 'admin')
  const [form, setForm] = useState<FormState>(() => toForm(business))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const editing = !!business

  const set = (key: keyof FormState) => (e: { target: { value: string } }) => setForm(f => ({ ...f, [key]: e.target.value }))
  const canSubmit = !!(form.name.trim() && form.category.trim() && form.city.trim() && form.country.trim()) && !saving

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!canSubmit) return
    setSaving(true)
    setError(null)
    const body: BusinessUpsertRequest = { ...form, community: form.community as BusinessCommunity }
    try {
      const { business: saved } = editing ? await businessesApi.update(business!.id, body) : await businessesApi.create(body)
      toast.success(saved.status === 'approved' ? 'Listing saved' : 'Sent for review. It appears in the directory once approved.')
      onSaved(saved)
      onClose()
    } catch (err) {
      setError((err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Could not save the listing.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DialogShell
      onClose={onClose}
      labelledBy={labelId}
      width="editor"
      onSubmit={submit}
      header={
        <DialogHeader
          tile={<Store size={20} />}
          tint={NEUTRAL_TINT}
          labelId={labelId}
          onClose={onClose}
          title={editing ? 'Edit listing' : 'Add a business'}
          sub={isAdmin ? 'Admin listings go live straight away.' : 'New listings and edits are reviewed before they appear in the directory.'}
          subWraps
        />
      }
      footer={
        <DialogFooter>
          <FooterSpacer />
          <DialogButton onClick={onClose}>Cancel</DialogButton>
          <DialogButton type="submit" variant="primary" disabled={!canSubmit}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Add business'}</DialogButton>
        </DialogFooter>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={LABEL} htmlFor={`${labelId}-name`}>Business name *</label>
          <input id={`${labelId}-name`} className={FIELD} value={form.name} onChange={set('name')} maxLength={120} required />
        </div>
        <div>
          <label className={LABEL} htmlFor={`${labelId}-category`}>Type of business *</label>
          <input id={`${labelId}-category`} className={FIELD} value={form.category} onChange={set('category')} maxLength={80} required placeholder="Restaurant, grocery, accountant…" />
        </div>
        <div>
          <label className={LABEL} htmlFor={`${labelId}-community`}>Owned and run by *</label>
          <select id={`${labelId}-community`} className={FIELD} value={form.community} onChange={set('community')}>
            {(Object.keys(COMMUNITY_LABEL) as BusinessCommunity[]).map(c => <option key={c} value={c}>{COMMUNITY_LABEL[c]}</option>)}
          </select>
        </div>
        <div>
          <label className={LABEL} htmlFor={`${labelId}-city`}>City *</label>
          <input id={`${labelId}-city`} className={FIELD} value={form.city} onChange={set('city')} maxLength={80} required placeholder="Auckland" />
        </div>
        <div>
          <label className={LABEL} htmlFor={`${labelId}-country`}>Country *</label>
          <CountrySelect id={`${labelId}-country`} className={FIELD} value={form.country} onChange={v => setForm(f => ({ ...f, country: v }))} required />
        </div>
        <div className="sm:col-span-2">
          <label className={LABEL} htmlFor={`${labelId}-address`}>Address</label>
          <input id={`${labelId}-address`} className={FIELD} value={form.address} onChange={set('address')} maxLength={200} />
        </div>
        <div>
          <label className={LABEL} htmlFor={`${labelId}-phone`}>Phone</label>
          <input id={`${labelId}-phone`} className={FIELD} value={form.phone} onChange={set('phone')} maxLength={40} />
        </div>
        <div>
          <label className={LABEL} htmlFor={`${labelId}-email`}>Email</label>
          <input id={`${labelId}-email`} type="email" className={FIELD} value={form.email} onChange={set('email')} maxLength={200} />
        </div>
        <div>
          <label className={LABEL} htmlFor={`${labelId}-website`}>Website</label>
          <input id={`${labelId}-website`} className={FIELD} value={form.website} onChange={set('website')} placeholder="https://" />
        </div>
        <div>
          <label className={LABEL} htmlFor={`${labelId}-photo`}>Photo URL</label>
          <input id={`${labelId}-photo`} className={FIELD} value={form.photo_url} onChange={set('photo_url')} placeholder="https://" />
        </div>
        <div className="sm:col-span-2">
          <label className={LABEL} htmlFor={`${labelId}-description`}>About the business</label>
          <textarea id={`${labelId}-description`} className={`${FIELD} min-h-[96px] resize-y`} value={form.description} onChange={set('description')} maxLength={2000} />
        </div>
      </div>
      {error && <p className="m-0 text-caption text-danger" role="alert">{error}</p>}
    </DialogShell>
  )
}
