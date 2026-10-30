/**
 * Dates the Nepali and Indian communities in New Zealand plan around, for the
 * calendar on the Events page. Festival dates follow the lunar calendars, and the
 * Nepali and Indian calendars can differ by a day, so a note says where they do.
 * Checked in October 2026 against the Nepal government holiday list, Drik Panchang,
 * Calendarific and the New Zealand government Matariki dates. Edit this list to add
 * or correct a date: it is the only place they live.
 */
export type FestivalKind = 'nepali' | 'indian' | 'both' | 'nz'

export interface Festival {
  /** First day, YYYY-MM-DD. */
  date: string
  /** Last day for a festival that runs several days. */
  end?: string
  name: string
  kind: FestivalKind
  note?: string
}

export const KIND_LABEL: Record<FestivalKind, string> = {
  nepali: 'Nepali festival',
  indian: 'Indian festival',
  both: 'Nepali and Indian festival',
  nz: 'New Zealand public holiday',
}

export const FESTIVALS: Festival[] = [
  // 2026
  { date: '2026-01-14', name: 'Maghe Sankranti / Makar Sankranti', kind: 'both' },
  { date: '2026-01-26', name: 'Republic Day of India', kind: 'indian' },
  { date: '2026-02-15', name: 'Maha Shivaratri', kind: 'both' },
  { date: '2026-02-19', name: 'Nepal Democracy Day', kind: 'nepali' },
  { date: '2026-04-14', name: 'Nepali New Year 2083 (Navabarsha)', kind: 'nepali', note: 'Celebrated at Aotea Square in Auckland.' },
  { date: '2026-08-15', name: 'Independence Day of India', kind: 'indian' },
  { date: '2026-08-28', name: 'Raksha Bandhan', kind: 'both', note: 'Falls on 27 to 28 August depending on the panchang.' },
  { date: '2026-09-04', name: 'Janmashtami', kind: 'both', note: '3 September for some households, 4 September for ISKCON.' },
  { date: '2026-09-13', name: 'Hartalika Teej', kind: 'both' },
  { date: '2026-09-14', name: 'Ganesh Chaturthi', kind: 'indian' },
  { date: '2026-10-11', end: '2026-10-20', name: 'Navratri', kind: 'indian' },
  { date: '2026-10-17', end: '2026-10-24', name: 'Dashain', kind: 'nepali', note: 'Vijaya Dashami and tika on 20 October.' },
  { date: '2026-10-20', name: 'Vijaya Dashami / Dussehra', kind: 'both' },
  { date: '2026-11-07', end: '2026-11-11', name: 'Tihar', kind: 'nepali', note: 'Kaag Tihar 7 Nov, Kukur Tihar and Laxmi Puja 8 Nov, Govardhan Puja 10 Nov, Bhai Tika 11 Nov.' },
  { date: '2026-11-08', name: 'Diwali / Laxmi Puja', kind: 'both', note: 'Some Nepali panchangs place Laxmi Puja on 9 November.' },
  { date: '2026-11-11', name: 'Bhai Tika', kind: 'nepali' },
  { date: '2026-11-15', name: 'Chhath Puja', kind: 'both' },
  // 2027
  { date: '2027-01-14', name: 'Makar Sankranti / Maghe Sankranti', kind: 'both', note: 'Maghe Sankranti is 15 January in Nepal.' },
  { date: '2027-01-26', name: 'Republic Day of India', kind: 'indian' },
  { date: '2027-03-22', name: 'Holi', kind: 'both', note: 'Hills of Nepal celebrate a day earlier.' },
  { date: '2027-04-14', name: 'Nepali New Year 2084 (Navabarsha)', kind: 'nepali', note: 'Celebrated at Aotea Square in Auckland.' },
  { date: '2027-08-15', name: 'Independence Day of India', kind: 'indian' },
  { date: '2027-08-17', name: 'Raksha Bandhan', kind: 'both' },
  { date: '2027-08-25', name: 'Janmashtami', kind: 'both' },
  { date: '2027-09-03', name: 'Hartalika Teej', kind: 'both' },
  { date: '2027-09-04', name: 'Ganesh Chaturthi', kind: 'indian' },
  { date: '2027-10-01', end: '2027-10-09', name: 'Navratri / Dashain', kind: 'both' },
  { date: '2027-10-09', name: 'Vijaya Dashami / Dussehra', kind: 'both', note: 'Nepal may observe it on 10 October.' },
  { date: '2027-10-29', name: 'Diwali / Laxmi Puja', kind: 'both' },
  { date: '2027-10-31', name: 'Bhai Tika', kind: 'nepali' },
  // New Zealand public holidays that move work and shop hours
  { date: '2026-02-06', name: 'Waitangi Day', kind: 'nz' },
  { date: '2026-04-03', name: 'Good Friday', kind: 'nz' },
  { date: '2026-04-06', name: 'Easter Monday', kind: 'nz' },
  { date: '2026-04-27', name: 'Anzac Day (observed)', kind: 'nz' },
  { date: '2026-06-01', name: "King's Birthday", kind: 'nz' },
  { date: '2026-07-10', name: 'Matariki', kind: 'nz' },
  { date: '2026-10-26', name: 'Labour Day', kind: 'nz' },
  { date: '2026-12-25', name: 'Christmas Day', kind: 'nz' },
  { date: '2027-01-01', name: "New Year's Day", kind: 'nz' },
  { date: '2027-02-08', name: 'Waitangi Day (observed)', kind: 'nz' },
  { date: '2027-03-26', name: 'Good Friday', kind: 'nz' },
  { date: '2027-03-29', name: 'Easter Monday', kind: 'nz' },
  { date: '2027-04-26', name: 'Anzac Day (observed)', kind: 'nz' },
  { date: '2027-06-07', name: "King's Birthday", kind: 'nz' },
  { date: '2027-06-25', name: 'Matariki', kind: 'nz' },
  { date: '2027-10-25', name: 'Labour Day', kind: 'nz' },
]

export const FESTIVAL_YEARS = [2026, 2027]

/** The festivals on a given day, a multi-day one counting for every day it covers. */
export function festivalsOn(day: string): Festival[] {
  return FESTIVALS.filter(f => day >= f.date && day <= (f.end ?? f.date))
}
