import { EntityRepositoryType, type Opt, defineEntity, p } from '@mikro-orm/core';
import { UdyamiNominationsRepository } from '../repositories/UdyamiNominations.repository';
import { DbTimestampType } from '../types';

/** A business someone suggested for "Udyami of the Month" (Migration20200101046400). */
export class UdyamiNominations {
  [EntityRepositoryType]?: UdyamiNominationsRepository;
  id!: number & Opt;
  business_name!: string;
  owner_name?: string | null;
  city!: string;
  country!: string;
  category?: string | null;
  contact?: string | null;
  reason?: string | null;
  submitted_by?: number | null;
  status!: string & Opt;
  created_at?: string | null;
}

export const UdyamiNominationsSchema = defineEntity({
  class: UdyamiNominations,
  repository: () => UdyamiNominationsRepository,
  properties: {
    id: p.integer().primary(),
    business_name: p.text(),
    owner_name: p.text().nullable(),
    city: p.text(),
    country: p.text(),
    category: p.text().nullable(),
    contact: p.text().nullable(),
    reason: p.text().nullable(),
    submitted_by: p.integer().nullable().index('idx_udyami_nominations_submitted_by'),
    status: p.text().default('new').index('idx_udyami_nominations_status'),
    created_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
  },
});
