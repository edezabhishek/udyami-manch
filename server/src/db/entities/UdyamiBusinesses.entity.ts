import { EntityRepositoryType, type Opt, defineEntity, p } from '@mikro-orm/core';
import { UdyamiBusinessesRepository } from '../repositories/UdyamiBusinesses.repository';
import { DbTimestampType } from '../types';

/** One directory listing (Migration20200101046410). */
export class UdyamiBusinesses {
  [EntityRepositoryType]?: UdyamiBusinessesRepository;
  id!: number & Opt;
  owner_user_id?: number | null;
  name!: string;
  category!: string;
  community!: string;
  description?: string | null;
  city!: string;
  country!: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  photo_url?: string | null;
  status!: string & Opt;
  created_at?: string | null;
  updated_at?: string | null;
}

export const UdyamiBusinessesSchema = defineEntity({
  class: UdyamiBusinesses,
  repository: () => UdyamiBusinessesRepository,
  properties: {
    id: p.integer().primary(),
    owner_user_id: p.integer().nullable().index('idx_udyami_businesses_owner'),
    name: p.text(),
    category: p.text(),
    community: p.text(),
    description: p.text().nullable(),
    city: p.text(),
    country: p.text(),
    address: p.text().nullable(),
    latitude: p.double().nullable(),
    longitude: p.double().nullable(),
    phone: p.text().nullable(),
    email: p.text().nullable(),
    website: p.text().nullable(),
    photo_url: p.text().nullable(),
    status: p.text().default('pending').index('idx_udyami_businesses_status'),
    created_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
    updated_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
  },
});
