import { Award, Calendar, MapPin, Store } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import type { Spotlight } from '@trek/shared'
import { monthLabel, udyamiApi } from '../../api/udyami'
import NominateDialog from './NominateDialog'

const BRAND_BG = 'linear-gradient(135deg, #1F4455 0%, #183543 55%, #0B1A21 100%)'

function Pill({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1 rounded-full bg-white/[.16] px-2 py-[3px] text-[0.6875rem] font-semibold text-white">
      {icon}<span className="truncate">{label}</span>
    </span>
  )
}

/** Phone version of "Udyami of the Month" for the top of Home. */
export default function MUdyamiSpotlight({ locale }: { locale?: string }) {
  const [spotlight, setSpotlight] = useState<Spotlight | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [nominating, setNominating] = useState(false)

  useEffect(() => {
    let alive = true
    udyamiApi.current()
      .then(r => { if (alive) setSpotlight(r.spotlight) })
      .catch(() => { if (alive) setSpotlight(null) })
      .finally(() => { if (alive) setLoaded(true) })
    return () => { alive = false }
  }, [])

  const card = 'relative h-[300px] overflow-hidden rounded-[26px] shadow-[0_24px_56px_-22px_rgba(0,0,0,.5)]'
  if (!loaded) return <div className={card} style={{ background: BRAND_BG }} aria-busy="true" />

  const button = (
    <button
      type="button"
      onClick={() => setNominating(true)}
      className="mt-[10px] inline-flex items-center gap-[6px] rounded-full bg-white px-[14px] py-[7px] text-[0.8125rem] font-semibold text-[#14232B]" // theme-lint-disable: white pill on the brand card
    >
      <Award size={14} strokeWidth={2.4} /> Nominate a business
    </button>
  )

  return (
    <>
      <div className={card}>
        {spotlight?.photo_url
          ? <img src={spotlight.photo_url} alt={spotlight.business_name} className="absolute inset-0 h-full w-full object-cover" />
          : <div className="absolute inset-0" style={{ background: BRAND_BG }} />}
        <div className="absolute bottom-[10px] inset-x-[10px] rounded-[18px] border border-white/[.16] bg-[rgba(11,26,33,.55)] p-[12px_14px] text-white backdrop-blur-[22px] backdrop-saturate-[1.6]">{/* theme-lint-disable: fixed dark glass on the card */}
          <span className="inline-flex items-center gap-1 rounded-full bg-white/[.92] px-2 py-[3px] text-[0.625rem] font-bold uppercase tracking-[.07em] text-[#14232B]">{/* theme-lint-disable: fixed badge */}
            <Award size={10} strokeWidth={2.6} />
            {spotlight ? `Udyami of the Month · ${monthLabel(spotlight.month, locale)}` : 'Udyami of the Month'}
          </span>
          {spotlight ? (
            <>
              <div className="mt-[7px] truncate text-[1.4375rem] font-bold">{spotlight.business_name}</div>
              <div className="mt-[2px] truncate text-[0.8125rem] text-white/80">{spotlight.owner_name}</div>
              <div className="mt-[9px] flex flex-wrap gap-[6px]">
                <Pill icon={<MapPin size={11} strokeWidth={2.2} />} label={`${spotlight.city}, ${spotlight.country}`} />
                <Pill icon={<Store size={11} strokeWidth={2.2} />} label={spotlight.category} />
                {spotlight.founded_year && <Pill icon={<Calendar size={11} strokeWidth={2.2} />} label={`Since ${spotlight.founded_year}`} />}
              </div>
            </>
          ) : (
            <>
              <div className="mt-[7px] text-[1.4375rem] font-bold">Nominate an Udyami</div>
              <div className="mt-[2px] text-[0.8125rem] leading-snug text-white/80">
                Know a Nepali or Indian owned business doing great work? Nominate them to be featured here.
              </div>
              {button}
            </>
          )}
        </div>
      </div>
      {nominating && <NominateDialog onClose={() => setNominating(false)} />}
    </>
  )
}
