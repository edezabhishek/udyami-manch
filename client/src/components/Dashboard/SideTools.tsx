import { ArrowRightLeft, Clock, Plus, RefreshCw, X } from 'lucide-react'
import CustomSelect from '../shared/CustomSelect'
import { useTranslation } from '../../i18n'
import { useCurrencyConverter } from './useCurrencyConverter'
import { shortZone, useDashboardTimezones } from './useDashboardTimezones'

/** The Home sidebar tools, shared by the signed-in Home and the public one. */

// ── Currency tool (self-contained, mirrors the design's fx widget) ───────────
export function CurrencyTool(): React.ReactElement {
  const { t } = useTranslation()
  const { from, to, setFrom, setTo, amount, setAmount, currencies, rate, converted, swap, fetchRates: fetchRate } = useCurrencyConverter()
  const ccyOptions = currencies.map(c => ({ value: c, label: c }))

  return (
    <div className="tool">
      <div className="tool-head">
        <div className="tool-title"><RefreshCw size={14} /> {t('dashboard.currency')}</div>
        <button type="button" className="tool-action" aria-label={t('dashboard.aria.refreshRates')} onClick={fetchRate}><RefreshCw size={14} /></button>
      </div>
      <div className="fx-input">
        <div className="fx-field">
          <div className="lbl">{t('dashboard.fx.from')}</div>
          <input className="amt mono" value={amount} onChange={e => setAmount(e.target.value)} inputMode="decimal" />
          <CustomSelect value={from} onChange={v => setFrom(String(v))} options={ccyOptions} searchable size="sm" style={{ marginTop: 6 }} />
        </div>
        <button type="button" className="fx-swap" aria-label={t('dashboard.aria.swapCurrencies')} onClick={swap}><ArrowRightLeft size={14} /></button>
        <div className="fx-field">
          <div className="lbl">{t('dashboard.fx.to')}</div>
          <input className="amt mono" value={converted != null ? converted.toFixed(2) : '—'} readOnly />
          <CustomSelect value={to} onChange={v => setTo(String(v))} options={ccyOptions} searchable size="sm" style={{ marginTop: 6 }} />
        </div>
      </div>
      <div className="fx-rate">
        <span>{rate != null ? `1 ${from} = ${rate.toFixed(4)} ${to}` : t('dashboard.fx.unavailable')}</span>
      </div>
    </div>
  )
}

// ── Timezone tool ────────────────────────────────────────────────────────────
export function TimezoneTool({ locale }: { locale: string }): React.ReactElement {
  const { t } = useTranslation()
  const { zones, adding, setAdding, allZones, addZone, removeZone, timeIn, offsetLabel } = useDashboardTimezones(locale)

  const tzOptions = allZones
    .filter(z => !zones.includes(z))
    .map(z => ({ value: z, label: z.replace(/_/g, ' '), searchLabel: z }))

  return (
    <div className="tool">
      <div className="tool-head">
        <div className="tool-title"><Clock size={14} /> {t('dashboard.timezone')}</div>
        <button type="button" className="tool-action" aria-label={t('dashboard.aria.addTimezone')} onClick={() => setAdding(a => !a)}>
          {adding ? <X size={14} /> : <Plus size={14} />}
        </button>
      </div>
      {adding && (
        <div style={{ marginBottom: 14 }}>
          <CustomSelect value="" onChange={addZone} options={tzOptions} searchable size="sm" placeholder={t('dashboard.tz.searchPlaceholder')} />
        </div>
      )}
      <div className="tz-list">
        {zones.map(tz => (
          <div className="tz-row" key={tz}>
            <div className="tz-dot">{shortZone(tz)[0]?.toUpperCase()}</div>
            <div>
              <div className="tz-city">{shortZone(tz)}</div>
              <div className="tz-sub">{offsetLabel(tz)}</div>
            </div>
            <div className="tz-time mono">{timeIn(tz)}</div>
            <button type="button" className="tz-del" aria-label={t('dashboard.aria.removeTimezone', { city: shortZone(tz) })} onClick={() => removeZone(tz)}><X size={13} /></button>
          </div>
        ))}
        {zones.length === 0 && (
          <div className="tz-empty">{t('dashboard.tz.empty')}</div>
        )}
      </div>
    </div>
  )
}

