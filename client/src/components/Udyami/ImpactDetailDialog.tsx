import { CalendarDays, ExternalLink, HeartHandshake, MapPin, Pencil, Store, Trash2, Users } from 'lucide-react'
import { useId } from 'react'
import type { ImpactStory } from '@trek/shared'
import { useAuthStore } from '../../store/authStore'
import { DialogButton, DialogFooter, DialogHeader, DialogShell, NEUTRAL_TINT } from '../shared/DialogShell'
import { impactGradient } from './impact'

const ROW = 'flex items-start gap-3 text-body text-content'

/** One story in full: who did it, where it helped, and the link that backs it up. */
export default function ImpactDetailDialog({ story, onClose, onEdit, onDelete, onReview }: {
  story: ImpactStory
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  onReview: (status: 'approved' | 'rejected') => void
}) {
  const labelId = useId()
  const isAdmin = useAuthStore(s => s.user?.role === 'admin')
  const canChange = story.is_mine || isAdmin
  return (
    <DialogShell
      onClose={onClose}
      labelledBy={labelId}
      width="detail"
      header={<DialogHeader tile={<HeartHandshake size={20} />} tint={NEUTRAL_TINT} labelId={labelId} onClose={onClose} eyebrow={story.category} title={story.title} sub={story.business_name} />}
      footer={
        <DialogFooter>
          <div className="flex w-full flex-wrap items-center gap-2">
            {canChange && (
              <button type="button" onClick={onDelete} className="inline-flex items-center gap-1.5 rounded-[10px] border border-edge px-3 py-2 text-caption font-medium text-danger hover:bg-danger-soft" aria-label="Delete story">
                <Trash2 size={14} /> Delete
              </button>
            )}
            <span className="flex-1" />
            {isAdmin && story.status === 'pending' && (
              <>
                <DialogButton onClick={() => onReview('rejected')}>Reject</DialogButton>
                <DialogButton variant="primary" onClick={() => onReview('approved')}>Approve</DialogButton>
              </>
            )}
            {canChange && <DialogButton onClick={onEdit} icon={<Pencil size={14} />}>Edit</DialogButton>}
          </div>
        </DialogFooter>
      }
    >
      <div className="relative h-[200px] overflow-hidden rounded-[14px]">
        {story.cover_url
          ? <img src={story.cover_url} alt="" className="h-full w-full object-cover" />
          : <div className="h-full w-full" style={{ background: impactGradient(story.id) }} />}
      </div>
      <p className="m-0 text-body font-semibold text-content">{story.summary}</p>
      {story.details && <p className="m-0 whitespace-pre-line text-body leading-relaxed text-content-secondary">{story.details}</p>}
      <div className="flex flex-col gap-3">
        <div className={ROW}><Store size={16} className="mt-[2px] flex-none text-content-muted" /><span>{story.business_name}, {story.business_country}</span></div>
        <div className={ROW}><MapPin size={16} className="mt-[2px] flex-none text-content-muted" /><span>Helped: {story.impact_place}</span></div>
        <div className={ROW}><CalendarDays size={16} className="mt-[2px] flex-none text-content-muted" /><span>{new Date(`${story.happened_on}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
        {story.people_helped != null && <div className={ROW}><Users size={16} className="mt-[2px] flex-none text-content-muted" /><span>{story.people_helped.toLocaleString()} people helped</span></div>}
        {story.proof_url && (
          <div className={ROW}><ExternalLink size={16} className="mt-[2px] flex-none text-content-muted" />
            <a className="truncate text-accent-on no-underline hover:underline" href={story.proof_url} target="_blank" rel="noopener noreferrer nofollow">See the source</a>
          </div>
        )}
      </div>
    </DialogShell>
  )
}
