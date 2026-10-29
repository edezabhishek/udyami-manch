import type { UdyamiNominations } from '../entities/UdyamiNominations.entity';
import { TrekRepository } from './_shared/trek-repository';

export type NominationStatusValue = 'new' | 'reviewed' | 'featured' | 'rejected';

/** A `udyami_nominations` row as the API emits it. */
export interface NominationRow {
  id: number;
  business_name: string;
  owner_name: string | null;
  city: string;
  country: string;
  category: string | null;
  contact: string | null;
  reason: string | null;
  submitted_by: number | null;
  status: NominationStatusValue;
  created_at: string | null;
}

export type NominationFields = Omit<NominationRow, 'id' | 'status' | 'created_at'>;

function toNominationRow(e: UdyamiNominations): NominationRow {
  return {
    id: e.id,
    business_name: e.business_name,
    owner_name: e.owner_name ?? null,
    city: e.city,
    country: e.country,
    category: e.category ?? null,
    contact: e.contact ?? null,
    reason: e.reason ?? null,
    submitted_by: e.submitted_by ?? null,
    status: e.status as NominationStatusValue,
    created_at: e.created_at ?? null,
  };
}

export class UdyamiNominationsRepository extends TrekRepository<UdyamiNominations> {
  async createNomination(fields: NominationFields): Promise<NominationRow> {
    const id = await this.insert({ ...fields, status: 'new' });
    const row = await this.findOneOrFail({ id: Number(id) });
    return toNominationRow(row);
  }

  /** Every nomination, newest first. */
  async listAll(): Promise<NominationRow[]> {
    const rows = await this.find({}, { orderBy: { id: 'desc' } });
    return rows.map(toNominationRow);
  }

  /** Sets the status; returns the updated row, or null when the id does not exist. */
  async setStatus(id: number, status: NominationStatusValue): Promise<NominationRow | null> {
    const changed = await this.nativeUpdate({ id }, { status });
    if (!changed) return null;
    const row = await this.findOne({ id }, { refresh: true });
    return row ? toNominationRow(row) : null;
  }
}
