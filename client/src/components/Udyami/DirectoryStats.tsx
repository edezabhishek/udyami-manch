import { useEffect, useState, type CSSProperties } from 'react'
import type { DirectoryStats as Stats } from '@trek/shared'
import { businessesApi } from '../../api/udyami'
import { Skeleton } from '../shared/Skeleton'

/** The numbers row under the spotlight: the directory's reach, then the reader's own. */
export default function DirectoryStats({ refreshKey }: { refreshKey: number }) {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    let alive = true
    businessesApi.stats().then(s => { if (alive) setStats(s) }).catch(() => { if (alive) setStats(null) })
    return () => { alive = false }
  }, [refreshKey])

  const value = (n: number | undefined) => (stats === null ? <Skeleton width={44} height={30} radius={6} /> : n ?? 0)

  return (
    <section className="atlas" style={{ '--atlas-template': '1.5fr 1fr 1fr 1fr', '--atlas-template-m': '1fr 1fr' } as CSSProperties}>
      <div className="atlas-card passport">
        <div className="label">Businesses listed</div>
        <div className="value mono">{value(stats?.businesses)}</div>
        <div className="delta" style={{ color: 'rgba(255,255,255,.65)' }}>Nepali &amp; Indian owned, worldwide</div>
      </div>
      <div className="atlas-card">
        <div className="label">Countries</div>
        <div className="value mono">{value(stats?.countries)}</div>
        <div className="delta">with listings</div>
      </div>
      <div className="atlas-card">
        <div className="label">Cities</div>
        <div className="value mono">{value(stats?.cities)}</div>
        <div className="delta">with listings</div>
      </div>
      <div className="atlas-card">
        <div className="label">Yours</div>
        <div className="value mono">{value(stats?.mine)}</div>
        <div className="delta">
          {stats ? `${stats.saved} saved${stats.pending ? ` · ${stats.pending} to review` : ''}` : ' '}
        </div>
      </div>
    </section>
  )
}
