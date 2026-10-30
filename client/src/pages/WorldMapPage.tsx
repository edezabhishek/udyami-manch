import L from 'leaflet'
import { ArrowLeft, Globe, MapPin, Store, Tag } from 'lucide-react'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import type { Business } from '@trek/shared'
import apiClient from '../api/client'
import { businessesApi, COMMUNITY_LABEL } from '../api/udyami'
import Navbar from '../components/Layout/Navbar'
import { useGlassGlare } from '../components/Atlas/useGlassGlare'
import CountryFlag from '../components/shared/CountryFlag'
import { useTranslation } from '../i18n'
import AtlasCountrySearch from './atlas/AtlasCountrySearch'
import BusinessDetailDialog from '../components/Udyami/BusinessDetailDialog'
import BusinessFormDialog from '../components/Udyami/BusinessFormDialog'
import { attachVectorBasemap, detachBasemapLayer, restyleBasemap, type BasemapLayer } from '../components/Map/VectorBasemap'
import { OFM_DARK, OFM_POSITRON } from '../constants/mapDefaults'
import { useTileUrl } from '../hooks/useTileUrl'
import { CONTINENT_MAP } from '@trek/shared'
import { useToast } from '../components/shared/Toast'
import { useSettingsStore } from '../store/settingsStore'
import type { GeoJsonFeatureCollection } from '../types'

