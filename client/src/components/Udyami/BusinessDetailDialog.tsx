import { Bookmark, BookmarkCheck, Check, Globe, Mail, MapPin, Pencil, Phone, Store, Trash2, X } from 'lucide-react'
import { useId } from 'react'
import type { Business } from '@trek/shared'
import { COMMUNITY_LABEL } from '../../api/udyami'
import { useAuthStore } from '../../store/authStore'
import { DialogButton, DialogFooter, DialogHeader, DialogShell, NEUTRAL_TINT } from '../shared/DialogShell'
import { BusinessStatusPill, businessGradient } from './BusinessCard'

const ROW = 'flex items-start gap-3 text-body text-content'

/** A listing's details, with save, edit, delete and (for admins) review actions. */
export default function BusinessDetailDialog({ business, onClose, onToggleSave, onEdit, onDelete, onReview }: {
  business: Business
  onClose: () => void
  onToggleSave: () => void
  onEdit: () => void
  onDelete: () => void
  onReview: (status: 'approved' | 'rejected') => void
}) {
  const labelId = useId()
  const isAdmin = useAuthStore(s => s.user?.role === 'admin')
  const canChange = business.is_mine || isAdmin

  return (
    <DialogShell
      onClose={onClose}
      labelledBy={labelId}
      width="detail"
      header={
        <DialogHeader
          tile={<Store size={20} />}
          tint={NEUTRAL_TINT}
          labelId={labelId}
          onClose={onClose}
          eyebrow={COMMUNITY_LABEL[business.community]}
          title={business.name}
          sub={business.category}
          pills={<BusinessStatusPill status={business.status} />}
        />
      }
      footer={
        <DialogFooter>
          {/* Wraps on a phone, where five buttons do not fit on one line. */}
          <div className="flex w-full flex-wrap items-center gap-2">
            {canChange && (
              <button type="button" onClick={onDelete} className="inline-flex items-center gap-1.5 rounded-[10px] border border-edge px-3 py-2 text-caption font-medium text-danger hover:bg-danger-soft" aria-label="Delete listing">
                <Trash2 size={14} /> Delete
              </button>
            )}
            <div className="ms-auto flex flex-wrap justify-end gap-2">
              {isAdmin && business.status !== 'approved' && (
                <DialogButton icon={<Check size={14} />} onClick={() => onReview('approved')}>Approve</DialogButton>
              )}
              {isAdmin && business.status === 'pending' && (
                <DialogButton icon={<X size={14} />} onClick={() => onReview('rejected')}>Reject</DialogButton>
              )}
              {canChange && <DialogButton icon={<Pencil size={14} />} onClick={onEdit}>Edit</DialogButton>}
              <DialogButton variant="primary" icon={business.saved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />} onClick={onToggleSave}>
                {business.saved ? 'Saved' : 'Save'}
              </DialogButton>
            </div>
          </div>
        </DialogFooter>
      }
    >
      <div className="relative h-[180px] overflow-hidden rounded-[14px]">
        {business.photo_url
          ? <img src={business.photo_url} alt={business.name} className="h-full w-full object-cover" />
          : <div className="h-full w-full" style={{ background: businessGradient(business.id) }} />}
      </div>
      {business.description && <p className="m-0 whitespace-pre-line text-body leading-relaxed text-content-secondary">{business.description}</p>}
      <div className="flex flex-col gap-3">
        <div className={ROW}><MapPin size={16} className="mt-[2px] flex-none text-content-muted" /><span>{[business.address, business.city, business.country].filter(Boolean).join(', ')}</span></div>
        {business.phone && <div className={ROW}><Phone size={16} className="mt-[2px] flex-none text-content-muted" /><a className="text-accent-on no-underline hover:underline" href={`tel:${business.phone}`}>{business.phone}</a></div>}
        {business.email && <div className={ROW}><Mail size={16} className="mt-[2px] flex-none text-content-muted" /><a className="text-accent-on no-underline hover:underline" href={`mailto:${business.email}`}>{business.email}</a></div>}
        {business.website && <div className={ROW}><Globe size={16} className="mt-[2px] flex-none text-content-muted" /><a className="truncate text-accent-on no-underline hover:underline" href={business.website} target="_blank" rel="noopener noreferrer">{business.website.replace(/^https?:\/\//, '')}</a></div>}
      </div>
    </DialogShell>
  )
}
