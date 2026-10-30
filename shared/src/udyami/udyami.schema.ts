import { z } from 'zod';

/**
 * Udyami Manch: "Udyami of the Month" spotlight and the nominations that feed it.
 *
 * A spotlight is one featured business per calendar month (`YYYY-MM`). The home
 * page shows the current month's, or the latest earlier one when the current
 * month has none yet. Anyone signed in can nominate a business; admins review
 * nominations and choose the monthly feature.
 */

export const spotlightMonthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Month must be YYYY-MM');

const optionalText = (max: number) => z.string().trim().max(max).nullable().optional();
const httpUrl = z
  .string()
  .trim()
  .max(2048)
  .regex(/^https?:\/\//i, 'Must start with http:// or https://');

export const spotlightSchema = z.object({
  id: z.number().int(),
  month: spotlightMonthSchema,
  business_name: z.string(),
  owner_name: z.string(),
  owner_photo_url: z.string().nullable(),
  photo_url: z.string().nullable(),
  city: z.string(),
  country: z.string(),
  category: z.string(),
  staff_count: z.number().int().nullable(),
  founded_year: z.number().int().nullable(),
  story: z.string().nullable(),
  website: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});
export type Spotlight = z.infer<typeof spotlightSchema>;

export const spotlightUpsertRequestSchema = z.object({
  business_name: z.string().trim().min(1).max(120),
  owner_name: z.string().trim().min(1).max(120),
  owner_photo_url: httpUrl.nullable().optional(),
  photo_url: httpUrl.nullable().optional(),
  city: z.string().trim().min(1).max(80),
  country: z.string().trim().min(1).max(80),
  category: z.string().trim().min(1).max(80),
  staff_count: z.number().int().min(0).max(1_000_000).nullable().optional(),
  founded_year: z.number().int().min(1800).max(2100).nullable().optional(),
  story: optionalText(4000),
  website: httpUrl.nullable().optional(),
});
export type SpotlightUpsertRequest = z.infer<typeof spotlightUpsertRequestSchema>;

export const currentSpotlightResponseSchema = z.object({ spotlight: spotlightSchema.nullable() });
export type CurrentSpotlightResponse = z.infer<typeof currentSpotlightResponseSchema>;

export const spotlightListResponseSchema = z.object({ spotlights: z.array(spotlightSchema) });
export type SpotlightListResponse = z.infer<typeof spotlightListResponseSchema>;

export const nominationStatusSchema = z.enum(['new', 'reviewed', 'featured', 'rejected']);
export type NominationStatus = z.infer<typeof nominationStatusSchema>;

export const nominationSchema = z.object({
  id: z.number().int(),
  business_name: z.string(),
  owner_name: z.string().nullable(),
  city: z.string(),
  country: z.string(),
  category: z.string().nullable(),
  contact: z.string().nullable(),
  reason: z.string().nullable(),
  submitted_by: z.number().int().nullable(),
  status: nominationStatusSchema,
  created_at: z.string().nullable(),
});
export type Nomination = z.infer<typeof nominationSchema>;

export const nominationCreateRequestSchema = z.object({
  business_name: z.string().trim().min(1).max(120),
  owner_name: optionalText(120),
  city: z.string().trim().min(1).max(80),
  country: z.string().trim().min(1).max(80),
  category: optionalText(80),
  contact: optionalText(200),
  reason: optionalText(2000),
});
export type NominationCreateRequest = z.infer<typeof nominationCreateRequestSchema>;

export const nominationStatusRequestSchema = z.object({ status: nominationStatusSchema });

export const nominationResponseSchema = z.object({ nomination: nominationSchema });
export const nominationListResponseSchema = z.object({ nominations: z.array(nominationSchema) });
export type NominationListResponse = z.infer<typeof nominationListResponseSchema>;

// ── Business listings ────────────────────────────────────────────────────────

/** Which community owns and runs the business. */
export const businessCommunitySchema = z.enum(['nepali', 'indian', 'both']);
export type BusinessCommunity = z.infer<typeof businessCommunitySchema>;

/** A listing is visible to everyone once approved; until then only to its owner and admins. */
export const businessStatusSchema = z.enum(['pending', 'approved', 'rejected']);
export type BusinessStatus = z.infer<typeof businessStatusSchema>;

export const businessSchema = z.object({
  id: z.number().int(),
  owner_user_id: z.number().int().nullable(),
  name: z.string(),
  category: z.string(),
  community: businessCommunitySchema,
  description: z.string().nullable(),
  city: z.string(),
  country: z.string(),
  address: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  website: z.string().nullable(),
  photo_url: z.string().nullable(),
  status: businessStatusSchema,
  saved: z.boolean(),
  is_mine: z.boolean(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});
export type Business = z.infer<typeof businessSchema>;

export const businessUpsertRequestSchema = z.object({
  name: z.string().trim().min(1).max(120),
  category: z.string().trim().min(1).max(80),
  community: businessCommunitySchema,
  description: optionalText(2000),
  city: z.string().trim().min(1).max(80),
  country: z.string().trim().min(1).max(80),
  address: optionalText(200),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  phone: optionalText(40),
  email: z.string().trim().max(200).email().nullable().optional().or(z.literal('')),
  website: httpUrl.nullable().optional().or(z.literal('')),
  photo_url: httpUrl.nullable().optional().or(z.literal('')),
});
export type BusinessUpsertRequest = z.infer<typeof businessUpsertRequestSchema>;

export const businessListScopeSchema = z.enum(['all', 'mine', 'saved', 'pending']);
export type BusinessListScope = z.infer<typeof businessListScopeSchema>;

export const businessResponseSchema = z.object({ business: businessSchema });
export const businessListResponseSchema = z.object({ businesses: z.array(businessSchema) });
export type BusinessListResponse = z.infer<typeof businessListResponseSchema>;

export const businessStatusRequestSchema = z.object({ status: businessStatusSchema });

export const directoryStatsSchema = z.object({
  businesses: z.number().int(),
  countries: z.number().int(),
  /** The listed countries by name, for the flags on the Home card. */
  country_names: z.array(z.string()),
  cities: z.number().int(),
  mine: z.number().int(),
  saved: z.number().int(),
  pending: z.number().int(),
});
export type DirectoryStats = z.infer<typeof directoryStatsSchema>;

// ── Online events ────────────────────────────────────────────────────────────

export const eventPlatformSchema = z.enum(['zoom', 'google_meet', 'teams', 'youtube', 'facebook', 'other']);
export type EventPlatform = z.infer<typeof eventPlatformSchema>;

export const eventStatusSchema = z.enum(['pending', 'approved', 'rejected']);
export type EventStatus = z.infer<typeof eventStatusSchema>;

export const eventSchema = z.object({
  id: z.number().int(),
  organizer_user_id: z.number().int().nullable(),
  organizer_name: z.string().nullable(),
  title: z.string(),
  description: z.string().nullable(),
  category: z.string(),
  platform: eventPlatformSchema,
  /** Only for people who registered, the organizer and admins; null otherwise. */
  join_url: z.string().nullable(),
  /** UTC, ISO 8601 with Z. */
  starts_at: z.string(),
  ends_at: z.string(),
  duration_minutes: z.number().int(),
  host_timezone: z.string(),
  cover_url: z.string().nullable(),
  status: eventStatusSchema,
  going_count: z.number().int(),
  is_going: z.boolean(),
  is_mine: z.boolean(),
  created_at: z.string().nullable(),
});
export type UdyamiEvent = z.infer<typeof eventSchema>;

export const eventUpsertRequestSchema = z.object({
  title: z.string().trim().min(1).max(140),
  description: optionalText(4000),
  category: z.string().trim().min(1).max(60),
  platform: eventPlatformSchema,
  join_url: httpUrl,
  /** Any ISO 8601 date-time with an offset or Z; stored as UTC. */
  starts_at: z.string().refine((v) => /[zZ]|[+-]\d{2}:?\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)), 'Start must be a date-time with a timezone'),
  duration_minutes: z.number().int().min(10).max(24 * 60),
  host_timezone: z.string().trim().min(1).max(64),
  cover_url: httpUrl.nullable().optional().or(z.literal('')),
});
export type EventUpsertRequest = z.infer<typeof eventUpsertRequestSchema>;

export const eventListScopeSchema = z.enum(['upcoming', 'past', 'mine', 'pending']);
export type EventListScope = z.infer<typeof eventListScopeSchema>;

export const eventResponseSchema = z.object({ event: eventSchema });
export const eventListResponseSchema = z.object({ events: z.array(eventSchema) });
export type EventListResponse = z.infer<typeof eventListResponseSchema>;
export const eventStatusRequestSchema = z.object({ status: eventStatusSchema });

/** One place a typed address can mean, as the address search returns it. */
export const geocodeResultSchema = z.object({
  label: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  address: z.string().nullable(),
  city: z.string().nullable(),
  country: z.string().nullable(),
});
export type GeocodeResult = z.infer<typeof geocodeResultSchema>;
export const geocodeResponseSchema = z.object({ results: z.array(geocodeResultSchema) });
export type GeocodeResponse = z.infer<typeof geocodeResponseSchema>;
