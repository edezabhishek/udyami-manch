import { useEffect, useState, type CSSProperties } from 'react'
import type { DirectoryStats as Stats } from '@trek/shared'
import { businessesApi } from '../../api/udyami'
import { Skeleton } from '../shared/Skeleton'
import CountryFlag from '../shared/CountryFlag'
import { countryCodeOf } from './CountrySelect'
import { useAuthStore } from '../../store/authStore'

/** The numbers row under the spotlight: the directory's reach, then the reader's own. */
export default function DirectoryStats({ refreshKey }: { refreshKey: number }) {
  const [stats, setStats] = useState<Stats | null>(null)
  const signedIn = useAuthStore(s => !!s.user)

  useEffect(() => {
    let alive = true
    businessesApi.stats().then(s => { if (alive) setStats(s) }).catch(() => { if (alive) setStats(null) })
    return () => { alive = false }
  }, [refreshKey])

  const value = (n: number | undefined) => (stats === null ? <Skeleton width={44} height={30} radius={6} /> : n ?? 0)

  return (
    <section className="atlas" style={{ '--atlas-template': signedIn ? '1.5fr 1fr 1fr 1fr' : '1.5fr 1fr 1fr', '--atlas-template-m': '1fr 1fr' } as CSSProperties}>
      <div className="atlas-card passport">
        <div className="label">Atlas · countries listed</div>
        <div className="value mono">{value(stats?.countries)}<span style={{ fontSize: 15, fontWeight: 500, opacity: 0.6, marginInlineStart: 8 }}>of 195</span></div>
        <div className="delta" style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(255,255,255,.65)' }}>
          {(stats?.country_names ?? []).map(n => countryCodeOf(n)).filter((c): c is string => !!c).slice(0, 4).map(c => <CountryFlag key={c} code={c} size={18} />)}
          {(stats?.country_names.length ?? 0) > 4 && <span style={{ fontSize: 12 }}>+{(stats?.country_names.length ?? 0) - 4}</span>}
          {stats && stats.country_names.length === 0 && <span>Nepali &amp; Indian owned, worldwide</span>}
        </div>
      </div>
      <div className="atlas-card">
        <div className="label">Businesses</div>
        <div className="value mono">{value(stats?.businesses)}</div>
        <div className="delta">listed worldwide</div>
      </div>
      <div className="atlas-card">
        <div className="label">Cities</div>
        <div className="value mono">{value(stats?.cities)}</div>
        <div className="delta">with listings</div>
      </div>
      {signedIn && <div className="atlas-card">
        <div className="label">Yours</div>
        <div className="value mono">{value(stats?.mine)}</div>
        <div className="delta">
          {stats ? `${stats.saved} saved${stats.pending ? ` · ${stats.pending} to review` : ''}` : ' '}
        </div>
      </div>}
    </section>
  )
}
