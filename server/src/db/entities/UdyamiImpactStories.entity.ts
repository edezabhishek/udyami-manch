import { EntityRepositoryType, type Opt, defineEntity, p } from '@mikro-orm/core';
import { UdyamiImpactStoriesRepository } from '../repositories/UdyamiImpactStories.repository';
import { DbTimestampType } from '../types';

/** One impact story (Migration20200101046440). */
export class UdyamiImpactStories {
  [EntityRepositoryType]?: UdyamiImpactStoriesRepository;
  id!: number & Opt;
  author_user_id?: number | null;
  title!: string;
  business_name!: string;
  business_country!: string;
  impact_place!: string;
  category!: string;
  summary!: string;
  details?: string | null;
  happened_on!: string;
  people_helped?: number | null;
  cover_url?: string | null;
  proof_url!: string;
  status!: string & Opt;
  created_at?: string | null;
  updated_at?: string | null;
}

export const UdyamiImpactStoriesSchema = defineEntity({
  class: UdyamiImpactStories,
  repository: () => UdyamiImpactStoriesRepository,
  properties: {
    id: p.integer().primary(),
    author_user_id: p.integer().nullable().index('idx_udyami_impact_author'),
    title: p.text(),
    business_name: p.text(),
    business_country: p.text(),
    impact_place: p.text(),
    category: p.text(),
    summary: p.text(),
    details: p.text().nullable(),
    happened_on: p.text(),
    people_helped: p.integer().nullable(),
    cover_url: p.text().nullable(),
    proof_url: p.text(),
    status: p.text().default('pending'),
    created_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
    updated_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
  },
});