const PIN = L.divIcon({
  className: '',
  html: '<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;background:#1F4455;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35);transform:rotate(-45deg);margin:-26px 0 0 -13px"></div>',
  iconSize: [0, 0],
})

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
 * Atlas: where Nepali and Indian owned businesses are listed. Countries are
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
  const pinsRef = useRef<L.LayerGroup | null>(null)
  const glLayerRef = useRef<BasemapLayer | null>(null)
  // The same free OpenFreeMap background the original Atlas draws, light or dark.
  const tileUrl = useTileUrl(dark ? OFM_DARK : OFM_POSITRON, true)
  const tileUrlRef = useRef(tileUrl)
  tileUrlRef.current = tileUrl
  // Zoomed in far enough for street tiles, which is also when listings show as pins.
  const [street, setStreet] = useState(false)
  const [geo, setGeo] = useState<GeoJsonFeatureCollection | null>(null)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [filter, setFilter] = useState('')
  const [results, setResults] = useState<{ code: string; label: string }[]>([])
  const [searchOpen, setSearchOpen] = useState(false)
  const { t } = useTranslation()
  const glare = useGlassGlare(dark)
  const [tab, setTab] = useState<'stats' | 'countries' | 'categories'>('stats')
  const [open, setOpen] = useState<Business | null>(null)
  const [editing, setEditing] = useState<Business | null>(null)
  const resolve = useCountryResolver(geo)
  const [params, setParams] = useSearchParams()

  // The phone dock's centre button used to open the country search; the search is always on screen now.
  useEffect(() => {
    if (params.get('search') === '1') setParams(prev => { const next = new URLSearchParams(prev); next.delete('search'); return next }, { replace: true })
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
      center: [25, 0], zoom: 3, minZoom: 3, maxZoom: 18, zoomControl: false, attributionControl: false,
      maxBounds: [[-90, -220], [90, 220]], maxBoundsViscosity: 1, fadeAnimation: false, preferCanvas: true, worldCopyJump: false,
    })
    L.control.zoom({ position: 'bottomright' }).addTo(map)
    // Per run, not a shared flag: the basemap loads asynchronously and a map that has
    // already been torn down (a dev double mount, a quick navigation) must not get a layer.
    let cancelled = false
    void attachVectorBasemap(map, tileUrlRef.current, glLayerRef, () => cancelled)
    pinsRef.current = L.layerGroup().addTo(map)
    map.on('zoomend', () => setStreet(map.getZoom() >= 6))
    mapInstance.current = map
    return () => {
      cancelled = true
      detachBasemapLayer(glLayerRef.current)
      glLayerRef.current = null
      map.remove()
      mapInstance.current = null
    }
  }, [])

  // Light and dark switch in place, without rebuilding the map.
  useEffect(() => {
    if (glLayerRef.current) restyleBasemap(glLayerRef.current, tileUrl)
  }, [tileUrl])

  // Country fills, redrawn when the data, the selection or the theme changes.
  useEffect(() => {
    const map = mapInstance.current
    if (!map || !geo) return
    layerRef.current?.remove()
    const empty = dark ? '#1e1e2e' : '#e2e8f0'
    const border = dark ? '#333333' : '#cbd5e1'
    const layer = L.geoJSON(geo as unknown as GeoJSON.GeoJsonObject, {
      style: (f) => {
        const a2 = (f?.properties as Record<string, string> | undefined)?.ISO_A2 ?? ''
        const n = counts[a2] ?? 0
        const strength = n ? 0.45 + 0.55 * (n / max) : 0
        return {
          fillColor: n ? (dark ? '#47A8FA' : '#1F4455') : empty,
          // Zoomed in, the fill gets out of the way of the streets underneath.
          fillOpacity: street ? (n ? 0.12 : 0) : (n ? Math.max(0.55, strength) : 0.3),
          color: a2 === selected ? (dark ? '#ffffff' : '#F2A900') : (street ? 'rgba(0,0,0,0.25)' : border),
          weight: a2 === selected ? 2.5 : (street ? 1 : 0.6),
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
  }, [geo, counts, max, selected, dark, street])

  // A pin for every listing that has a location, once the map is zoomed in far enough to use it.
  useEffect(() => {
    const group = pinsRef.current
    if (!group) return
    group.clearLayers()
    if (!street) return
    for (const b of businesses) {
      if (b.latitude == null || b.longitude == null) continue
      const pin = L.marker([b.latitude, b.longitude], { icon: PIN, riseOnHover: true })
      pin.bindTooltip(`<strong>${b.name.replace(/</g, '&lt;')}</strong><br/>${b.category.replace(/</g, '&lt;')}`, { direction: 'top', offset: [0, -28] })
      pin.on('click', () => setOpen(b))
      pin.addTo(group)
    }
  }, [businesses, street])

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
      // Every sizeable island, none of the tiny outliers: New Zealand's Chatham Islands sit
      // east of 180 degrees and would stretch the box across the date line.
      const rings = polys.map(poly => {
        const ring = poly[0]
        const lngs = ring.map(c => c[0]); const lats = ring.map(c => c[1])
        return { ring, area: (Math.max(...lngs) - Math.min(...lngs)) * (Math.max(...lats) - Math.min(...lats)) }
      })
      const biggest = Math.max(...rings.map(r => r.area))
      for (const { ring, area } of rings) {
        if (area < biggest * 0.15) continue
        const box = L.latLngBounds(ring.map(c => [c[1], c[0]] as [number, number]))
        bounds = bounds ? bounds.extend(box) : box
      }
    }
    return bounds
  }

  // Zoom to the picked country; with none picked, frame every country that has listings.
  useEffect(() => {
    const map = mapInstance.current
    if (!map || !geo) return
    const codes = selected ? [selected] : Object.keys(counts)
    const b = boundsOf(codes)
    if (b) map.flyToBounds(b, { paddingTopLeft: [20, 80], paddingBottomRight: [20, Math.round(Math.min(280, window.innerHeight * 0.36))], maxZoom: selected ? 5 : 3, duration: 0.6 })
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

  // Listed countries by continent, and listings by type of business.
  const byContinent = useMemo(() => {
    const c: Record<string, number> = {}
    for (const [, g] of groups) if (g.code) { const k = CONTINENT_MAP[g.code]; if (k) c[k] = (c[k] ?? 0) + 1 }
    return c
  }, [groups])
  const byCategory = useMemo(() => {
    const m = new Map<string, number>()
    for (const b of businesses) { const k = b.category.trim() || 'Other'; m.set(k, (m.get(k) ?? 0) + 1) }
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }, [businesses])

  // Every country the map knows, so the search finds places with no listings too.
  const allCountries = useMemo(() => {
    const out: { code: string; name: string }[] = []
    for (const f of geo?.features ?? []) {
      const p = (f.properties ?? {}) as Record<string, string | undefined>
      if (p.ISO_A2 && p.ISO_A2.length === 2 && p.NAME) out.push({ code: p.ISO_A2, name: displayName(p.ISO_A2) || p.NAME })
    }
    return out
  }, [geo])
  const options = useMemo(() => allCountries.map(c => ({ code: c.code, label: c.name })).sort((a, b) => a.label.localeCompare(b.label)), [allCountries])
  const pick = (code: string) => { setSelected(code); setFilter(''); setResults([]); setSearchOpen(false) }

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

  const bg = (o: number) => (dark ? `rgba(255,255,255,${o})` : `rgba(0,0,0,${o})`)
  const tp = dark ? '#f1f5f9' : '#0f172a'
  const tm = dark ? '#94a3b8' : '#64748b'
  const tf = dark ? '#475569' : '#94a3b8'
  const noTransparency = typeof document !== 'undefined' && document.documentElement.hasAttribute('data-no-transparency')
  // The same glass the original Atlas panel is cut from.
  const glassPanel: React.CSSProperties = {
    background: noTransparency ? (dark ? '#15151c' : '#ffffff') : (dark ? 'rgba(10,10,15,0.55)' : 'rgba(255,255,255,0.2)'),
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    border: '1px solid ' + (dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
    borderRadius: 20,
    boxShadow: dark ? '0 8px 32px rgba(0,0,0,0.3)' : '0 8px 32px rgba(0,0,0,0.08)',
  }

  const stat = (n: number, label: string) => (
    <div className="flex shrink-0 flex-col items-center justify-center px-3 py-5">
      <span className="text-2xl font-black tabular-nums leading-none" style={{ color: tp }}>{n}</span>
      <span className="mt-1.5 whitespace-nowrap text-[9px] font-semibold uppercase tracking-wide" style={{ color: tf }}>{label}</span>
    </div>
  )

  const tabBar = (
    <div style={{ display: 'flex', gap: 4, padding: '12px 16px 0', marginBottom: 4 }}>
      {([['stats', 'Stats', Globe], ['countries', 'Countries', MapPin], ['categories', 'Categories', Tag]] as const).map(([id, label, Icon]) => (
        <button
          type="button" key={id} onClick={() => setTab(id)}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            padding: '7px 0', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 600, transition: 'all 0.15s',
            background: tab === id ? bg(0.1) : 'transparent', color: tab === id ? tp : tf,
          }}
        >
          <Icon size={13} /> {label}
        </button>
      ))}
    </div>
  )

  return (
    <div className="h-screen overflow-hidden bg-surface">
      <Navbar />
      <div style={{ position: 'fixed', top: 'var(--nav-h)', insetInline: 0, bottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div ref={mapRef} style={{ position: 'absolute', inset: 0, zIndex: 1, background: dark ? '#1a1a2e' : '#f0f0f0' }} />

        {/* Search, centred over the map: the original Atlas search box */}
        <AtlasCountrySearch
          dark={dark}
          t={t}
          search={filter}
          setSearch={setFilter}
          results={results}
          setResults={setResults}
          open={searchOpen}
          setOpen={setSearchOpen}
          options={options}
          onSelect={pick}
          placeResults={[]}
          placesLoading={false}
          onQueryChange={() => {}}
          onSelectPlace={() => {}}
        />

        {/* Panel, bottom centre, in the original Atlas glass */}
        <div className="pointer-events-none absolute inset-x-0 z-10 flex justify-center px-3 sm:px-5" style={{ bottom: 'calc(var(--bottom-nav-h, 0px) + 16px)' }}>
          <div
            ref={glare.panelRef}
            onMouseMove={glare.onMouseMove}
            onMouseLeave={glare.onMouseLeave}
            className="pointer-events-auto relative flex max-w-full flex-col overflow-hidden"
            style={{ ...glassPanel, width: 'fit-content', minWidth: 'min(100%, 420px)', maxWidth: 'min(1100px, 100%)' }}
          >
            <div ref={glare.glareRef} className="pointer-events-none absolute inset-0" style={{ opacity: 0, transition: 'opacity 0.3s ease', borderRadius: 20 }} />
            <div ref={glare.borderGlareRef} className="pointer-events-none absolute inset-0" style={{ opacity: 0, transition: 'opacity 0.3s ease', borderRadius: 20, border: dark ? '1.5px solid rgba(255,255,255,0.5)' : '2px solid rgba(0,0,0,0.15)' }} />

            {selected ? (
              <>
                <div className="flex items-center gap-3 px-4 pt-3">
                  <button type="button" onClick={() => setSelected(null)} className="grid h-9 w-9 flex-none place-items-center rounded-full" style={{ background: bg(0.08), color: tp }} aria-label="Back to the world">
                    <ArrowLeft size={16} />
                  </button>
                  <CountryFlag code={selected} size={30} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold" style={{ color: tp }}>{selectedName}</p>
                    <p className="text-[11px]" style={{ color: tm }}>{selectedGroup?.businesses.length ?? 0} listed</p>
                  </div>
                </div>
                <div className="max-h-[36vh] overflow-y-auto px-4 pb-4 pt-3">
                  {byCity.length === 0 && (
                    <div className="flex flex-col items-center gap-2 py-6 text-center">
                      <Store size={24} style={{ color: tf }} />
                      <p className="m-0 text-sm" style={{ color: tm }}>No businesses listed here yet.</p>
                    </div>
                  )}
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {byCity.map(([city, list]) => (
                      <div key={city}>
                        <div className="mb-2 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide" style={{ color: tf }}>
                          <MapPin size={11} /> {city} · {list.length}
                        </div>
                        <ul className="m-0 flex list-none flex-col gap-2 p-0">
                          {list.map(b => (
                            <li key={b.id}>
                              <button type="button" onClick={() => setOpen(b)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-start transition-opacity hover:opacity-80" style={{ background: bg(0.07) }}>
                                <span className="grid h-9 w-9 flex-none place-items-center rounded-[10px]" style={{ background: bg(0.1), color: tp }}><Store size={16} /></span>
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-sm font-semibold" style={{ color: tp }}>{b.name}</span>
                                  <span className="block truncate text-[11px]" style={{ color: tm }}>{b.category} · {COMMUNITY_LABEL[b.community]}</span>
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
                {tabBar}
                {/* Both tabs always rendered so the wider one sets the panel width */}
                <div style={{ display: 'grid' }}>
                  <div style={tab !== 'stats' ? { visibility: 'hidden', gridArea: '1/1' } : { gridArea: '1/1' }}>
                    <div className="flex flex-wrap items-stretch justify-center">
                      <div className="mx-2 my-2 flex flex-col justify-center rounded-xl px-5 py-4" style={{ background: bg(0.08) }}>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-5xl font-black tabular-nums leading-none" style={{ color: tp }}>{totalCountries}</span>
                          <span className="text-sm font-medium" style={{ color: tm }}>{totalCountries === 1 ? 'Country' : 'Countries'}</span>
                        </div>
                      </div>
                      {stat(businesses.length, businesses.length === 1 ? 'Business' : 'Businesses')}
                      {stat(totalCities, totalCities === 1 ? 'City' : 'Cities')}
                      {stat(byCommunity.nepali, 'Nepali')}
                      {stat(byCommunity.indian, 'Indian')}
                      {stat(byCommunity.both, 'Both')}
                      <div className="hidden sm:block" style={{ width: 2, background: bg(0.08), margin: '12px 14px' }} />
                      <div className="flex items-center gap-4 px-3 py-4">
                        {(['Europe', 'Asia', 'North America', 'South America', 'Africa', 'Oceania'] as const).map(cont => {
                          const count = byContinent[cont] ?? 0
                          return (
                            <div key={cont} className="flex shrink-0 flex-col items-center">
                              <span className="text-2xl font-black tabular-nums leading-none" style={{ color: count ? tp : bg(0.15) }}>{count}</span>
                              <span className="mt-1.5 whitespace-nowrap text-[9px] font-semibold uppercase tracking-wide" style={{ color: count ? tf : bg(0.1) }}>{cont}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                  <div style={tab !== 'countries' ? { visibility: 'hidden', gridArea: '1/1' } : { gridArea: '1/1' }}>
                    <div className="flex items-stretch overflow-x-auto px-2" style={{ maxWidth: 'min(920px, calc(100vw - 40px))' }}>
                      {groups.length === 0 && (
                        <div className="flex items-center justify-center px-6 py-5 text-sm" style={{ color: tf }}>No countries with listings yet.</div>
                      )}
                      {groups.map(([key, g]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => g.code && setSelected(g.code)}
                          disabled={!g.code}
                          title={g.code ? undefined : 'This country name is not on the map yet'}
                          className="flex min-w-[84px] shrink-0 flex-col items-center justify-center px-3.5 py-3 transition-opacity hover:opacity-75 disabled:opacity-60"
                        >
                          {g.code ? <span className="mb-1"><CountryFlag code={g.code} size={26} /></span> : <MapPin size={16} style={{ color: tf }} className="mb-1" />}
                          <span className="max-w-[96px] truncate text-xs font-semibold" style={{ color: tp }}>{g.name}</span>
                          <span className="mt-0.5 text-[10px]" style={{ color: tf }}>{g.businesses.length} listed</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={tab !== 'categories' ? { visibility: 'hidden', gridArea: '1/1' } : { gridArea: '1/1' }}>
                    <div className="flex items-stretch overflow-x-auto px-2" style={{ maxWidth: 'min(920px, calc(100vw - 40px))' }}>
                      {byCategory.length === 0 && (
                        <div className="flex items-center justify-center px-6 py-5 text-sm" style={{ color: tf }}>No businesses listed yet.</div>
                      )}
                      {byCategory.map(([name, n]) => (
                        <div key={name} className="flex min-w-[92px] shrink-0 flex-col items-center justify-center px-3.5 py-4">
                          <span className="text-2xl font-black tabular-nums leading-none" style={{ color: tp }}>{n}</span>
                          <span className="mt-1.5 max-w-[110px] truncate text-[10px] font-semibold uppercase tracking-wide" style={{ color: tf }}>{name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
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
