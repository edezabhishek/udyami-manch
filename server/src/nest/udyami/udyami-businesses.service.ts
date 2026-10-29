import { UdyamiBusinesses } from '../../db/entities/UdyamiBusinesses.entity';
import { UdyamiSavedBusinesses } from '../../db/entities/UdyamiSavedBusinesses.entity';
import type {
  BusinessFields,
  BusinessFilter,
  BusinessRow,
  BusinessStatusValue,
  UdyamiBusinessesRepository,
} from '../../db/repositories/UdyamiBusinesses.repository';
import type { UdyamiSavedBusinessesRepository } from '../../db/repositories/UdyamiSavedBusinesses.repository';
import { dbNow } from '../../db/types';
import type { User } from '../../types';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import type { Business, BusinessListScope, BusinessUpsertRequest, DirectoryStats } from '@trek/shared';

const blankToNull = (v: string | null | undefined): string | null => (v && v.trim() ? v.trim() : null);

export interface BusinessQuery {
  scope: BusinessListScope;
  q?: string;
  country?: string;
  city?: string;
  category?: string;
  community?: 'nepali' | 'indian' | 'both';
}

/** Thrown for a business the caller may not see or change; the controller answers 404 or 403. */
export class BusinessAccessError extends Error {
  constructor(readonly kind: 'not_found' | 'forbidden') {
    super(kind);
  }
}

function fieldsOf(body: BusinessUpsertRequest): BusinessFields {
  return {
    name: body.name.trim(),
    category: body.category.trim(),
    community: body.community,
    description: blankToNull(body.description),
    city: body.city.trim(),
    country: body.country.trim(),
    address: blankToNull(body.address),
    phone: blankToNull(body.phone),
    email: blankToNull(body.email),
    website: blankToNull(body.website),
    photo_url: blankToNull(body.photo_url),
  };
}

/**
 * The Udyami Manch business directory.
 *
 * Everyone sees approved listings. A listing is also visible to whoever added
 * it, and to admins. Anyone signed in can add one; it waits for an admin unless
 * an admin added it. When a non-admin edits a listing it goes back to pending.
 */
@Injectable()
export class UdyamiBusinessesService {
  constructor(
    @InjectRepository(UdyamiBusinesses) private readonly businesses: UdyamiBusinessesRepository,
    @InjectRepository(UdyamiSavedBusinesses) private readonly saved: UdyamiSavedBusinessesRepository,
  ) {}

  private canSee(row: BusinessRow, user: User): boolean {
    return row.status === 'approved' || row.owner_user_id === user.id || user.role === 'admin';
  }

  private canChange(row: BusinessRow, user: User): boolean {
    return row.owner_user_id === user.id || user.role === 'admin';
  }

  private present(row: BusinessRow, user: User, savedIds: Set<number>): Business {
    return { ...row, saved: savedIds.has(row.id), is_mine: row.owner_user_id === user.id };
  }

  private async visible(id: number, user: User): Promise<BusinessRow> {
    const row = await this.businesses.findById(id);
    if (!row || !this.canSee(row, user)) throw new BusinessAccessError('not_found');
    return row;
  }

  async list(user: User, query: BusinessQuery): Promise<Business[]> {
    const savedIds = new Set(await this.saved.idsForUser(user.id));
    const filter: BusinessFilter = {
      q: query.q?.trim() || undefined,
      country: query.country?.trim() || undefined,
      city: query.city?.trim() || undefined,
      category: query.category?.trim() || undefined,
      community: query.community,
    };
    let rows: BusinessRow[];
    switch (query.scope) {
      case 'mine':
        rows = await this.businesses.list({ ...filter, ownerUserId: user.id });
        break;
      case 'saved':
        rows = savedIds.size === 0 ? [] : (await this.businesses.list({ ...filter, ids: [...savedIds] })).filter((r) => this.canSee(r, user));
        break;
      case 'pending':
        if (user.role !== 'admin') throw new BusinessAccessError('forbidden');
        rows = await this.businesses.list({ ...filter, status: 'pending' });
        break;
      default:
        rows = await this.businesses.list({ ...filter, status: 'approved' });
    }
    return rows.map((r) => this.present(r, user, savedIds));
  }

  async get(user: User, id: number): Promise<Business> {
    const row = await this.visible(id, user);
    return this.present(row, user, new Set(await this.saved.idsForUser(user.id)));
  }

  async create(user: User, body: BusinessUpsertRequest): Promise<Business> {
    const status: BusinessStatusValue = user.role === 'admin' ? 'approved' : 'pending';
    const id = await this.businesses.createBusiness(user.id, fieldsOf(body), status);
    return this.get(user, id);
  }

  async update(user: User, id: number, body: BusinessUpsertRequest): Promise<Business> {
    const row = await this.visible(id, user);
    if (!this.canChange(row, user)) throw new BusinessAccessError('forbidden');
    const now = dbNow();
    await this.businesses.updateBusiness(id, fieldsOf(body), now);
    if (user.role !== 'admin' && row.status !== 'pending') await this.businesses.setStatus(id, 'pending', now);
    return this.get(user, id);
  }

  async remove(user: User, id: number): Promise<void> {
    const row = await this.visible(id, user);
    if (!this.canChange(row, user)) throw new BusinessAccessError('forbidden');
    await this.businesses.deleteBusiness(id);
  }

  async setSaved(user: User, id: number, saved: boolean): Promise<Business> {
    await this.visible(id, user);
    if (saved) await this.saved.save(user.id, id);
    else await this.saved.unsave(user.id, id);
    return this.get(user, id);
  }

  async setStatus(user: User, id: number, status: BusinessStatusValue): Promise<Business> {
    if (user.role !== 'admin') throw new BusinessAccessError('forbidden');
    if (!(await this.businesses.setStatus(id, status, dbNow()))) throw new BusinessAccessError('not_found');
    return this.get(user, id);
  }

  async stats(user: User): Promise<DirectoryStats> {
    const places = await this.businesses.approvedPlaces();
    const savedIds = await this.saved.idsForUser(user.id);
    return {
      businesses: places.length,
      countries: new Set(places.map((p) => p.country.trim().toLowerCase())).size,
      cities: new Set(places.map((p) => `${p.city.trim().toLowerCase()}|${p.country.trim().toLowerCase()}`)).size,
      mine: await this.businesses.countWhere({ ownerUserId: user.id }),
      saved: savedIds.length,
      pending: user.role === 'admin' ? await this.businesses.countWhere({ status: 'pending' }) : 0,
    };
  }
}
