import { Migration } from '@mikro-orm/migrations';

/**
 * Udyami Manch: "Udyami of the Month".
 *
 * `udyami_spotlights` holds one featured business per calendar month (`month`
 * is `YYYY-MM`, unique). The home page shows the current month's, or the
 * latest earlier one when this month has none yet.
 *
 * `udyami_nominations` holds businesses people suggest for the feature. A
 * nomination keeps who sent it until that account is deleted (then NULL), and
 * a `status` the admins move through new, reviewed, featured or rejected.
 */
export class Migration20200101046400_udyami_spotlights_and_nominations extends Migration {
  override name = 'Migration20200101046400_udyami_spotlights_and_nominations';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS udyami_spotlights (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        month TEXT NOT NULL UNIQUE,
        business_name TEXT NOT NULL,
        owner_name TEXT NOT NULL,
        owner_photo_url TEXT,
        photo_url TEXT,
        city TEXT NOT NULL,
        country TEXT NOT NULL,
        category TEXT NOT NULL,
        staff_count INTEGER,
        founded_year INTEGER,
        story TEXT,
        website TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    this.addSql(`
      CREATE TABLE IF NOT EXISTS udyami_nominations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        business_name TEXT NOT NULL,
        owner_name TEXT,
        city TEXT NOT NULL,
        country TEXT NOT NULL,
        category TEXT,
        contact TEXT,
        reason TEXT,
        submitted_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new', 'reviewed', 'featured', 'rejected')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    this.addSql('CREATE INDEX IF NOT EXISTS idx_udyami_nominations_submitted_by ON udyami_nominations(submitted_by)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_udyami_nominations_status ON udyami_nominations(status)');
  }
}
