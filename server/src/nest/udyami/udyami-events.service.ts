import { UdyamiEventRsvps } from '../../db/entities/UdyamiEventRsvps.entity';
import { UdyamiEvents } from '../../db/entities/UdyamiEvents.entity';
import { Users } from '../../db/entities/Users.entity';
import type { UdyamiEventRsvpsRepository } from '../../db/repositories/UdyamiEventRsvps.repository';
import type { EventFields, EventRow, EventStatusValue, UdyamiEventsRepository } from '../../db/repositories/UdyamiEvents.repository';
import type { UsersRepository } from '../../db/repositories/Users.repository';
import { dbNow, utcSuffix } from '../../db/types';
import type { User } from '../../types';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import type { EventListScope, EventUpsertRequest, UdyamiEvent } from '@trek/shared';

const blankToNull = (v: string | null | undefined): string | null => (v && v.trim() ? v.trim() : null);

/** Thrown for an event the caller may not see or change. */
export class EventAccessError extends Error {
  constructor(readonly kind: 'not_found' | 'forbidden') {
    super(kind);
  }
}

function fieldsOf(body: EventUpsertRequest): EventFields {
  const start = new Date(body.starts_at);
  const end = new Date(start.getTime() + body.duration_minutes * 60_000);
  return {
    title: body.title.trim(),
    description: blankToNull(body.description),
    category: body.category.trim(),
    platform: body.platform,
    join_url: body.join_url.trim(),
    starts_at: dbNow(start),
    ends_at: dbNow(end),
    duration_minutes: body.duration_minutes,
    host_timezone: body.host_timezone.trim(),
    cover_url: blankToNull(body.cover_url),
  };
}

/**
 * Udyami Manch online events. Approved events are listed for everyone; a
 * pending one only for its organizer and admins. The meeting link is shown to
 * people who registered, the organizer and admins.
 */
@Injectable()
export class UdyamiEventsService {
  constructor(
    @InjectRepository(UdyamiEvents) private readonly events: UdyamiEventsRepository,
    @InjectRepository(UdyamiEventRsvps) private readonly rsvps: UdyamiEventRsvpsRepository,
    @InjectRepository(Users) private readonly users: UsersRepository,
  ) {}

  private canSee(row: EventRow, user: User): boolean {
    return row.status === 'approved' || row.organizer_user_id === user.id || user.role === 'admin';
  }

  private canChange(row: EventRow, user: User): boolean {
    return row.organizer_user_id === user.id || user.role === 'admin';
  }

  private async present(rows: EventRow[], user: User): Promise<UdyamiEvent[]> {
    const going = new Set(await this.rsvps.eventIdsForUser(user.id));
    const counts = await this.rsvps.countsFor(rows.map((r) => r.id));
    const organizerIds = [...new Set(rows.map((r) => r.organizer_user_id).filter((id): id is number => id !== null))];
    const names = new Map<number, string>();
    if (organizerIds.length) {
      for (const u of await this.users.find({ id: { $in: organizerIds } }, { fields: ['id', 'username'] })) names.set(u.id, u.username);
    }
    return rows.map((r) => {
      const isMine = r.organizer_user_id === user.id;
      const isGoing = going.has(r.id);
      return {
        ...r,
        organizer_name: r.organizer_user_id !== null ? (names.get(r.organizer_user_id) ?? null) : null,
        join_url: isGoing || isMine || user.role === 'admin' ? r.join_url : null,
        starts_at: utcSuffix(r.starts_at) ?? r.starts_at,
        ends_at: utcSuffix(r.ends_at) ?? r.ends_at,
        going_count: counts.get(r.id) ?? 0,
        is_going: isGoing,
        is_mine: isMine,
      };
    });
  }

  private async visible(id: number, user: User): Promise<EventRow> {
    const row = await this.events.findById(id);
    if (!row || !this.canSee(row, user)) throw new EventAccessError('not_found');
    return row;
  }

  async list(user: User, scope: EventListScope): Promise<UdyamiEvent[]> {
    const now = dbNow();
    let rows: EventRow[];
    if (scope === 'past') rows = await this.events.past(now);
    else if (scope === 'mine') rows = await this.events.list({ organizer_user_id: user.id });
    else if (scope === 'pending') {
      if (user.role !== 'admin') throw new EventAccessError('forbidden');
      rows = await this.events.list({ status: 'pending' });
    } else rows = await this.events.upcoming(now);
    return this.present(rows, user);
  }

  async get(user: User, id: number): Promise<UdyamiEvent> {
    return (await this.present([await this.visible(id, user)], user))[0];
  }

  async create(user: User, body: EventUpsertRequest): Promise<UdyamiEvent> {
    const id = await this.events.createEvent(user.id, fieldsOf(body), user.role === 'admin' ? 'approved' : 'pending');
    return this.get(user, id);
  }

  async update(user: User, id: number, body: EventUpsertRequest): Promise<UdyamiEvent> {
    const row = await this.visible(id, user);
    if (!this.canChange(row, user)) throw new EventAccessError('forbidden');
    const now = dbNow();
    await this.events.updateEvent(id, fieldsOf(body), now);
    if (user.role !== 'admin' && row.status !== 'pending') await this.events.setStatus(id, 'pending', now);
    return this.get(user, id);
  }

  async remove(user: User, id: number): Promise<void> {
    const row = await this.visible(id, user);
    if (!this.canChange(row, user)) throw new EventAccessError('forbidden');
    await this.events.deleteEvent(id);
  }

  async setGoing(user: User, id: number, going: boolean): Promise<UdyamiEvent> {
    const row = await this.visible(id, user);
    if (going && row.status !== 'approved') throw new EventAccessError('forbidden');
    if (going) await this.rsvps.add(user.id, id);
    else await this.rsvps.removeOne(user.id, id);
    return this.get(user, id);
  }

  async setStatus(user: User, id: number, status: EventStatusValue): Promise<UdyamiEvent> {
    if (user.role !== 'admin') throw new EventAccessError('forbidden');
    if (!(await this.events.setStatus(id, status, dbNow()))) throw new EventAccessError('not_found');
    return this.get(user, id);
  }
}
