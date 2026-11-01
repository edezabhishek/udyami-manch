import type { User } from '../../types';
import { CurrentUser } from '../auth-core/current-user.decorator';
import { OptionalAuth } from '../auth-core/public.decorator';
import { viewer } from './viewer';
import { ResponseContract } from '../common/response-contract';
import { ImpactStatusDto, ImpactUpsertDto } from './udyami.dto';
import { ImpactAccessError, UdyamiImpactService } from './udyami-impact.service';
import { Body, Controller, Delete, Get, HttpCode, HttpException, Param, ParseIntPipe, Patch, Post, Put, Query } from '@nestjs/common';
import { impactListResponseSchema, impactListScopeSchema, impactResponseSchema, type ImpactListResponse, type ImpactStory } from '@trek/shared';

async function guarded<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (err) {
    if (err instanceof ImpactAccessError) {
      if (err.kind === 'forbidden') throw new HttpException({ error: 'Not allowed' }, 403);
      throw new HttpException({ error: 'Story not found' }, 404);
    }
    throw err;
  }
}

/** /api/udyami/impact: what businesses did for Nepal and Nepalese people. */
@Controller('api/udyami/impact')
export class UdyamiImpactController {
  constructor(private readonly impact: UdyamiImpactService) {}

  @Get()
  @OptionalAuth('the public impact stories: anyone can read approved stories')
  @ResponseContract(impactListResponseSchema)
  async list(@CurrentUser() user: User | undefined, @Query('scope') scope?: string): Promise<ImpactListResponse> {
    const parsed = impactListScopeSchema.safeParse(scope ?? 'all');
    if (!parsed.success) throw new HttpException({ error: 'Invalid scope' }, 400);
    return { stories: await guarded(() => this.impact.list(viewer(user), parsed.data)) };
  }

  @Get(':id')
  @OptionalAuth('the public impact stories: anyone can open an approved story')
  @ResponseContract(impactResponseSchema)
  async get(@CurrentUser() user: User | undefined, @Param('id', ParseIntPipe) id: number): Promise<{ story: ImpactStory }> {
    return { story: await guarded(() => this.impact.get(viewer(user), id)) };
  }

  @Post()
  @ResponseContract(impactResponseSchema)
  async create(@CurrentUser() user: User, @Body() body: ImpactUpsertDto): Promise<{ story: ImpactStory }> {
    return { story: await this.impact.create(user, body) };
  }

  @Put(':id')
  @ResponseContract(impactResponseSchema)
  async update(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number, @Body() body: ImpactUpsertDto): Promise<{ story: ImpactStory }> {
    return { story: await guarded(() => this.impact.update(user, id, body)) };
  }

  @Delete(':id')
  async remove(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number): Promise<{ success: boolean }> {
    await guarded(() => this.impact.remove(user, id));
    return { success: true };
  }

  @Patch(':id/status')
  @HttpCode(200)
  @ResponseContract(impactResponseSchema)
  async setStatus(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number, @Body() body: ImpactStatusDto): Promise<{ story: ImpactStory }> {
    return { story: await guarded(() => this.impact.setStatus(user, id, body.status)) };
  }
}
