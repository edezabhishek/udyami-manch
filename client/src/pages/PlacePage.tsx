import { Store } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { businessPath, placePath, slugify, type Business } from '@trek/shared'
import { businessesApi } from '../api/udyami'
import Navbar from '../components/Layout/Navbar'
import BusinessCard from '../components/Udyami/BusinessCard'

/** The businesses in one country, or in one city of it, on a page of their own. */
export default function PlacePage() {
  const { country = '', city } = useParams()
  const navigate = useNavigate()
  const [all, setAll] = useState<Business[] | null>(null)

  useEffect(() => {
    let alive = true
    businessesApi.list({ scope: 'all' }).then(r => { if (alive) setAll(r.businesses) }).catch(() => { if (alive) setAll([]) })
    return () => { alive = false }
  }, [])

  const list = useMemo(() => (all ?? []).filter(b => slugify(b.country) === country && (!city || slugify(b.city) === city)), [all, country, city])
  const countryName = list[0]?.country ?? country
  const cityName = city ? list[0]?.city ?? city : null
  const cities = useMemo(() => [...new Map((all ?? []).filter(b => slugify(b.country) === country).map(b => [slugify(b.city), b.city] as const)).values()].sort(), [all, country])
  const name = cityName ? `${cityName}, ${countryName}` : countryName

  useEffect(() => {
    if (!list.length) return
    const before = document.title
    document.title = `Nepali and Indian owned businesses in ${name} | Udyami Manch`
    return () => { document.title = before }
  }, [list.length, name])

  return (
    <div className="min-h-screen bg-surface-secondary">
      <Navbar />
      <main className="mx-auto w-full max-w-[1080px] px-4 pb-16" style={{ paddingTop: 'calc(var(--nav-h) + 20px)' }}>
        <nav className="mb-3 flex flex-wrap items-center gap-1 text-caption text-content-muted" aria-label="Breadcrumb">
          <Link to="/" className="text-content-muted no-underline hover:underline">Udyami Manch</Link>
          {cityName && <><span>›</span><Link to={placePath(countryName)} className="text-content-muted no-underline hover:underline">{countryName}</Link></>}
        </nav>
        {all === null && <div className="py-20 text-center text-content-muted">Loading…</div>}
        {all !== null && list.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <Store size={30} className="text-content-faint" />
            <h1 className="m-0 text-title font-bold text-content">Nothing listed here yet</h1>
            <Link to="/" className="text-accent-on">Browse the directory</Link>
          </div>
        )}
        {list.length > 0 && (
          <>
            <h1 className="m-0 text-title font-bold text-content">Nepali and Indian owned businesses in {name}</h1>
            <p className="m-0 mb-5 mt-1 text-body text-content-muted">{list.length} {list.length === 1 ? 'business' : 'businesses'} owned and run by Nepali and Indian people.</p>
            {!cityName && cities.length > 1 && (
              <div className="mb-5 flex flex-wrap gap-2">
                {cities.map(c => <Link key={c} to={placePath(countryName, c)} className="rounded-full border border-edge bg-surface-card px-3 py-1 text-caption font-semibold text-content no-underline hover:bg-surface-hover">{c}</Link>)}
              </div>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {list.map(b => <BusinessCard key={b.id} business={b} onOpen={() => navigate(businessPath(b))} onToggleSave={() => navigate(businessPath(b))} />)}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
