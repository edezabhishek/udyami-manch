import { Award, BookOpen, Briefcase, Globe, MapPin, Pencil, Share2, Store, Users } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { useNavigate } from 'react-router'
import type { Spotlight } from '@trek/shared'
import { monthLabel, udyamiApi } from '../../api/udyami'
import { useAuthStore } from '../../store/authStore'
import { DialogButton, DialogFooter, DialogHeader, DialogShell, FooterSpacer, NEUTRAL_TINT } from '../shared/DialogShell'
import { useToast } from '../shared/Toast'
import NominateDialog from './NominateDialog'

/** Deep blue wash for a feature with no photo, and for the nominate card. */
const BRAND_BG = 'linear-gradient(135deg, #1F4455 0%, #183543 55%, #0B1A21 100%)'

const BG_FILL = { position: 'absolute', inset: 0, zIndex: 0, background: BRAND_BG } as const
/** Smaller numbers for the word cells of the boarding-pass strip. */
const CELL_WORD = { fontSize: 'clamp(16px, 1.6vw, 22px)', lineHeight: 1.2 } as const

/** The hero's buttons, styled inline: the dashboard's button reset would otherwise strip a utility fill. */
const CTA = {
  display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 999, padding: '9px 18px',
  background: '#ffffff', color: '#14232B', fontSize: 14, fontWeight: 600, border: 0, cursor: 'pointer',
  boxShadow: '0 1px 2px rgba(0,0,0,.15)',
} as const
const CTA_GHOST = { ...CTA, background: 'transparent', color: '#ffffff', border: '1px solid rgba(255,255,255,.55)', boxShadow: 'none' } as const

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || '?'
}

/**
 * The top of Home: "Udyami of the Month".
 *
 * Shows this month's featured business (or the latest earlier one). Before the
 * first feature exists it invites people to nominate a business instead, so
 * the card is never empty.
 */
