import { EntityRepositoryType, type Opt, defineEntity, p } from '@mikro-orm/core';
import { UdyamiSpotlightsRepository } from '../repositories/UdyamiSpotlights.repository';
import { DbTimestampType } from '../types';

/** One "Udyami of the Month" feature (Migration20200101046400). */
export class UdyamiSpotlights {
  [EntityRepositoryType]?: UdyamiSpotlightsRepository;
  id!: number & Opt;
  month!: string;
  business_name!: string;
  owner_name!: string;
  owner_photo_url?: string | null;
  photo_url?: string | null;
  city!: string;
  country!: string;
  category!: string;
  staff_count?: number | null;
  founded_year?: number | null;
  story?: string | null;
  website?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export const UdyamiSpotlightsSchema = defineEntity({
  class: UdyamiSpotlights,
  repository: () => UdyamiSpotlightsRepository,
  properties: {
    id: p.integer().primary(),
    month: p.text().unique(),
    business_name: p.text(),
    owner_name: p.text(),
    owner_photo_url: p.text().nullable(),
    photo_url: p.text().nullable(),
    city: p.text(),
    country: p.text(),
    category: p.text(),
    staff_count: p.integer().nullable(),
    founded_year: p.integer().nullable(),
    story: p.text().nullable(),
    website: p.text().nullable(),
    created_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
    updated_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
  },
});
