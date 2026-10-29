import { CalendarDays } from 'lucide-react'
import { useId, useMemo, useState, type FormEvent } from 'react'
import type { EventPlatform, UdyamiEvent } from '@trek/shared'
import { eventsApi } from '../../api/udyami'
import { useAuthStore } from '../../store/authStore'
import { DialogButton, DialogFooter, DialogHeader, DialogShell, FooterSpacer, NEUTRAL_TINT } from '../shared/DialogShell'
import { useToast } from '../shared/Toast'
import { allTimezones, localTimezone, utcToZoned, zonedToUtcIso } from './eventTime'

const FIELD = 'w-full rounded-[10px] border border-edge bg-surface-input px-3 py-2 text-body text-content outline-none focus:border-accent'
const LABEL = 'mb-1 block text-caption font-semibold text-content-secondary'

export const PLATFORM_LABEL: Record<EventPlatform, string> = {
  zoom: 'Zoom', google_meet: 'Google Meet', teams: 'Microsoft Teams', youtube: 'YouTube Live', facebook: 'Facebook Live', other: 'Other',
}
export const EVENT_CATEGORIES = ['Webinar', 'Workshop', 'Networking', 'Q&A', 'Celebration', 'Other']
const DURATIONS = [30, 45, 60, 90, 120, 180]

/** Create an online event, or edit one you organise. Times are entered in the chosen timezone. */
export default function EventFormDialog({ event, onClose, onSaved }: { event?: UdyamiEvent | null; onClose: () => void; onSaved: () => void }) {
  const labelId = useId()
  const toast = useToast()
  const isAdmin = useAuthStore(s => s.user?.role === 'admin')
  const zones = useMemo(allTimezones, [])
  const initialZone = event?.host_timezone ?? localTimezone()
  const initial = event ? utcToZoned(event.starts_at, initialZone) : { date: '', time: '19:00' }
  const [form, setForm] = useState({
    title: event?.title ?? '', category: event?.category ?? 'Webinar', platform: (event?.platform ?? 'zoom') as EventPlatform,
    join_url: event?.join_url ?? '', date: initial.date, time: initial.time, timezone: initialZone,
    duration: String(event?.duration_minutes ?? 60), cover_url: event?.cover_url ?? '', description: event?.description ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm(f => ({ ...f, [key]: e.target.value }))
  const canSubmit = !!(form.title.trim() && form.join_url.trim() && form.date && form.time) && !saving

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!canSubmit) return
    setSaving(true)
    setError(null)
    const body = {
      title: form.title, category: form.category, platform: form.platform, join_url: form.join_url.trim(),
      starts_at: zonedToUtcIso(form.date, form.time, form.timezone), duration_minutes: Number(form.duration),
      host_timezone: form.timezone, cover_url: form.cover_url.trim(), description: form.description,
    }
    try {
      const { event: saved } = event ? await eventsApi.update(event.id, body) : await eventsApi.create(body)
      toast.success(saved.status === 'approved' ? 'Event saved' : 'Sent for review. It will be listed once approved.')
      onSaved()
      onClose()
    } catch (err) {
      setError((err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Could not save the event.')
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
          tile={<CalendarDays size={20} />}
          tint={NEUTRAL_TINT}
          labelId={labelId}
          onClose={onClose}
          title={event ? 'Edit event' : isAdmin ? 'Create an online event' : 'Suggest an online event'}
          sub={isAdmin ? 'Admin events are listed straight away.' : 'Events are reviewed before they are listed.'}
          subWraps
        />
      }
      footer={
        <DialogFooter>
          <FooterSpacer />
          <DialogButton onClick={onClose}>Cancel</DialogButton>
          <DialogButton type="submit" variant="primary" disabled={!canSubmit}>{saving ? 'Saving…' : event ? 'Save changes' : isAdmin ? 'Create event' : 'Send for review'}</DialogButton>
        </DialogFooter>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={LABEL} htmlFor={`${labelId}-title`}>Title *</label>
          <input id={`${labelId}-title`} className={FIELD} value={form.title} onChange={set('title')} maxLength={140} required placeholder="Grow your shop online" />
        </div>
        <div>
          <label className={LABEL} htmlFor={`${labelId}-category`}>Type</label>
          <select id={`${labelId}-category`} className={FIELD} value={form.category} onChange={set('category')}>
            {EVENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className={LABEL} htmlFor={`${labelId}-platform`}>Platform</label>
          <select id={`${labelId}-platform`} className={FIELD} value={form.platform} onChange={set('platform')}>
            {(Object.keys(PLATFORM_LABEL) as EventPlatform[]).map(p => <option key={p} value={p}>{PLATFORM_LABEL[p]}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={LABEL} htmlFor={`${labelId}-url`}>Meeting link *</label>
          <input id={`${labelId}-url`} className={FIELD} value={form.join_url} onChange={set('join_url')} required placeholder="https://zoom.us/j/…" />
          <p className="m-0 mt-1 text-caption text-content-muted">Only people who register see this link.</p>
        </div>
        <div>
          <label className={LABEL} htmlFor={`${labelId}-date`}>Date *</label>
          <input id={`${labelId}-date`} type="date" className={FIELD} value={form.date} onChange={set('date')} required />
        </div>
        <div>
          <label className={LABEL} htmlFor={`${labelId}-time`}>Start time *</label>
          <input id={`${labelId}-time`} type="time" className={FIELD} value={form.time} onChange={set('time')} required />
        </div>
        <div>
          <label className={LABEL} htmlFor={`${labelId}-tz`}>Timezone of that time</label>
          <select id={`${labelId}-tz`} className={FIELD} value={form.timezone} onChange={set('timezone')}>
            {zones.map(z => <option key={z} value={z}>{z.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
        <div>
          <label className={LABEL} htmlFor={`${labelId}-duration`}>Length</label>
          <select id={`${labelId}-duration`} className={FIELD} value={form.duration} onChange={set('duration')}>
            {DURATIONS.map(d => <option key={d} value={d}>{d < 60 ? `${d} minutes` : `${d / 60} hour${d === 60 ? '' : 's'}`}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={LABEL} htmlFor={`${labelId}-cover`}>Cover image URL</label>
          <input id={`${labelId}-cover`} className={FIELD} value={form.cover_url} onChange={set('cover_url')} placeholder="https://" />
        </div>
        <div className="sm:col-span-2">
          <label className={LABEL} htmlFor={`${labelId}-description`}>What it's about</label>
          <textarea id={`${labelId}-description`} className={`${FIELD} min-h-[110px] resize-y`} value={form.description} onChange={set('description')} maxLength={4000} />
        </div>
      </div>
      {error && <p className="m-0 text-caption text-danger" role="alert">{error}</p>}
    </DialogShell>
  )
}
