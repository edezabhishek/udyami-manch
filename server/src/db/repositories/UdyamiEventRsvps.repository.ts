import type { UdyamiEventRsvps } from '../entities/UdyamiEventRsvps.entity';
import { TrekRepository } from './_shared/trek-repository';

export class UdyamiEventRsvpsRepository extends TrekRepository<UdyamiEventRsvps> {
  async eventIdsForUser(userId: number): Promise<number[]> {
    return (await this.find({ user_id: userId }, { fields: ['event_id'] })).map((r) => r.event_id);
  }

  /** How many registered for each of the given events. */
  async countsFor(eventIds: number[]): Promise<Map<number, number>> {
    const counts = new Map<number, number>();
    if (eventIds.length === 0) return counts;
    for (const r of await this.find({ event_id: { $in: eventIds } }, { fields: ['event_id'] })) {
      counts.set(r.event_id, (counts.get(r.event_id) ?? 0) + 1);
    }
    return counts;
  }

  async add(userId: number, eventId: number): Promise<void> {
    await this.upsert({ user_id: userId, event_id: eventId }, { onConflictFields: ['user_id', 'event_id'], onConflictAction: 'ignore' });
  }

  async removeOne(userId: number, eventId: number): Promise<void> {
    await this.nativeDelete({ user_id: userId, event_id: eventId });
  }
}
