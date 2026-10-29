import type { User } from '../../types';

/**
 * Who is looking at the public directory when nobody is signed in. Id 0 matches
 * no row, so a guest sees approved listings and events only, owns nothing, has
 * saved nothing, and never sees an event's join link.
 */
const GUEST = { id: 0, role: 'guest' } as unknown as User;

export function viewer(user: User | null | undefined): User {
  return user ?? GUEST;
}
