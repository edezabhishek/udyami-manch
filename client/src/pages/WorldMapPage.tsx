import L from 'leaflet'
import { ArrowLeft, Globe2, MapPin, Search, Store, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import type { Business } from '@trek/shared'
import apiClient from '../api/client'
import { businessesApi, COMMUNITY_LABEL } from '../api/udyami'
import Navbar from '../components/Layout/Navbar'
import BusinessDetailDialog from '../components/Udyami/BusinessDetailDialog'
import BusinessFormDialog from '../components/Udyami/BusinessFormDialog'
import { useToast } from '../components/shared/Toast'
import { useSettingsStore } from '../store/settingsStore'
import type { GeoJsonFeatureCollection } from '../types'

/** Common ways people write a country that the map's own names do not cover. */
const COUNTRY_ALIASES: Record<string, string> = {
  usa: 'US', us: 'US', 'u.s.': 'US', 'u.s.a.': 'US', america: 'US', 'united states of america': 'US',
  uk: 'GB', 'u.k.': 'GB', britain: 'GB', 'great britain': 'GB', england: 'GB', scotland: 'GB', wales: 'GB', 'northern ireland': 'GB',
  uae: 'AE', emirates: 'AE', 'south korea': 'KR', korea: 'KR', russia: 'RU', 'czech republic': 'CZ', holland: 'NL',
  nz: 'NZ', aotearoa: 'NZ', aus: 'AU', oz: 'AU', ksa: 'SA', burma: 'MM', 'hong kong': 'HK',
}

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ')

let regionNames: Intl.DisplayNames | null = null
try { regionNames = new Intl.DisplayNames(['en'], { type: 'region' }) } catch { regionNames = null }
/** "New Zealand" for "NZ"; null when the browser cannot name it. */
function displayName(code: string): string | null {
  try { return regionNames?.of(code) ?? null } catch { return null }
}

/** Maps a typed country name to the ISO code of a shape on the map, or null. */
function useCountryResolver(geo: GeoJsonFeatureCollection | null) {
  return useMemo(() => {
    const byName: Record<string, string> = { ...COUNTRY_ALIASES }
    let dn: Intl.DisplayNames | null = null
    try { dn = new Intl.DisplayNames(['en'], { type: 'region' }) } catch { dn = null }
    for (const f of geo?.features ?? []) {
      const p = (f.properties ?? {}) as Record<string, string | undefined>
      const a2 = p.ISO_A2
      if (!a2 || a2.length !== 2) continue
      for (const name of [p.NAME, p.ADMIN, dn?.of(a2)]) if (name) byName[norm(name)] ??= a2
      byName[norm(a2)] ??= a2
    }
    return (country: string): string | null => byName[norm(country)] ?? null
  }, [geo])
}

interface CountryGroup { code: string | null; name: string; businesses: Business[] }

/**
 * World Map: where Nepali and Indian owned businesses are listed. Countries are
 * shaded by how many approved listings they hold; picking one lists its
 * businesses by city.
 */
export default function WorldMapPage() {
  const toast = useToast()
  const dm = useSettingsStore(s => s.settings.dark_mode)
  const dark = dm === true || dm === 'dark' || (dm === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const layerRef = useRef<L.GeoJSON | null>(null)
  const [geo, setGeo] = useState<GeoJsonFeatureCollection | null>(null)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [filter, setFilter] = useState('')
  const [tab, setTab] = useState<'stats' | 'countries'>('stats')
  const [open, setOpen] = useState<Business | null>(null)
  const [editing, setEditing] = useState<Business | null>(null)
  const resolve = useCountryResolver(geo)
  const filterRef = useRef<HTMLInputElement>(null)
  const [params, setParams] = useSearchParams()

  // The phone dock's centre button on this page means "find a country".
  useEffect(() => {
    if (params.get('search') === '1') {
      setSelected(null)
      setTimeout(() => filterRef.current?.focus(), 50)
      setParams(prev => { const next = new URLSearchParams(prev); next.delete('search'); return next }, { replace: true })
    }
  }, [params, setParams])

  const reload = () => businessesApi.list({ scope: 'all' }).then(r => setBusinesses(r.businesses)).catch(() => toast.error('Could not load businesses'))

  useEffect(() => {
    apiClient.get('/udyami/map-geo', { timeout: 30000 }).then(r => setGeo(r.data)).catch(() => setGeo(null))
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** Listings grouped by country, the country key being its ISO code when the map knows it. */
  const groups = useMemo(() => {
    const map = new Map<string, CountryGroup>()
    for (const b of businesses) {
      const code = resolve(b.country)
      const key = code ?? `?${norm(b.country)}`
      const g = map.get(key) ?? { code, name: (code && displayName(code)) || b.country, businesses: [] }
      g.businesses.push(b)
      map.set(key, g)
    }
    return [...map.entries()].sort((a, b) => b[1].businesses.length - a[1].businesses.length)
  }, [businesses, resolve])

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const [, g] of groups) if (g.code) c[g.code] = g.businesses.length
    return c
  }, [groups])
  const max = Math.max(1, ...Object.values(counts))

  // Map setup once.
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return
    const map = L.map(mapRef.current, {
      center: [20, 40], zoom: 2, minZoom: 2, maxZoom: 8, zoomControl: false, attributionControl: false,
      maxBounds: [[-75, -220], [85, 220]], maxBoundsViscosity: 1, preferCanvas: true, worldCopyJump: false,
    })
    L.control.zoom({ position: 'topright' }).addTo(map)
    mapInstance.current = map
    return () => { map.remove(); mapInstance.current = null }
  }, [])

  // Country fills, redrawn when the data, the selection or the theme changes.
  useEffect(() => {
    const map = mapInstance.current
    if (!map || !geo) return
    layerRef.current?.remove()
    const empty = dark ? '#2a2a30' : '#E4ECEF'
    const border = dark ? '#3f3f46' : '#ffffff'
    const layer = L.geoJSON(geo as unknown as GeoJSON.GeoJsonObject, {
      style: (f) => {
        const a2 = (f?.properties as Record<string, string> | undefined)?.ISO_A2 ?? ''
        const n = counts[a2] ?? 0
        const strength = n ? 0.45 + 0.55 * (n / max) : 0
        return {
          fillColor: n ? (dark ? '#47A8FA' : '#1F4455') : empty,
          fillOpacity: n ? strength : 1,
          color: a2 === selected ? (dark ? '#ffffff' : '#F2A900') : border,
          weight: a2 === selected ? 2.5 : 0.6,
        }
      },
      onEachFeature: (f, l) => {
        const p = (f.properties ?? {}) as Record<string, string>
        const n = counts[p.ISO_A2] ?? 0
        l.bindTooltip(`<strong>${(p.NAME ?? '').replace(/</g, '&lt;')}</strong><br/>${n} business${n === 1 ? '' : 'es'}`, { sticky: true, direction: 'top' })
        l.on('click', () => { if (p.ISO_A2) setSelected(s => (s === p.ISO_A2 ? null : p.ISO_A2)) })
      },
    })
    layer.addTo(map)
    layerRef.current = layer
  }, [geo, counts, max, selected, dark])

  /**
   * Bounds of the given countries, from each country's largest polygon only. Its
   * outlying islands would otherwise stretch a box across the date line: New
   * Zealand's Chatham Islands sit east of 180 degrees, which framed the whole world.
   */
  const boundsOf = (codes: string[]): L.LatLngBounds | null => {
    let bounds: L.LatLngBounds | null = null
    for (const f of geo?.features ?? []) {
      const a2 = (f.properties as Record<string, string> | undefined)?.ISO_A2
      if (!a2 || !codes.includes(a2)) continue
      const g = f.geometry as { type: string; coordinates: number[][][] | number[][][][] }
      const polys = (g.type === 'Polygon' ? [g.coordinates] : g.coordinates) as number[][][][]
      let best: number[][] | null = null
      let bestArea = -1
      for (const poly of polys) {
        const ring = poly[0]
        const lngs = ring.map(c => c[0]); const lats = ring.map(c => c[1])
        const area = (Math.max(...lngs) - Math.min(...lngs)) * (Math.max(...lats) - Math.min(...lats))
        if (area > bestArea) { bestArea = area; best = ring }
      }
      if (!best) continue
      const box = L.latLngBounds(best.map(c => [c[1], c[0]] as [number, number]))
      bounds = bounds ? bounds.extend(box) : box
    }
    return bounds
  }

  // Zoom to the picked country; with none picked, frame every country that has listings.
  useEffect(() => {
    const map = mapInstance.current
    if (!map || !geo) return
    const codes = selected ? [selected] : Object.keys(counts)
    const b = boundsOf(codes)
    if (b) map.flyToBounds(b, { paddingTopLeft: [20, 80], paddingBottomRight: [20, Math.round(Math.min(280, window.innerHeight * 0.36))], maxZoom: selected ? 6 : 3, duration: 0.6 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, geo, Object.keys(counts).join(',')])

  const selectedGroup = selected ? groups.find(([, g]) => g.code === selected)?.[1] ?? null : null
  const selectedName = selectedGroup?.name
    ?? (selected ? ((geo?.features.find(f => (f.properties as Record<string, string>)?.ISO_A2 === selected)?.properties as Record<string, string> | undefined)?.NAME ?? selected) : null)

  const byCity = useMemo(() => {
    const m = new Map<string, Business[]>()
    for (const b of selectedGroup?.businesses ?? []) {
      const k = b.city.trim()
      m.set(k, [...(m.get(k) ?? []), b])
    }
    return [...m.entries()].sort((a, b) => b[1].length - a[1].length)
  }, [selectedGroup])

  const totalCountries = groups.length
  const totalCities = useMemo(() => new Set(businesses.map(b => `${norm(b.country)}|${norm(b.city)}`)).size, [businesses])
  const byCommunity = useMemo(() => ({
    nepali: businesses.filter(b => b.community === 'nepali').length,
    indian: businesses.filter(b => b.community === 'indian').length,
    both: businesses.filter(b => b.community === 'both').length,
  }), [businesses])

  // Every country the map knows, so the search finds places with no listings too.
  const allCountries = useMemo(() => {
    const out: { code: string; name: string }[] = []
    for (const f of geo?.features ?? []) {
      const p = (f.properties ?? {}) as Record<string, string | undefined>
      if (p.ISO_A2 && p.ISO_A2.length === 2 && p.NAME) out.push({ code: p.ISO_A2, name: displayName(p.ISO_A2) || p.NAME })
    }
    return out
  }, [geo])
  const suggestions = useMemo(() => {
    const q = norm(filter)
    if (!q) return []
    const alias = COUNTRY_ALIASES[q]
    return allCountries
      .filter(c => c.code === alias || norm(c.name).includes(q))
      .sort((a, b) => (counts[b.code] ?? 0) - (counts[a.code] ?? 0) || a.name.localeCompare(b.name))
      .slice(0, 6)
  }, [filter, allCountries, counts])
  const pick = (code: string) => { setSelected(code); setFilter('') }

  const replace = (b: Business) => { setBusinesses(list => list.map(x => (x.id === b.id ? b : x))); setOpen(o => (o?.id === b.id ? b : o)) }
  const toggleSave = async (b: Business) => {
    try { replace((b.saved ? await businessesApi.unsave(b.id) : await businessesApi.save(b.id)).business) } catch { toast.error('Could not update saved businesses') }
  }
  const remove = async (b: Business) => {
    if (!window.confirm(`Delete "${b.name}" from the directory?`)) return
    try { await businessesApi.remove(b.id); setOpen(null); reload() } catch { toast.error('Could not delete the listing') }
  }
  const review = async (b: Business, status: 'approved' | 'rejected') => {
    try { await businessesApi.setStatus(b.id, status); setOpen(null); reload() } catch { toast.error('Could not update the listing') }
  }

  const stat = (n: number, label: string) => (
    <div className="flex min-w-[64px] flex-col items-center">
      <span className="text-[22px] font-bold leading-none text-content">{n}</span>
      <span className="mt-1 text-[10px] font-semibold uppercase tracking-[.08em] text-content-muted">{label}</span>
    </div>
  )

  return (
    <div className="h-screen overflow-hidden bg-surface">
      <Navbar />
      <div className="fixed inset-x-0 bottom-0" style={{ top: 'var(--nav-h)' }}>
        <div ref={mapRef} className="absolute inset-0" style={{ background: dark ? '#121215' : '#F7FAFB', zIndex: 1 }} />

        {/* Search, centred over the map */}
        <div className="pointer-events-none absolute inset-x-0 top-4 z-[500] flex justify-center px-4">
          <div className="pointer-events-auto relative w-full max-w-[480px]">
            <label className="flex items-center gap-2 rounded-full border border-edge bg-surface-card/95 px-4 py-3 shadow-card backdrop-blur">
              <Search size={16} className="text-content-muted" />
              <input
                ref={filterRef}
                value={filter}
                onChange={e => setFilter(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && suggestions[0]) pick(suggestions[0].code) }}
                placeholder="Search a country..."
                aria-label="Search a country"
                className="min-w-0 flex-1 bg-transparent text-body text-content outline-none"
              />
              {filter && <button type="button" onClick={() => setFilter('')} aria-label="Clear"><X size={14} className="text-content-muted" /></button>}
            </label>
            {suggestions.length > 0 && (
              <ul className="absolute inset-x-0 top-full m-0 mt-2 list-none overflow-hidden rounded-[18px] border border-edge bg-surface-card p-1 shadow-card">
                {suggestions.map(c => (
                  <li key={c.code}>
                    <button type="button" onClick={() => pick(c.code)} className="flex w-full items-center gap-3 rounded-[12px] px-3 py-2 text-start hover:bg-surface-hover">
                      <span className="min-w-0 flex-1 truncate text-body text-content">{c.name}</span>
                      <span className="text-caption text-content-muted">{counts[c.code] ?? 0} listed</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Panel, centred along the bottom */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[500] flex justify-center px-3 sm:px-6" style={{ paddingBottom: 'calc(var(--bottom-nav-h, 0px) + 16px)' }}>
          <section className="pointer-events-auto w-full max-w-[1040px] rounded-[24px] border border-edge bg-surface-card/95 p-3 shadow-card backdrop-blur">
            {selected ? (
              <>
                <div className="flex items-center gap-3 px-1 pb-2">
                  <button type="button" onClick={() => setSelected(null)} className="grid h-9 w-9 flex-none place-items-center rounded-full bg-surface-hover" aria-label="Back to the world">
                    <ArrowLeft size={16} />
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-subtitle font-semibold text-content">{selectedName}</div>
                    <div className="text-caption text-content-muted">{selectedGroup?.businesses.length ?? 0} listed</div>
                  </div>
                </div>
                <div className="max-h-[38vh] overflow-y-auto px-1">
                  {byCity.length === 0 && (
                    <div className="flex flex-col items-center gap-2 py-8 text-center">
                      <Store size={26} className="text-content-faint" />
                      <p className="m-0 text-body text-content-secondary">No businesses listed here yet.</p>
                    </div>
                  )}
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {byCity.map(([city, list]) => (
                      <div key={city}>
                        <div className="mb-2 flex items-center gap-1 text-caption font-semibold uppercase tracking-[.06em] text-content-muted">
                          <MapPin size={12} /> {city} · {list.length}
                        </div>
                        <ul className="m-0 flex list-none flex-col gap-2 p-0">
                          {list.map(b => (
                            <li key={b.id}>
                              <button type="button" onClick={() => setOpen(b)} className="flex w-full items-center gap-3 rounded-[12px] border border-edge bg-surface-card px-3 py-2 text-start hover:bg-surface-hover">
                                <span className="grid h-9 w-9 flex-none place-items-center rounded-[10px] bg-accent-subtle text-accent-on"><Store size={16} /></span>
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-body font-semibold text-content">{b.name}</span>
                                  <span className="block truncate text-caption text-content-muted">{b.category} · {COMMUNITY_LABEL[b.community]}</span>
                                </span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="mb-3 grid grid-cols-2 gap-1 rounded-full bg-surface-hover p-1">
                  {([['stats', 'Stats', Globe2], ['countries', 'Countries', MapPin]] as const).map(([id, label, Icon]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setTab(id)}
                      className={`flex items-center justify-center gap-2 rounded-full px-3 py-2 text-[13px] font-semibold ${tab === id ? 'bg-surface-card text-content shadow-card' : 'text-content-muted'}`}
                    >
                      <Icon size={14} /> {label}
                    </button>
                  ))}
                </div>
                {tab === 'stats' ? (
                  <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 px-2 pb-2 sm:justify-between">
                    <div className="flex items-baseline gap-2 rounded-[16px] bg-accent-subtle px-5 py-3">
                      <span className="text-[40px] font-bold leading-none text-accent-on">{totalCountries}</span>
                      <span className="text-body text-content-secondary">{totalCountries === 1 ? 'Country' : 'Countries'}</span>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
                      {stat(businesses.length, 'Businesses')}
                      {stat(totalCities, 'Cities')}
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
                      {stat(byCommunity.nepali, 'Nepali')}
                      {stat(byCommunity.indian, 'Indian')}
                      {stat(byCommunity.both, 'Both')}
                    </div>
                  </div>
                ) : (
                  <div className="max-h-[34vh] overflow-y-auto px-1 pb-1">
                    {groups.length === 0 && <p className="m-0 px-3 py-6 text-center text-body text-content-secondary">No countries with listings yet.</p>}
                    <div className="flex flex-wrap justify-center gap-2">
                      {groups.map(([key, g]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => g.code && setSelected(g.code)}
                          disabled={!g.code}
                          title={g.code ? undefined : 'This country name is not on the map yet'}
                          className="flex items-center gap-2 rounded-full border border-edge bg-surface-card px-3 py-1.5 text-body text-content hover:bg-surface-hover disabled:opacity-60"
                        >
                          {g.name}
                          <span className="rounded-full bg-accent-subtle px-2 py-[1px] text-caption font-semibold text-accent-on">{g.businesses.length}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>

      {open && (
        <BusinessDetailDialog
          business={open}
          onClose={() => setOpen(null)}
          onToggleSave={() => toggleSave(open)}
          onEdit={() => { setEditing(open); setOpen(null) }}
          onDelete={() => remove(open)}
          onReview={status => review(open, status)}
        />
      )}
      {editing && <BusinessFormDialog business={editing} onClose={() => setEditing(null)} onSaved={() => reload()} />}
    </div>
  )
}
