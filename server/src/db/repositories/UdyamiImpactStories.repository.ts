import type { FilterQuery } from '@mikro-orm/core';
import type { UdyamiImpactStories } from '../entities/UdyamiImpactStories.entity';
import { TrekRepository } from './_shared/trek-repository';

export type ImpactStatusValue = 'pending' | 'approved' | 'rejected';

/** A `udyami_impact_stories` row. */
export interface ImpactRow {
  id: number;
  author_user_id: number | null;
  title: string;
  business_name: string;
  business_country: string;
  impact_place: string;
  category: string;
  summary: string;
  details: string | null;
  happened_on: string;
  people_helped: number | null;
  cover_url: string | null;
  proof_url: string;
  status: ImpactStatusValue;
  created_at: string | null;
}

export type ImpactFields = Omit<ImpactRow, 'id' | 'author_user_id' | 'status' | 'created_at'>;

function toRow(e: UdyamiImpactStories): ImpactRow {
  return {
    id: e.id,
    author_user_id: e.author_user_id ?? null,
    title: e.title,
    business_name: e.business_name,
    business_country: e.business_country,
    impact_place: e.impact_place,
    category: e.category,
    summary: e.summary,
    details: e.details ?? null,
    happened_on: e.happened_on,
    people_helped: e.people_helped ?? null,
    cover_url: e.cover_url ?? null,
    proof_url: e.proof_url,
    status: e.status as ImpactStatusValue,
    created_at: e.created_at ?? null,
  };
}

export class UdyamiImpactStoriesRepository extends TrekRepository<UdyamiImpactStories> {
  /** Approved stories, newest first. */
  async approved(limit = 200): Promise<ImpactRow[]> {
    return (await this.find({ status: 'approved' }, { orderBy: { happened_on: 'desc', id: 'desc' }, limit })).map(toRow);
  }

  async list(where: FilterQuery<UdyamiImpactStories>, limit = 200): Promise<ImpactRow[]> {
    return (await this.find(where, { orderBy: { happened_on: 'desc', id: 'desc' }, limit })).map(toRow);
  }

  async findById(id: number): Promise<ImpactRow | null> {
    const row = await this.findOne({ id }, { refresh: true });
    return row ? toRow(row) : null;
  }

  async createStory(authorUserId: number, fields: ImpactFields, status: ImpactStatusValue): Promise<number> {
    return Number(await this.insert({ ...fields, author_user_id: authorUserId, status }));
  }

  async updateStory(id: number, fields: ImpactFields, now: string): Promise<void> {
    await this.nativeUpdate({ id }, { ...fields, updated_at: now });
  }

  async setStatus(id: number, status: ImpactStatusValue, now: string): Promise<number> {
    return this.nativeUpdate({ id }, { status, updated_at: now });
  }

  async deleteStory(id: number): Promise<number> {
    return this.nativeDelete({ id });
  }
}
