import { EntityRepositoryType, PrimaryKeyProp, defineEntity, p } from '@mikro-orm/core';
import { UdyamiSavedBusinessesRepository } from '../repositories/UdyamiSavedBusinesses.repository';
import { DbTimestampType } from '../types';

/** A business on a user's saved list (Migration20200101046410). */
export class UdyamiSavedBusinesses {
  [EntityRepositoryType]?: UdyamiSavedBusinessesRepository;
  [PrimaryKeyProp]?: ['user_id', 'business_id'];
  user_id!: number;
  business_id!: number;
  created_at?: string | null;
}

export const UdyamiSavedBusinessesSchema = defineEntity({
  class: UdyamiSavedBusinesses,
  repository: () => UdyamiSavedBusinessesRepository,
  properties: {
    user_id: p.integer().primary(),
    business_id: p.integer().primary().index('idx_udyami_saved_business'),
    created_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
  },
});