export default function UdyamiSpotlightHero({ locale }: { locale?: string }) {
  const navigate = useNavigate()
  const toast = useToast()
  const isAdmin = useAuthStore(s => s.user?.role === 'admin')
  const [spotlight, setSpotlight] = useState<Spotlight | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [nominating, setNominating] = useState(false)
  const [reading, setReading] = useState(false)

  useEffect(() => {
    let alive = true
    udyamiApi.current()
      .then(r => { if (alive) setSpotlight(r.spotlight) })
      .catch(() => { if (alive) setSpotlight(null) })
      .finally(() => { if (alive) setLoaded(true) })
    return () => { alive = false }
  }, [])

  if (!loaded) return <div className="hero-trip" aria-busy="true" style={{ background: BRAND_BG, cursor: 'default' }} />

  const nominateDialog = nominating && <NominateDialog onClose={() => setNominating(false)} />

  if (!spotlight) {
    return (
      <>
        <div className="hero-trip" data-no-press style={{ cursor: 'default' }}>
          <div className="bg" style={BG_FILL} />
          <div className="hero-content">
            <div className="hero-top">
              <div className="hero-badge"><Award size={13} strokeWidth={2.4} style={{ marginInlineEnd: 6 }} />Udyami of the Month</div>
              {isAdmin && (
                <div className="hero-tools">
                  <button type="button" className="hero-tool" aria-label="Set this month's feature" title="Set this month's feature" onClick={() => navigate('/admin?tab=udyami')}>
                    <Pencil size={17} strokeWidth={2.2} />
                  </button>
                </div>
              )}
            </div>
            <div className="hero-title-block">
              <h2 className="hero-title" style={{ fontSize: 'clamp(40px, 5vw, 72px)' }}>Nominate an Udyami</h2>
              <p className="m-0 mt-3 max-w-[560px] text-[15px] leading-relaxed text-white/85">
                Know a Nepali or Indian owned business doing great work, anywhere in the world? Nominate them to be featured here.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button type="button" style={CTA} onClick={() => setNominating(true)}>
                  <Award size={16} strokeWidth={2.4} /> Nominate a business
                </button>
              </div>
            </div>
            <div className="hero-pass-wrap">
              <div className="hero-pass" role="presentation">
                <div className="hero-pass-inner">
                  <div className="pass-cell">
                    <div className="pass-label">Step 1</div>
                    <div className="date-num" style={CELL_WORD}>Nominate</div>
                    <div className="date-month">Anyone, anywhere</div>
                  </div>
                  <div className="pass-cell">
                    <div className="pass-label">Step 2</div>
                    <div className="date-num" style={CELL_WORD}>We review</div>
                    <div className="date-month">With owner's OK</div>
                  </div>
                  <div className="pass-cell">
                    <div className="pass-label">Step 3</div>
                    <div className="date-num" style={CELL_WORD}>Featured</div>
                    <div className="date-month">For one month</div>
                  </div>
                  <div className="pass-cell">
                    <div className="pass-label">December</div>
                    <div className="date-num" style={CELL_WORD}>Award</div>
                    <div className="date-month">Of the Year</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {nominateDialog}
      </>
    )
  }

  const thisYear = new Date().getFullYear()
  const yearsRunning = spotlight.founded_year ? Math.max(0, thisYear - spotlight.founded_year) : null

  const share = async () => {
    const text = `${spotlight.business_name} in ${spotlight.city} is Udyami of the Month on Udyami Manch.`
    const url = spotlight.website ?? window.location.origin
    try {
      if (navigator.share) await navigator.share({ title: 'Udyami of the Month', text, url })
      else { await navigator.clipboard.writeText(`${text} ${url}`); toast.success('Copied to clipboard') }
    } catch { /* the user closed the share sheet */ }
  }

  return (
    <>
      <div className="hero-trip" data-no-press style={{ cursor: 'default' }}>
        {spotlight.photo_url
          ? <img className="bg" src={spotlight.photo_url} alt={spotlight.business_name} />
          : <div className="bg" style={BG_FILL} />}
        <div className="scrim" />
        <div className="hero-content">
          <div className="hero-top">
            <div className="hero-badge">
              <Award size={13} strokeWidth={2.4} style={{ marginInlineEnd: 6 }} />
              Udyami of the Month · {monthLabel(spotlight.month, locale)}
            </div>
            <div className="hero-tools">
              <button type="button" className="hero-tool" aria-label="Share" title="Share" onClick={share}><Share2 size={17} strokeWidth={2.2} /></button>
              {spotlight.website && (
                <a className="hero-tool" href={spotlight.website} target="_blank" rel="noopener noreferrer" aria-label="Visit website" title="Visit website"><Globe size={17} strokeWidth={2.2} /></a>
              )}
              {isAdmin && (
                <button type="button" className="hero-tool" aria-label="Change featured business" title="Change featured business" onClick={() => navigate('/admin?tab=udyami')}>
                  <Pencil size={17} strokeWidth={2.2} />
                </button>
              )}
            </div>
          </div>

          <div className="hero-title-block">
            <h2 className="hero-title">{spotlight.business_name}</h2>
            <div className="mt-5 flex flex-wrap gap-3">
              {spotlight.story && (
                <button type="button" style={CTA} onClick={() => setReading(true)}>
                  <BookOpen size={16} strokeWidth={2.4} /> Read their story
                </button>
              )}
              <button type="button" style={spotlight.story ? CTA_GHOST : CTA} onClick={() => setNominating(true)}>
                <Award size={16} strokeWidth={2.4} /> Nominate a business
              </button>
            </div>
          </div>

          <div className="hero-pass-wrap">
            <div className="hero-pass" role="presentation">
              <div className="hero-pass-inner">
                <div className="pass-cell buddies">
                  <div className="pass-label">Owner</div>
                  <div className="buddies-avatars">
                    {spotlight.owner_photo_url
                      ? <img className="buddy-avatar" src={spotlight.owner_photo_url} alt={spotlight.owner_name} style={{ objectFit: 'cover' }} />
                      : <div className="buddy-avatar" style={{ background: '#1F4455' }}>{initials(spotlight.owner_name)}</div>}
                  </div>
                  <div className="date-month">{spotlight.owner_name}</div>
                </div>
                <div className="pass-cell">
                  <div className="pass-label">Founded</div>
                  <div className="date-num mono">{spotlight.founded_year ?? '—'}</div>
                  <div className="date-month">{yearsRunning !== null ? (yearsRunning === 0 ? 'This year' : `${yearsRunning} year${yearsRunning === 1 ? '' : 's'} running`) : ' '}</div>
                </div>
                <div className="pass-cell">
                  <div className="pass-label"><MapPin size={11} style={{ display: 'inline', marginInlineEnd: 3 }} />Location</div>
                  <div className="date-num" style={CELL_WORD}>{spotlight.city}</div>
                  <div className="date-month">{spotlight.country}</div>
                </div>
                <div className="pass-cell">
                  <div className="pass-label"><Store size={11} style={{ display: 'inline', marginInlineEnd: 3 }} />Business</div>
                  <div className="date-num" style={CELL_WORD}>{spotlight.category}</div>
                  <div className="date-month">
                    {spotlight.staff_count != null
                      ? <><Users size={11} style={{ display: 'inline', marginInlineEnd: 3 }} />{spotlight.staff_count} staff</>
                      : <><Briefcase size={11} style={{ display: 'inline', marginInlineEnd: 3 }} />Nepali &amp; Indian owned</>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {reading && spotlight.story && <StoryDialog spotlight={spotlight} locale={locale} onClose={() => setReading(false)} />}
      {nominateDialog}
    </>
  )
}

function StoryDialog({ spotlight, locale, onClose }: { spotlight: Spotlight; locale?: string; onClose: () => void }) {
  const labelId = useId()
  return (
    <DialogShell
      onClose={onClose}
      labelledBy={labelId}
      width="detail"
      header={
        <DialogHeader
          tile={<Award size={20} />}
          tint={NEUTRAL_TINT}
          labelId={labelId}
          onClose={onClose}
          eyebrow={`Udyami of the Month · ${monthLabel(spotlight.month, locale)}`}
          title={spotlight.business_name}
          sub={`${spotlight.owner_name} · ${spotlight.city}, ${spotlight.country}`}
        />
      }
      footer={
        <DialogFooter>
          <FooterSpacer />
          {spotlight.website && (
            <a className="inline-flex items-center gap-1.5 rounded-[10px] border border-edge px-4 py-2 font-medium text-content no-underline" href={spotlight.website} target="_blank" rel="noopener noreferrer">
              <Globe size={15} /> Website
            </a>
          )}
          <DialogButton variant="primary" onClick={onClose}>Close</DialogButton>
        </DialogFooter>
      }
    >
      {spotlight.story!.split(/\n{2,}/).map((para, i) => (
        <p key={i} className="m-0 whitespace-pre-line text-body leading-relaxed text-content-secondary">{para}</p>
      ))}
    </DialogShell>
  )
}
