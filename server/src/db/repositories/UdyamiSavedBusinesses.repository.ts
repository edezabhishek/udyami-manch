import type { UdyamiSavedBusinesses } from '../entities/UdyamiSavedBusinesses.entity';
import { TrekRepository } from './_shared/trek-repository';

export class UdyamiSavedBusinessesRepository extends TrekRepository<UdyamiSavedBusinesses> {
  /** The ids of the businesses `userId` saved. */
  async idsForUser(userId: number): Promise<number[]> {
    const rows = await this.find({ user_id: userId }, { fields: ['business_id'] });
    return rows.map((r) => r.business_id);
  }

  async save(userId: number, businessId: number): Promise<void> {
    await this.upsert(
      { user_id: userId, business_id: businessId },
      { onConflictFields: ['user_id', 'business_id'], onConflictAction: 'ignore' },
    );
  }

  async unsave(userId: number, businessId: number): Promise<void> {
    await this.nativeDelete({ user_id: userId, business_id: businessId });
  }
}
