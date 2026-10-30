import type { FilterQuery } from '@mikro-orm/core';
import type { UdyamiBusinesses } from '../entities/UdyamiBusinesses.entity';
import { TrekRepository } from './_shared/trek-repository';

export type BusinessCommunityValue = 'nepali' | 'indian' | 'both';
export type BusinessStatusValue = 'pending' | 'approved' | 'rejected';

/** A `udyami_businesses` row. */
export interface BusinessRow {
  id: number;
  owner_user_id: number | null;
  name: string;
  category: string;
  community: BusinessCommunityValue;
  description: string | null;
  city: string;
  country: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  photo_url: string | null;
  status: BusinessStatusValue;
  created_at: string | null;
  updated_at: string | null;
}

export type BusinessFields = Omit<BusinessRow, 'id' | 'owner_user_id' | 'status' | 'created_at' | 'updated_at'>;

export interface BusinessFilter {
  ids?: number[];
  ownerUserId?: number;
  status?: BusinessStatusValue;
  country?: string;
  city?: string;
  category?: string;
  community?: BusinessCommunityValue;
  /** Matches name, category, city or country. */
  q?: string;
}

function toBusinessRow(e: UdyamiBusinesses): BusinessRow {
  return {
    id: e.id,
    owner_user_id: e.owner_user_id ?? null,
    name: e.name,
    category: e.category,
    community: e.community as BusinessCommunityValue,
    description: e.description ?? null,
    city: e.city,
    country: e.country,
    address: e.address ?? null,
    latitude: e.latitude ?? null,
    longitude: e.longitude ?? null,
    phone: e.phone ?? null,
    email: e.email ?? null,
    website: e.website ?? null,
    photo_url: e.photo_url ?? null,
    status: e.status as BusinessStatusValue,
    created_at: e.created_at ?? null,
    updated_at: e.updated_at ?? null,
  };
}

/** Escapes LIKE wildcards in user text. */
function likeText(text: string): string {
  return `%${text.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

export class UdyamiBusinessesRepository extends TrekRepository<UdyamiBusinesses> {
  async list(filter: BusinessFilter, limit = 200): Promise<BusinessRow[]> {
    const where: FilterQuery<UdyamiBusinesses> = {};
    if (filter.ids) where.id = { $in: filter.ids };
    if (filter.ownerUserId !== undefined) where.owner_user_id = filter.ownerUserId;
    if (filter.status) where.status = filter.status;
    if (filter.country) where.country = filter.country;
    if (filter.city) where.city = filter.city;
    if (filter.category) where.category = filter.category;
    if (filter.community) where.community = filter.community;
    if (filter.q) {
      const like = likeText(filter.q);
      where.$or = [{ name: { $like: like } }, { category: { $like: like } }, { city: { $like: like } }, { country: { $like: like } }];
    }
    const rows = await this.find(where, { orderBy: { id: 'desc' }, limit });
    return rows.map(toBusinessRow);
  }

  async findById(id: number): Promise<BusinessRow | null> {
    const row = await this.findOne({ id }, { refresh: true });
    return row ? toBusinessRow(row) : null;
  }

  async createBusiness(ownerUserId: number | null, fields: BusinessFields, status: BusinessStatusValue): Promise<number> {
    const id = await this.insert({ ...fields, owner_user_id: ownerUserId, status });
    return Number(id);
  }

  async updateBusiness(id: number, fields: BusinessFields, now: string): Promise<void> {
    await this.nativeUpdate({ id }, { ...fields, updated_at: now });
  }

  async setStatus(id: number, status: BusinessStatusValue, now: string): Promise<number> {
    return this.nativeUpdate({ id }, { status, updated_at: now });
  }

  async deleteBusiness(id: number): Promise<number> {
    return this.nativeDelete({ id });
  }

  async countWhere(filter: { status?: BusinessStatusValue; ownerUserId?: number }): Promise<number> {
    const where: FilterQuery<UdyamiBusinesses> = {};
    if (filter.status) where.status = filter.status;
    if (filter.ownerUserId !== undefined) where.owner_user_id = filter.ownerUserId;
    return this.count(where);
  }

  /** City and country of every approved listing, for the directory counts. */
  async approvedPlaces(): Promise<{ city: string; country: string }[]> {
    const rows = await this.find({ status: 'approved' }, { fields: ['city', 'country'] });
    return rows.map((r) => ({ city: r.city, country: r.country }));
  }
}
