import { UdyamiNominations } from '../../db/entities/UdyamiNominations.entity';
import { UdyamiSpotlights } from '../../db/entities/UdyamiSpotlights.entity';
import type { NominationRow, NominationStatusValue, UdyamiNominationsRepository } from '../../db/repositories/UdyamiNominations.repository';
import type { SpotlightRow, UdyamiSpotlightsRepository } from '../../db/repositories/UdyamiSpotlights.repository';
import { dbNow } from '../../db/types';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import type { NominationCreateRequest, SpotlightUpsertRequest } from '@trek/shared';

/** The calendar month of `now` in UTC, as `YYYY-MM`. */
export function monthOf(now: Date = new Date()): string {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

const blankToNull = (v: string | null | undefined): string | null => (v && v.trim() ? v.trim() : null);

/** "Udyami of the Month" features and the nominations that feed them. */
@Injectable()
export class UdyamiService {
  constructor(
    @InjectRepository(UdyamiSpotlights) private readonly spotlights: UdyamiSpotlightsRepository,
    @InjectRepository(UdyamiNominations) private readonly nominations: UdyamiNominationsRepository,
  ) {}

  /** This month's feature, or the latest earlier one; null before the first. */
  current(now: Date = new Date()): Promise<SpotlightRow | null> {
    return this.spotlights.findCurrent(monthOf(now));
  }

  listSpotlights(): Promise<SpotlightRow[]> {
    return this.spotlights.listAll();
  }

  async upsertSpotlight(month: string, body: SpotlightUpsertRequest): Promise<SpotlightRow> {
    await this.spotlights.upsertMonth(
      month,
      {
        business_name: body.business_name,
        owner_name: body.owner_name,
        owner_photo_url: blankToNull(body.owner_photo_url),
        photo_url: blankToNull(body.photo_url),
        city: body.city,
        country: body.country,
        category: body.category,
        staff_count: body.staff_count ?? null,
        founded_year: body.founded_year ?? null,
        story: blankToNull(body.story),
        website: blankToNull(body.website),
      },
      dbNow(),
    );
    const row = await this.spotlights.findByMonth(month);
    if (!row) throw new Error(`Spotlight for ${month} was not stored`);
    return row;
  }

  async deleteSpotlight(month: string): Promise<boolean> {
    return (await this.spotlights.deleteMonth(month)) > 0;
  }

  nominate(userId: number, body: NominationCreateRequest): Promise<NominationRow> {
    return this.nominations.createNomination({
      business_name: body.business_name,
      owner_name: blankToNull(body.owner_name),
      city: body.city,
      country: body.country,
      category: blankToNull(body.category),
      contact: blankToNull(body.contact),
      reason: blankToNull(body.reason),
      submitted_by: userId,
    });
  }

  listNominations(): Promise<NominationRow[]> {
    return this.nominations.listAll();
  }

  setNominationStatus(id: number, status: NominationStatusValue): Promise<NominationRow | null> {
    return this.nominations.setStatus(id, status);
  }
}
