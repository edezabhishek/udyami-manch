import { HeartHandshake } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import { IMPACT_CATEGORIES, type ImpactStory } from '@trek/shared'
import { impactApi } from '../../api/udyami'
import { useAuthStore } from '../../store/authStore'
import { DialogButton, DialogFooter, DialogHeader, DialogShell, FooterSpacer, NEUTRAL_TINT } from '../shared/DialogShell'
import { useToast } from '../shared/Toast'

const FIELD = 'w-full rounded-[10px] border border-edge bg-surface-input px-3 py-2 text-body text-content outline-none focus:border-accent'
const LABEL = 'mb-1 block text-caption font-semibold text-content-secondary'

/** Share an impact story, or edit one you shared. New stories wait for review. */
export default function ImpactFormDialog({ story, onClose, onSaved }: { story?: ImpactStory | null; onClose: () => void; onSaved: () => void }) {
  const labelId = useId()
  const toast = useToast()
  const isAdmin = useAuthStore(s => s.user?.role === 'admin')
  const [form, setForm] = useState({
    title: story?.title ?? '', business_name: story?.business_name ?? '', business_country: story?.business_country ?? '',
    impact_place: story?.impact_place ?? 'Nepal', category: story?.category ?? 'Donation', summary: story?.summary ?? '',
    details: story?.details ?? '', happened_on: story?.happened_on ?? '', people_helped: story?.people_helped != null ? String(story.people_helped) : '',
    cover_url: story?.cover_url ?? '', proof_url: story?.proof_url ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm(f => ({ ...f, [key]: e.target.value }))
  const canSubmit = !!(form.title.trim() && form.business_name.trim() && form.business_country.trim() && form.impact_place.trim()
    && form.summary.trim().length >= 10 && form.happened_on && form.proof_url.trim()) && !saving

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!canSubmit) return
    setSaving(true)
    setError(null)
    const body = {
      title: form.title, business_name: form.business_name, business_country: form.business_country, impact_place: form.impact_place,
      category: form.category, summary: form.summary, details: form.details, happened_on: form.happened_on,
      people_helped: form.people_helped.trim() ? Math.max(0, Math.floor(Number(form.people_helped))) : null,
      cover_url: form.cover_url.trim(), proof_url: form.proof_url.trim(),
    }
    try {
      const { story: saved } = story ? await impactApi.update(story.id, body) : await impactApi.create(body)
      toast.success(saved.status === 'approved' ? 'Story saved' : 'Sent for review. It will be shown once approved.')
      onSaved()
      onClose()
    } catch (err) {
      setError((err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Could not save the story. Check the link starts with https://')
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
          tile={<HeartHandshake size={20} />}
          tint={NEUTRAL_TINT}
          labelId={labelId}
          onClose={onClose}
          title={story ? 'Edit story' : 'Share an impact story'}
          sub={isAdmin ? 'Admin stories are shown straight away.' : 'Stories are checked before they are shown. Owner names are never shown.'}
          subWraps
        />
      }
      footer={
        <DialogFooter>
          <FooterSpacer />
          <DialogButton onClick={onClose}>Cancel</DialogButton>
          <DialogButton type="submit" variant="primary" disabled={!canSubmit}>{saving ? 'Saving…' : story ? 'Save changes' : isAdmin ? 'Publish story' : 'Send for review'}</DialogButton>
        </DialogFooter>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={LABEL} htmlFor={`${labelId}-title`}>What did the business do? *</label>
          <input id={`${labelId}-title`} className={FIELD} value={form.title} onChange={set('title')} maxLength={140} required placeholder="Built a school library in Ilam" />
        </div>
        <div>
          <label className={LABEL} htmlFor={`${labelId}-biz`}>Business *</label>
          <input id={`${labelId}-biz`} className={FIELD} value={form.business_name} onChange={set('business_name')} maxLength={140} required />
        </div>
        <div>
          <label className={LABEL} htmlFor={`${labelId}-bc`}>Business is based in *</label>
          <input id={`${labelId}-bc`} className={FIELD} value={form.business_country} onChange={set('business_country')} maxLength={80} required placeholder="New Zealand" />
        </div>
        <div>
          <label className={LABEL} htmlFor={`${labelId}-cat`}>Kind of help</label>
          <select id={`${labelId}-cat`} className={FIELD} value={form.category} onChange={set('category')}>
            {IMPACT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className={LABEL} htmlFor={`${labelId}-place`}>Where it helped *</label>
          <input id={`${labelId}-place`} className={FIELD} value={form.impact_place} onChange={set('impact_place')} maxLength={140} required placeholder="Ilam, Nepal" />
        </div>
        <div>
          <label className={LABEL} htmlFor={`${labelId}-date`}>When *</label>
          <input id={`${labelId}-date`} type="date" className={FIELD} value={form.happened_on} onChange={set('happened_on')} required />
        </div>
        <div>
          <label className={LABEL} htmlFor={`${labelId}-people`}>People helped (if known)</label>
          <input id={`${labelId}-people`} type="number" min={0} className={FIELD} value={form.people_helped} onChange={set('people_helped')} />
        </div>
        <div className="sm:col-span-2">
          <label className={LABEL} htmlFor={`${labelId}-summary`}>One or two lines *</label>
          <textarea id={`${labelId}-summary`} className={`${FIELD} min-h-[70px] resize-y`} value={form.summary} onChange={set('summary')} maxLength={300} required />
        </div>
        <div className="sm:col-span-2">
          <label className={LABEL} htmlFor={`${labelId}-details`}>The full story</label>
          <textarea id={`${labelId}-details`} className={`${FIELD} min-h-[110px] resize-y`} value={form.details} onChange={set('details')} maxLength={4000} />
        </div>
        <div className="sm:col-span-2">
          <label className={LABEL} htmlFor={`${labelId}-proof`}>Link that backs it up *</label>
          <input id={`${labelId}-proof`} className={FIELD} value={form.proof_url} onChange={set('proof_url')} required placeholder="https://facebook.com/…  a post, news article or page" />
          <p className="m-0 mt-1 text-caption text-content-muted">A post, article or photo page. It helps us check the story before it is shown.</p>
        </div>
        <div className="sm:col-span-2">
          <label className={LABEL} htmlFor={`${labelId}-cover`}>Photo URL</label>
          <input id={`${labelId}-cover`} className={FIELD} value={form.cover_url} onChange={set('cover_url')} placeholder="https://" />
        </div>
      </div>
      {error && <p className="m-0 text-caption text-danger" role="alert">{error}</p>}
    </DialogShell>
  )
}
