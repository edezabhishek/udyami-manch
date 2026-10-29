import type { FilterQuery } from '@mikro-orm/core';
import type { UdyamiEvents } from '../entities/UdyamiEvents.entity';
import { TrekRepository } from './_shared/trek-repository';

export type EventStatusValue = 'pending' | 'approved' | 'rejected';
export type EventPlatformValue = 'zoom' | 'google_meet' | 'teams' | 'youtube' | 'facebook' | 'other';

/** A `udyami_events` row; times are canonical UTC `YYYY-MM-DD HH:MM:SS`. */
export interface EventRow {
  id: number;
  organizer_user_id: number | null;
  title: string;
  description: string | null;
  category: string;
  platform: EventPlatformValue;
  join_url: string;
  starts_at: string;
  ends_at: string;
  duration_minutes: number;
  host_timezone: string;
  cover_url: string | null;
  status: EventStatusValue;
  created_at: string | null;
}

export type EventFields = Omit<EventRow, 'id' | 'organizer_user_id' | 'status' | 'created_at'>;

function toEventRow(e: UdyamiEvents): EventRow {
  return {
    id: e.id,
    organizer_user_id: e.organizer_user_id ?? null,
    title: e.title,
    description: e.description ?? null,
    category: e.category,
    platform: e.platform as EventPlatformValue,
    join_url: e.join_url,
    starts_at: e.starts_at,
    ends_at: e.ends_at,
    duration_minutes: e.duration_minutes,
    host_timezone: e.host_timezone,
    cover_url: e.cover_url ?? null,
    status: e.status as EventStatusValue,
    created_at: e.created_at ?? null,
  };
}

export class UdyamiEventsRepository extends TrekRepository<UdyamiEvents> {
  /** Approved events not finished by `now`, soonest first. */
  async upcoming(now: string, limit = 100): Promise<EventRow[]> {
    return (await this.find({ status: 'approved', ends_at: { $gte: now } }, { orderBy: { starts_at: 'asc' }, limit })).map(toEventRow);
  }

  /** Approved events finished by `now`, latest first. */
  async past(now: string, limit = 100): Promise<EventRow[]> {
    return (await this.find({ status: 'approved', ends_at: { $lt: now } }, { orderBy: { starts_at: 'desc' }, limit })).map(toEventRow);
  }

  async list(where: FilterQuery<UdyamiEvents>, limit = 200): Promise<EventRow[]> {
    return (await this.find(where, { orderBy: { starts_at: 'asc' }, limit })).map(toEventRow);
  }

  async findById(id: number): Promise<EventRow | null> {
    const row = await this.findOne({ id }, { refresh: true });
    return row ? toEventRow(row) : null;
  }

  async createEvent(organizerUserId: number, fields: EventFields, status: EventStatusValue): Promise<number> {
    return Number(await this.insert({ ...fields, organizer_user_id: organizerUserId, status }));
  }

  async updateEvent(id: number, fields: EventFields, now: string): Promise<void> {
    await this.nativeUpdate({ id }, { ...fields, updated_at: now });
  }

  async setStatus(id: number, status: EventStatusValue, now: string): Promise<number> {
    return this.nativeUpdate({ id }, { status, updated_at: now });
  }

  async deleteEvent(id: number): Promise<number> {
    return this.nativeDelete({ id });
  }
}
