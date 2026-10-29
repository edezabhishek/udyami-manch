import { Migration } from '@mikro-orm/migrations';

/**
 * Udyami Manch: online events (webinars, workshops, networking calls).
 *
 * `udyami_events` keeps start and end as UTC text so upcoming and past compare
 * as strings, and the organizer's timezone for display. `join_url` is the
 * meeting link. Admin events go live at once; others wait for review.
 *
 * `udyami_event_rsvps` is who registered; a row goes with its user and event.
 */
export class Migration20200101046420_udyami_events extends Migration {
  override name = 'Migration20200101046420_udyami_events';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS udyami_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        organizer_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        platform TEXT NOT NULL CHECK(platform IN ('zoom', 'google_meet', 'teams', 'youtube', 'facebook', 'other')),
        join_url TEXT NOT NULL,
        starts_at DATETIME NOT NULL,
        ends_at DATETIME NOT NULL,
        duration_minutes INTEGER NOT NULL,
        host_timezone TEXT NOT NULL,
        cover_url TEXT,
        status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    this.addSql('CREATE INDEX IF NOT EXISTS idx_udyami_events_organizer ON udyami_events(organizer_user_id)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_udyami_events_status_start ON udyami_events(status, starts_at)');
    this.addSql(`
      CREATE TABLE IF NOT EXISTS udyami_event_rsvps (
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        event_id INTEGER NOT NULL REFERENCES udyami_events(id) ON DELETE CASCADE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, event_id)
      )
    `);
    this.addSql('CREATE INDEX IF NOT EXISTS idx_udyami_event_rsvps_event ON udyami_event_rsvps(event_id)');
  }
}
