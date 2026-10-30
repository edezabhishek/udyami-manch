import { AppSettings } from '../../db/entities/AppSettings.entity';
import { UdyamiBusinesses } from '../../db/entities/UdyamiBusinesses.entity';
import type { AppSettingsRepository } from '../../db/repositories/AppSettings.repository';
import type { UdyamiBusinessesRepository } from '../../db/repositories/UdyamiBusinesses.repository';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable, Logger, type OnApplicationBootstrap } from '@nestjs/common';
import { UnitOfWork } from '../database/unit-of-work';
import { STARTER_LISTINGS } from './starter-listings';
import { UdyamiGeocodeService } from './udyami-geocode.service';

const MARKER = 'udyami_starter_listings_done';

/**
 * Adds the starter listings the first time a new install starts with an empty
 * directory, then never again, so a listing an admin deletes stays deleted. The map
 * pin for each is looked up afterwards, in the background, and a failed lookup just
 * leaves the listing without a pin for an admin to place.
 */
@Injectable()
export class UdyamiStarterListingsService implements OnApplicationBootstrap {
  private readonly log = new Logger('UdyamiStarterListings');

  constructor(
    @InjectRepository(UdyamiBusinesses) private readonly businesses: UdyamiBusinessesRepository,
    @InjectRepository(AppSettings) private readonly settings: AppSettingsRepository,
    private readonly geocode: UdyamiGeocodeService,
    private readonly uow: UnitOfWork,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      const ids = await this.uow.transactional(async () => {
        if (await this.settings.getValue(MARKER)) return [];
        const existing = await this.businesses.countWhere({});
        await this.settings.setValue(MARKER, new Date().toISOString());
        if (existing > 0) return [];
        const added: number[] = [];
        for (const fields of STARTER_LISTINGS) added.push(await this.businesses.createBusiness(null, fields, 'approved'));
        return added;
      });
      if (ids.length === 0) return;
      this.log.log(`added ${ids.length} starter listings`);
      void this.placePins(ids);
    } catch (err) {
      this.log.warn(`starter listings skipped: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  private async placePins(ids: number[]): Promise<void> {
    for (let i = 0; i < ids.length; i++) {
      const f = STARTER_LISTINGS[i];
      try {
        const [hit] = await this.geocode.search([f.address, f.city, f.country].filter(Boolean).join(', '));
        if (hit) await this.uow.transactional(() => this.businesses.nativeUpdate({ id: ids[i] }, { latitude: hit.latitude, longitude: hit.longitude }));
      } catch (err) {
        this.log.warn(`no map pin for ${f.name}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }
}
