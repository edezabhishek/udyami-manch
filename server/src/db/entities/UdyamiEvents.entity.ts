import { EntityRepositoryType, type Opt, defineEntity, p } from '@mikro-orm/core';
import { UdyamiEventsRepository } from '../repositories/UdyamiEvents.repository';
import { DbTimestampType } from '../types';

/** One online event (Migration20200101046420). */
export class UdyamiEvents {
  [EntityRepositoryType]?: UdyamiEventsRepository;
  id!: number & Opt;
  organizer_user_id?: number | null;
  title!: string;
  description?: string | null;
  category!: string;
  platform!: string;
  join_url!: string;
  starts_at!: string;
  ends_at!: string;
  duration_minutes!: number;
  host_timezone!: string;
  cover_url?: string | null;
  status!: string & Opt;
  created_at?: string | null;
  updated_at?: string | null;
}

export const UdyamiEventsSchema = defineEntity({
  class: UdyamiEvents,
  repository: () => UdyamiEventsRepository,
  properties: {
    id: p.integer().primary(),
    organizer_user_id: p.integer().nullable().index('idx_udyami_events_organizer'),
    title: p.text(),
    description: p.text().nullable(),
    category: p.text(),
    platform: p.text(),
    join_url: p.text(),
    starts_at: p.type(DbTimestampType),
    ends_at: p.type(DbTimestampType),
    duration_minutes: p.integer(),
    host_timezone: p.text(),
    cover_url: p.text().nullable(),
    status: p.text().default('pending'),
    created_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
    updated_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
  },
});
