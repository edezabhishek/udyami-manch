import { useMemo } from 'react'

/** Countries on the World Map, plus a few territories with large communities. */
const CODES = (
  'AD AE AF AG AL AM AO AR AT AU AZ BA BB BD BE BF BG BH BI BJ BN BO BR BS BT BW BY BZ CA CD CF CG CH CI CL CM CN CO CR ' +
  'CU CV CY CZ DE DJ DK DM DO DZ EC EE EG ER ES ET FI FJ FM FR GA GB GD GE GH GM GN GQ GR GT GW GY HN HR HT HU ID IE IL ' +
  'IN IQ IR IS IT JM JO JP KE KG KH KI KM KN KP KR KW KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MG MH MK ML MM MN ' +
  'MR MT MU MV MW MX MY MZ NA NE NG NI NL NO NP NR NZ OM PA PE PG PH PK PL PT PW PY QA RO RS RU RW SA SB SC SD SE SG SI ' +
  'SK SL SM SN SO SR SS ST SV SY SZ TD TG TH TJ TL TM TN TO TR TT TV TW TZ UA UG US UY UZ VA VC VE VN VU WS XK YE ZA ZM ZW ' +
  'HK MO PR GU BM KY RE NC PF FO GI IM JE GG AW CW'
).split(' ')

/** Where Udyami Manch starts, then the larger Nepali and Indian communities abroad. */
const POPULAR = ['NZ', 'AU', 'GB', 'US', 'CA', 'AE', 'QA', 'SA', 'MY', 'SG', 'JP', 'KR', 'IN', 'NP']

let regionNames: Intl.DisplayNames | null = null
try { regionNames = new Intl.DisplayNames(['en'], { type: 'region' }) } catch { regionNames = null }

/** The English name stored for a country code, e.g. "New Zealand" for "NZ". */
export function countryName(code: string): string {
  try { return regionNames?.of(code) ?? code } catch { return code }
}

let codeByName: Map<string, string> | null = null
/** The code for an English country name ("NZ" for "New Zealand"), or null when it is not one we know. */
export function countryCodeOf(name: string): string | null {
  if (!codeByName) {
    codeByName = new Map(CODES.map(c => [countryName(c).toLowerCase(), c] as const))
    for (const [alias, code] of Object.entries({ usa: 'US', 'united states of america': 'US', uk: 'GB', 'united kingdom': 'GB', uae: 'AE', 'south korea': 'KR', nz: 'NZ', aus: 'AU' })) codeByName.set(alias, code)
  }
  const k = name.trim().toLowerCase()
  return codeByName.get(k) ?? (/^[a-z]{2}$/.test(k) && CODES.includes(k.toUpperCase()) ? k.toUpperCase() : null)
}

/**
 * Country picker that stores the English country name. A value that is not in
 * the list (an older free-text entry) is kept as its own option so editing a
 * listing never silently changes it.
 */
export default function CountrySelect({ id, value, onChange, className, required }: {
  id?: string
  value: string
  onChange: (name: string) => void
  className?: string
  required?: boolean
}) {
  const all = useMemo(
    () => CODES.map(code => countryName(code)).filter((n, i, list) => list.indexOf(n) === i).sort((a, b) => a.localeCompare(b)),
    [],
  )
  const popular = useMemo(() => POPULAR.map(countryName), [])
  const known = value === '' || all.includes(value)

  return (
    <select id={id} className={className} value={value} onChange={e => onChange(e.target.value)} required={required}>
      <option value="" disabled>Choose a country</option>
      {!known && <option value={value}>{value}</option>}
      <optgroup label="Popular">
        {popular.map(n => <option key={`p-${n}`} value={n}>{n}</option>)}
      </optgroup>
      <optgroup label="All countries">
        {all.map(n => <option key={n} value={n}>{n}</option>)}
      </optgroup>
    </select>
  )
}
