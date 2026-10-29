import { Award } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import type { NominationCreateRequest } from '@trek/shared'
import { udyamiApi } from '../../api/udyami'
import { DialogButton, DialogFooter, DialogHeader, DialogShell, NEUTRAL_TINT, FooterSpacer } from '../shared/DialogShell'
import { useToast } from '../shared/Toast'
import CountrySelect from './CountrySelect'

const FIELD = 'w-full rounded-[10px] border border-edge bg-surface-input px-3 py-2 text-body text-content outline-none focus:border-accent'
const LABEL = 'mb-1 block text-caption font-semibold text-content-secondary'

const EMPTY: NominationCreateRequest = {
  business_name: '', owner_name: '', city: '', country: '', category: '', contact: '', reason: '',
}

/** Suggest a Nepali or Indian owned business for "Udyami of the Month". */
export default function NominateDialog({ onClose }: { onClose: () => void }) {
  const labelId = useId()
  const toast = useToast()
  const [form, setForm] = useState<NominationCreateRequest>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (key: keyof NominationCreateRequest) => (e: { target: { value: string } }) =>
    setForm(f => ({ ...f, [key]: e.target.value }))

  const canSubmit = !!form.business_name.trim() && !!form.city.trim() && !!form.country.trim() && !saving

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!canSubmit) return
    setSaving(true)
    setError(null)
    try {
      await udyamiApi.nominate(form)
      toast.success('Thank you! Your nomination was sent.')
      onClose()
    } catch {
      setError('Could not send the nomination. Check the fields and try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DialogShell
      onClose={onClose}
      labelledBy={labelId}
      width="detail"
      onSubmit={submit}
      header={
        <DialogHeader
          tile={<Award size={20} />}
          tint={NEUTRAL_TINT}
          labelId={labelId}
          onClose={onClose}
          title="Nominate an Udyami"
          sub="Know a Nepali or Indian owned business doing great work? Tell us about it."
          subWraps
        />
      }
      footer={
        <DialogFooter>
          <FooterSpacer />
          <DialogButton onClick={onClose}>Cancel</DialogButton>
          <DialogButton type="submit" variant="primary" disabled={!canSubmit}>
            {saving ? 'Sending…' : 'Send nomination'}
          </DialogButton>
        </DialogFooter>
      }
    >
      <div>
        <label className={LABEL} htmlFor={`${labelId}-business`}>Business name *</label>
        <input id={`${labelId}-business`} className={FIELD} value={form.business_name} onChange={set('business_name')} maxLength={120} required />
      </div>
      <div>
        <label className={LABEL} htmlFor={`${labelId}-owner`}>Owner name</label>
        <input id={`${labelId}-owner`} className={FIELD} value={form.owner_name ?? ''} onChange={set('owner_name')} maxLength={120} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={LABEL} htmlFor={`${labelId}-city`}>City *</label>
          <input id={`${labelId}-city`} className={FIELD} value={form.city} onChange={set('city')} maxLength={80} required placeholder="Auckland" />
        </div>
        <div>
          <label className={LABEL} htmlFor={`${labelId}-country`}>Country *</label>
          <CountrySelect id={`${labelId}-country`} className={FIELD} value={form.country} onChange={v => setForm(f => ({ ...f, country: v }))} required />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={LABEL} htmlFor={`${labelId}-category`}>Type of business</label>
          <input id={`${labelId}-category`} className={FIELD} value={form.category ?? ''} onChange={set('category')} maxLength={80} placeholder="Restaurant, grocery, accountant…" />
        </div>
        <div>
          <label className={LABEL} htmlFor={`${labelId}-contact`}>Contact (phone, email or website)</label>
          <input id={`${labelId}-contact`} className={FIELD} value={form.contact ?? ''} onChange={set('contact')} maxLength={200} />
        </div>
      </div>
      <div>
        <label className={LABEL} htmlFor={`${labelId}-reason`}>Why should they be featured?</label>
        <textarea id={`${labelId}-reason`} className={`${FIELD} min-h-[96px] resize-y`} value={form.reason ?? ''} onChange={set('reason')} maxLength={2000} />
      </div>
      {error && <p className="m-0 text-caption text-danger" role="alert">{error}</p>}
    </DialogShell>
  )
}
