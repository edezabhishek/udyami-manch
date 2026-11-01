import { Migration } from '@mikro-orm/migrations';

/**
 * Udyami Manch: impact stories, what a business did for Nepal or Nepalese people.
 * Anyone signed in can submit one with a link that backs it up; admins approve
 * it before it shows to everyone. `happened_on` is a plain YYYY-MM-DD.
 */
export class Migration20200101046440_udyami_impact_stories extends Migration {
  override name = 'Migration20200101046440_udyami_impact_stories';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS udyami_impact_stories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        author_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        title TEXT NOT NULL,
        business_name TEXT NOT NULL,
        business_country TEXT NOT NULL,
        impact_place TEXT NOT NULL,
        category TEXT NOT NULL,
        summary TEXT NOT NULL,
        details TEXT,
        happened_on TEXT NOT NULL,
        people_helped INTEGER,
        cover_url TEXT,
        proof_url TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    this.addSql('CREATE INDEX IF NOT EXISTS idx_udyami_impact_author ON udyami_impact_stories(author_user_id)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_udyami_impact_status_date ON udyami_impact_stories(status, happened_on)');
  }
}
