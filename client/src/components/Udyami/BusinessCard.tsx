import { Bookmark, BookmarkCheck, Clock, MapPin } from 'lucide-react'
import type { Business } from '@trek/shared'
import { COMMUNITY_LABEL } from '../../api/udyami'

/** A stable blue-family wash per business, for listings without a photo. */
export function businessGradient(id: number): string {
  const hues = [200, 205, 210, 195, 215, 190]
  const h = hues[id % hues.length] ?? 205
  return `linear-gradient(135deg, hsl(${h} 46% 26%) 0%, hsl(${h} 50% 16%) 100%)`
}

export function BusinessStatusPill({ status }: { status: Business['status'] }) {
  if (status === 'approved') return null
  const look = status === 'pending'
    ? 'bg-warning-soft text-warning'
    : 'bg-danger-soft text-danger'
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-[2px] text-[11px] font-semibold ${look}`}>
      {status === 'pending' && <Clock size={11} />}{status === 'pending' ? 'In review' : 'Not approved'}
    </span>
  )
}

/** One listing in the Home grid, laid out like the original trip card: cover with the name over it, then three facts. */
export default function BusinessCard({ business, onOpen, onToggleSave }: {
  business: Business
  onOpen: () => void
  onToggleSave: () => void
}) {
  const fact = (label: string, value: string) => (
    <div className="flex min-w-0 flex-1 flex-col items-center px-2">
      <span className="max-w-full truncate text-[15px] font-bold text-content">{value}</span>
      <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[.08em] text-content-faint">{label}</span>
    </div>
  )
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen() } }}
      className="group flex min-w-0 cursor-pointer flex-col overflow-hidden rounded-[20px] border border-edge bg-surface-card shadow-card transition-shadow hover:shadow-elevated"
    >
      <div className="relative h-[210px] flex-none">
        {business.photo_url
          ? <img src={business.photo_url} alt={business.name} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
          : <div className="absolute inset-0" style={{ background: businessGradient(business.id) }} />}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,.62) 0%, rgba(0,0,0,0) 62%)' }} />{/* theme-lint-disable: scrim over the photo */}
        <span className="absolute start-3 top-3 rounded-full bg-black/40 px-2.5 py-[3px] text-[10.5px] font-bold uppercase tracking-[.06em] text-white backdrop-blur-sm">{/* theme-lint-disable: badge on the photo */}
          {COMMUNITY_LABEL[business.community]}
        </span>
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onToggleSave() }}
          aria-label={business.saved ? 'Remove from saved' : 'Save business'}
          title={business.saved ? 'Remove from saved' : 'Save business'}
          className="absolute end-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-black/35 text-white backdrop-blur-sm transition-colors hover:bg-black/50" // theme-lint-disable: control on the photo
        >
          {business.saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
        </button>
        <div className="absolute inset-x-0 bottom-0 flex min-w-0 items-end gap-2 px-4 pb-3 text-white">{/* theme-lint-disable: title over the photo */}
          <h4 className="m-0 min-w-0 flex-1 text-[19px] font-bold leading-tight [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden">{business.name}</h4>
          <BusinessStatusPill status={business.status} />
        </div>
      </div>
      <div className="flex min-w-0 items-center justify-center gap-1 px-4 pt-3 text-caption text-content-muted">
        <MapPin size={12} className="flex-none" />
        <span className="truncate">{[business.address, business.city].filter(Boolean).join(', ')}</span>
      </div>
      <div className="mt-2 flex items-stretch border-t border-edge-faint px-2 py-3">
        {fact('Type', business.category)}
        {fact('City', business.city)}
        {fact('Country', business.country)}
      </div>
    </div>
  )
}
