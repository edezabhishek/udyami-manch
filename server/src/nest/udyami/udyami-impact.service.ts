import { UdyamiImpactStories } from '../../db/entities/UdyamiImpactStories.entity';
import type { ImpactFields, ImpactRow, ImpactStatusValue, UdyamiImpactStoriesRepository } from '../../db/repositories/UdyamiImpactStories.repository';
import { dbNow } from '../../db/types';
import type { User } from '../../types';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import type { ImpactListScope, ImpactStory, ImpactUpsertRequest } from '@trek/shared';

const blankToNull = (v: string | null | undefined): string | null => (v && v.trim() ? v.trim() : null);

/** Thrown for a story the caller may not see or change. */
export class ImpactAccessError extends Error {
  constructor(readonly kind: 'not_found' | 'forbidden') {
    super(kind);
  }
}

function fieldsOf(body: ImpactUpsertRequest): ImpactFields {
  return {
    title: body.title.trim(),
    business_name: body.business_name.trim(),
    business_country: body.business_country.trim(),
    impact_place: body.impact_place.trim(),
    category: body.category.trim(),
    summary: body.summary.trim(),
    details: blankToNull(body.details),
    happened_on: body.happened_on,
    people_helped: body.people_helped ?? null,
    cover_url: blankToNull(body.cover_url),
    proof_url: body.proof_url.trim(),
  };
}

/**
 * Impact stories: what businesses did for Nepal and Nepalese people. Approved
 * stories are public; a pending one shows only to its author and admins. The
 * author is never shown, only the business.
 */
@Injectable()
export class UdyamiImpactService {
  constructor(@InjectRepository(UdyamiImpactStories) private readonly stories: UdyamiImpactStoriesRepository) {}

  private canSee(row: ImpactRow, user: User): boolean {
    return row.status === 'approved' || row.author_user_id === user.id || user.role === 'admin';
  }

  private canChange(row: ImpactRow, user: User): boolean {
    return row.author_user_id === user.id || user.role === 'admin';
  }

  private present(row: ImpactRow, user: User): ImpactStory {
    const mine = row.author_user_id === user.id;
    return { ...row, author_user_id: mine || user.role === 'admin' ? row.author_user_id : null, is_mine: mine };
  }

  private async visible(id: number, user: User): Promise<ImpactRow> {
    const row = await this.stories.findById(id);
    if (!row || !this.canSee(row, user)) throw new ImpactAccessError('not_found');
    return row;
  }

  async list(user: User, scope: ImpactListScope): Promise<ImpactStory[]> {
    let rows: ImpactRow[];
    if (scope === 'mine') rows = await this.stories.list({ author_user_id: user.id });
    else if (scope === 'pending') {
      if (user.role !== 'admin') throw new ImpactAccessError('forbidden');
      rows = await this.stories.list({ status: 'pending' });
    } else rows = await this.stories.approved();
    return rows.map((r) => this.present(r, user));
  }

  async get(user: User, id: number): Promise<ImpactStory> {
    return this.present(await this.visible(id, user), user);
  }

  async create(user: User, body: ImpactUpsertRequest): Promise<ImpactStory> {
    const id = await this.stories.createStory(user.id, fieldsOf(body), user.role === 'admin' ? 'approved' : 'pending');
    return this.get(user, id);
  }

  async update(user: User, id: number, body: ImpactUpsertRequest): Promise<ImpactStory> {
    const row = await this.visible(id, user);
    if (!this.canChange(row, user)) throw new ImpactAccessError('forbidden');
    const now = dbNow();
    await this.stories.updateStory(id, fieldsOf(body), now);
    if (user.role !== 'admin' && row.status !== 'pending') await this.stories.setStatus(id, 'pending', now);
    return this.get(user, id);
  }

  async remove(user: User, id: number): Promise<void> {
    const row = await this.visible(id, user);
    if (!this.canChange(row, user)) throw new ImpactAccessError('forbidden');
    await this.stories.deleteStory(id);
  }

  async setStatus(user: User, id: number, status: ImpactStatusValue): Promise<ImpactStory> {
    if (user.role !== 'admin') throw new ImpactAccessError('forbidden');
    if (!(await this.stories.setStatus(id, status, dbNow()))) throw new ImpactAccessError('not_found');
    return this.get(user, id);
  }
}
