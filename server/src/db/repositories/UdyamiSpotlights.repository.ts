import type { UdyamiSpotlights } from '../entities/UdyamiSpotlights.entity';
import { TrekRepository } from './_shared/trek-repository';

/** A `udyami_spotlights` row as the API emits it. */
export interface SpotlightRow {
  id: number;
  month: string;
  business_name: string;
  owner_name: string;
  owner_photo_url: string | null;
  photo_url: string | null;
  city: string;
  country: string;
  category: string;
  staff_count: number | null;
  founded_year: number | null;
  story: string | null;
  website: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export type SpotlightFields = Omit<SpotlightRow, 'id' | 'month' | 'created_at' | 'updated_at'>;

function toSpotlightRow(e: UdyamiSpotlights): SpotlightRow {
  return {
    id: e.id,
    month: e.month,
    business_name: e.business_name,
    owner_name: e.owner_name,
    owner_photo_url: e.owner_photo_url ?? null,
    photo_url: e.photo_url ?? null,
    city: e.city,
    country: e.country,
    category: e.category,
    staff_count: e.staff_count ?? null,
    founded_year: e.founded_year ?? null,
    story: e.story ?? null,
    website: e.website ?? null,
    created_at: e.created_at ?? null,
    updated_at: e.updated_at ?? null,
  };
}

export class UdyamiSpotlightsRepository extends TrekRepository<UdyamiSpotlights> {
  /** The feature for `month`, or the latest one before it; null when none exists yet. */
  async findCurrent(month: string): Promise<SpotlightRow | null> {
    const row = await this.findOne({ month: { $lte: month } }, { orderBy: { month: 'desc' } });
    return row ? toSpotlightRow(row) : null;
  }

  async findByMonth(month: string): Promise<SpotlightRow | null> {
    const row = await this.findOne({ month });
    return row ? toSpotlightRow(row) : null;
  }

  /** Every feature, newest month first. */
  async listAll(): Promise<SpotlightRow[]> {
    const rows = await this.find({}, { orderBy: { month: 'desc' } });
    return rows.map(toSpotlightRow);
  }

  /** Creates or replaces the feature for `month`. */
  async upsertMonth(month: string, fields: SpotlightFields, now: string): Promise<void> {
    await this.upsert(
      { month, ...fields, updated_at: now },
      { onConflictFields: ['month'], onConflictAction: 'merge', onConflictExcludeFields: ['created_at'] },
    );
  }

  async deleteMonth(month: string): Promise<number> {
    return this.nativeDelete({ month });
  }
}
