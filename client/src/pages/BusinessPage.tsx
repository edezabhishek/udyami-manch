import { ArrowLeft, Globe, MapPin, Phone, Store } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { businessPath, placePath, type Business } from '@trek/shared'
import { businessesApi, COMMUNITY_LABEL } from '../api/udyami'
import Navbar from '../components/Layout/Navbar'
import { businessGradient } from '../components/Udyami/BusinessCard'
import LocationPicker from '../components/Udyami/LocationPicker'

/** One business on a page of its own: the address a search engine, a share link or a bookmark can point at. */
export default function BusinessPage() {
  const { slug = '' } = useParams()
  const id = Number(slug.split('-')[0])
  const [business, setBusiness] = useState<Business | null | undefined>(undefined)

  useEffect(() => {
    let alive = true
    if (!Number.isInteger(id)) { setBusiness(null); return }
    businessesApi.get(id).then(r => { if (alive) setBusiness(r.business) }).catch(() => { if (alive) setBusiness(null) })
    return () => { alive = false }
  }, [id])

  useEffect(() => {
    if (!business) return
    const before = document.title
    document.title = `${business.name}, ${business.city} | ${COMMUNITY_LABEL[business.community]} ${business.category} | Udyami Manch`
    return () => { document.title = before }
  }, [business])

  const ROW = 'flex items-start gap-3 text-body text-content'
  const where = business ? (business.latitude != null && business.longitude != null ? `${business.latitude},${business.longitude}` : [business.name, business.address, business.city, business.country].filter(Boolean).join(', ')) : ''
  const q = encodeURIComponent(where)
  const link = 'inline-flex items-center gap-1.5 rounded-full border border-edge px-4 py-2 text-caption font-semibold text-content no-underline hover:bg-surface-hover'

  return (
    <div className="min-h-screen bg-surface-secondary">
      <Navbar />
      <main className="mx-auto w-full max-w-[860px] px-4 pb-16" style={{ paddingTop: 'calc(var(--nav-h) + 20px)' }}>
        {business === undefined && <div className="py-20 text-center text-content-muted">Loading…</div>}
        {business === null && (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <Store size={30} className="text-content-faint" />
            <h1 className="m-0 text-title font-bold text-content">Business not found</h1>
            <Link to="/" className="text-accent-on">Browse the directory</Link>
          </div>
        )}
        {business && (
          <>
            <nav className="mb-3 flex flex-wrap items-center gap-1 text-caption text-content-muted" aria-label="Breadcrumb">
              <Link to="/" className="inline-flex items-center gap-1 text-content-muted no-underline hover:underline"><ArrowLeft size={13} /> Udyami Manch</Link>
              <span>›</span>
              <Link to={placePath(business.country)} className="text-content-muted no-underline hover:underline">{business.country}</Link>
              <span>›</span>
              <Link to={placePath(business.country, business.city)} className="text-content-muted no-underline hover:underline">{business.city}</Link>
            </nav>
            <article className="overflow-hidden rounded-[24px] border border-edge bg-surface-card shadow-card">
              <div className="relative h-[220px]">
                {business.photo_url ? <img src={business.photo_url} alt={business.name} className="absolute inset-0 h-full w-full object-cover" /> : <div className="absolute inset-0" style={{ background: businessGradient(business.id) }} />}
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,.62), rgba(0,0,0,0) 62%)' }} />{/* theme-lint-disable: scrim over the photo */}
                <div className="absolute inset-x-0 bottom-0 px-6 pb-5 text-white">{/* theme-lint-disable: title over the photo */}
                  <span className="mb-2 inline-block rounded-full bg-black/40 px-2.5 py-[3px] text-[10.5px] font-bold uppercase tracking-[.06em] backdrop-blur-sm">{COMMUNITY_LABEL[business.community]}</span>
                  <h1 className="m-0 text-[28px] font-bold leading-tight">{business.name}</h1>
                </div>
              </div>
              <div className="flex flex-col gap-4 p-6">
                <p className="m-0 text-body text-content-secondary">{COMMUNITY_LABEL[business.community]} {business.category.toLowerCase()} in {business.city}, {business.country}.</p>
                {business.description && <p className="m-0 text-body text-content">{business.description}</p>}
                <div className="flex flex-col gap-2">
                  <div className={ROW}><MapPin size={16} className="mt-[3px] flex-none text-content-muted" /><span>{[business.address, business.city, business.country].filter(Boolean).join(', ')}</span></div>
                  {business.phone && <div className={ROW}><Phone size={16} className="mt-[3px] flex-none text-content-muted" /><a className="text-accent-on no-underline hover:underline" href={`tel:${business.phone.replace(/[^+\d]/g, '')}`}>{business.phone}</a></div>}
                  {business.website && <div className={ROW}><Globe size={16} className="mt-[3px] flex-none text-content-muted" /><a className="truncate text-accent-on no-underline hover:underline" href={business.website} target="_blank" rel="noopener noreferrer nofollow">{business.website.replace(/^https?:\/\//, '')}</a></div>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <a className={link} href={`https://www.google.com/maps/search/?api=1&query=${q}`} target="_blank" rel="noopener noreferrer"><MapPin size={14} /> Open in Google Maps</a>
                  <a className={link} href={`https://www.google.com/maps/dir/?api=1&destination=${q}`} target="_blank" rel="noopener noreferrer">Get directions</a>
                </div>
                {business.latitude != null && business.longitude != null && (
                  <LocationPicker latitude={business.latitude} longitude={business.longitude} onChange={() => {}} readOnly height={260} />
                )}
              </div>
            </article>
          </>
        )}
      </main>
    </div>
  )
}
