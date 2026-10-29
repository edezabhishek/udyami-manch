import { EntityRepositoryType, PrimaryKeyProp, defineEntity, p } from '@mikro-orm/core';
import { UdyamiEventRsvpsRepository } from '../repositories/UdyamiEventRsvps.repository';
import { DbTimestampType } from '../types';

/** A registration for an online event (Migration20200101046420). */
export class UdyamiEventRsvps {
  [EntityRepositoryType]?: UdyamiEventRsvpsRepository;
  [PrimaryKeyProp]?: ['user_id', 'event_id'];
  user_id!: number;
  event_id!: number;
  created_at?: string | null;
}

export const UdyamiEventRsvpsSchema = defineEntity({
  class: UdyamiEventRsvps,
  repository: () => UdyamiEventRsvpsRepository,
  properties: {
    user_id: p.integer().primary(),
    event_id: p.integer().primary().index('idx_udyami_event_rsvps_event'),
    created_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
  },
});
