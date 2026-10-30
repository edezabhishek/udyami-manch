import { apiClient } from './client'
import type {
  EventListResponse,
  EventListScope,
  EventStatus,
  EventUpsertRequest,
  UdyamiEvent,
  Business,
  BusinessListResponse,
  BusinessListScope,
  BusinessStatus,
  BusinessUpsertRequest,
  DirectoryStats,
  GeocodeResponse,
  CurrentSpotlightResponse,
  Nomination,
  NominationCreateRequest,
  NominationListResponse,
  NominationStatus,
  Spotlight,
  SpotlightListResponse,
  SpotlightUpsertRequest,
} from '@trek/shared'

/** /api/udyami — "Udyami of the Month" and nominations. */
export const udyamiApi = {
  current: (): Promise<CurrentSpotlightResponse> => apiClient.get('/udyami/spotlight').then(r => r.data),
  listSpotlights: (): Promise<SpotlightListResponse> => apiClient.get('/udyami/spotlights').then(r => r.data),
  upsertSpotlight: (month: string, data: SpotlightUpsertRequest): Promise<Spotlight> =>
    apiClient.put(`/udyami/spotlights/${month}`, data).then(r => r.data),
  deleteSpotlight: (month: string): Promise<{ success: boolean }> =>
    apiClient.delete(`/udyami/spotlights/${month}`).then(r => r.data),
  nominate: (data: NominationCreateRequest): Promise<{ nomination: Nomination }> =>
    apiClient.post('/udyami/nominations', data).then(r => r.data),
  listNominations: (): Promise<NominationListResponse> => apiClient.get('/udyami/nominations').then(r => r.data),
  setNominationStatus: (id: number, status: NominationStatus): Promise<{ nomination: Nomination }> =>
    apiClient.patch(`/udyami/nominations/${id}`, { status }).then(r => r.data),
}

export interface BusinessQuery {
  scope?: BusinessListScope
  q?: string
  country?: string
  city?: string
  category?: string
  community?: 'nepali' | 'indian' | 'both'
}

/** /api/udyami/businesses — the directory. */
export const businessesApi = {
  list: (query: BusinessQuery = {}): Promise<BusinessListResponse> =>
    apiClient.get('/udyami/businesses', { params: query }).then(r => r.data),
  get: (id: number): Promise<{ business: Business }> => apiClient.get(`/udyami/businesses/${id}`).then(r => r.data),
  create: (data: BusinessUpsertRequest): Promise<{ business: Business }> => apiClient.post('/udyami/businesses', data).then(r => r.data),
  update: (id: number, data: BusinessUpsertRequest): Promise<{ business: Business }> =>
    apiClient.put(`/udyami/businesses/${id}`, data).then(r => r.data),
  remove: (id: number): Promise<{ success: boolean }> => apiClient.delete(`/udyami/businesses/${id}`).then(r => r.data),
  save: (id: number): Promise<{ business: Business }> => apiClient.post(`/udyami/businesses/${id}/save`).then(r => r.data),
  unsave: (id: number): Promise<{ business: Business }> => apiClient.delete(`/udyami/businesses/${id}/save`).then(r => r.data),
  setStatus: (id: number, status: BusinessStatus): Promise<{ business: Business }> =>
    apiClient.patch(`/udyami/businesses/${id}/status`, { status }).then(r => r.data),
  stats: (): Promise<DirectoryStats> => apiClient.get('/udyami/directory-stats').then(r => r.data),
}

/** /api/udyami/geocode — turns a typed address into places on the map. */
export const geocodeApi = {
  search: (q: string): Promise<GeocodeResponse> => apiClient.get('/udyami/geocode', { params: { q }, timeout: 20000 }).then(r => r.data),
}

export const COMMUNITY_LABEL: Record<'nepali' | 'indian' | 'both', string> = {
  nepali: 'Nepali owned',
  indian: 'Indian owned',
  both: 'Nepali & Indian owned',
}

/** "October 2026" for `2026-10`, in the reader's language. */
export function monthLabel(month: string, locale?: string): string {
  const [y, m] = month.split('-').map(Number)
  if (!y || !m) return month
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' })
}

/** The current calendar month as `YYYY-MM` (UTC, matching the server). */
export function currentMonth(now: Date = new Date()): string {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
}

/** /api/udyami/events — online events. */
export const eventsApi = {
  list: (scope: EventListScope = 'upcoming'): Promise<EventListResponse> => apiClient.get('/udyami/events', { params: { scope } }).then(r => r.data),
  create: (data: EventUpsertRequest): Promise<{ event: UdyamiEvent }> => apiClient.post('/udyami/events', data).then(r => r.data),
  update: (id: number, data: EventUpsertRequest): Promise<{ event: UdyamiEvent }> => apiClient.put(`/udyami/events/${id}`, data).then(r => r.data),
  remove: (id: number): Promise<{ success: boolean }> => apiClient.delete(`/udyami/events/${id}`).then(r => r.data),
  rsvp: (id: number): Promise<{ event: UdyamiEvent }> => apiClient.post(`/udyami/events/${id}/rsvp`).then(r => r.data),
  unrsvp: (id: number): Promise<{ event: UdyamiEvent }> => apiClient.delete(`/udyami/events/${id}/rsvp`).then(r => r.data),
  setStatus: (id: number, status: EventStatus): Promise<{ event: UdyamiEvent }> =>
    apiClient.patch(`/udyami/events/${id}/status`, { status }).then(r => r.data),
}
