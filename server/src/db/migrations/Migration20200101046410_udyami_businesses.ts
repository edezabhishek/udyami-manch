import { Migration } from '@mikro-orm/migrations';

/**
 * Udyami Manch: the business directory.
 *
 * `udyami_businesses` is one listing per business owned and run by Nepalis or
 * Indians (`community`), anywhere in the world. A listing someone adds starts
 * `pending` and is visible to everyone once an admin approves it; an admin's
 * own listing starts approved. `owner_user_id` is who added it and may edit it;
 * it becomes NULL if that account is deleted, and the listing stays.
 *
 * `udyami_saved_businesses` is each user's saved list. A row goes with its
 * user and with its business.
 */
export class Migration20200101046410_udyami_businesses extends Migration {
  override name = 'Migration20200101046410_udyami_businesses';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS udyami_businesses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        owner_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        community TEXT NOT NULL CHECK(community IN ('nepali', 'indian', 'both')),
        description TEXT,
        city TEXT NOT NULL,
        country TEXT NOT NULL,
        address TEXT,
        phone TEXT,
        email TEXT,
        website TEXT,
        photo_url TEXT,
        status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    this.addSql('CREATE INDEX IF NOT EXISTS idx_udyami_businesses_owner ON udyami_businesses(owner_user_id)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_udyami_businesses_status ON udyami_businesses(status)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_udyami_businesses_country_city ON udyami_businesses(country, city)');
    this.addSql(`
      CREATE TABLE IF NOT EXISTS udyami_saved_businesses (
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        business_id INTEGER NOT NULL REFERENCES udyami_businesses(id) ON DELETE CASCADE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, business_id)
      )
    `);
    this.addSql('CREATE INDEX IF NOT EXISTS idx_udyami_saved_business ON udyami_saved_businesses(business_id)');
  }
}
