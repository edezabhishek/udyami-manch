import { Migration } from '@mikro-orm/migrations';

/**
 * Udyami Manch: where a listing is. `latitude` and `longitude` come from the
 * address search or from the owner placing the pin, and stay NULL when the
 * listing has no location (older listings, or an owner who skipped the map).
 */
export class Migration20200101046430_udyami_business_location extends Migration {
  override name = 'Migration20200101046430_udyami_business_location';

  override up(): void {
    this.addSql('ALTER TABLE udyami_businesses ADD COLUMN latitude REAL');
    this.addSql('ALTER TABLE udyami_businesses ADD COLUMN longitude REAL');
  }
}
