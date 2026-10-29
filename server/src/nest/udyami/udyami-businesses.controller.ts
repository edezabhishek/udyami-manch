import type { User } from '../../types';
import { CurrentUser } from '../auth-core/current-user.decorator';
import { JwtAuthGuard } from '../auth-core/jwt-auth.guard';
import { ResponseContract } from '../common/response-contract';
import { BusinessStatusDto, BusinessUpsertDto } from './udyami.dto';
import { BusinessAccessError, UdyamiBusinessesService } from './udyami-businesses.service';
import { Body, Controller, Delete, Get, HttpCode, HttpException, Param, ParseIntPipe, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import {
  businessCommunitySchema,
  businessListResponseSchema,
  businessListScopeSchema,
  businessResponseSchema,
  directoryStatsSchema,
  type Business,
  type BusinessListResponse,
  type DirectoryStats,
} from '@trek/shared';

async function guarded<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (err) {
    if (err instanceof BusinessAccessError) {
      if (err.kind === 'forbidden') throw new HttpException({ error: 'Not allowed' }, 403);
      throw new HttpException({ error: 'Business not found' }, 404);
    }
    throw err;
  }
}

/** /api/udyami — the business directory. */
@Controller('api/udyami')
@UseGuards(JwtAuthGuard)
export class UdyamiBusinessesController {
  constructor(private readonly directory: UdyamiBusinessesService) {}

  @Get('directory-stats')
  @ResponseContract(directoryStatsSchema)
  async stats(@CurrentUser() user: User): Promise<DirectoryStats> {
    return this.directory.stats(user);
  }

  @Get('businesses')
  @ResponseContract(businessListResponseSchema)
  async list(
    @CurrentUser() user: User,
    @Query('scope') scope?: string,
    @Query('q') q?: string,
    @Query('country') country?: string,
    @Query('city') city?: string,
    @Query('category') category?: string,
    @Query('community') community?: string,
  ): Promise<BusinessListResponse> {
    const parsedScope = businessListScopeSchema.safeParse(scope ?? 'all');
    if (!parsedScope.success) throw new HttpException({ error: 'Invalid scope' }, 400);
    const parsedCommunity = community ? businessCommunitySchema.safeParse(community) : null;
    if (parsedCommunity && !parsedCommunity.success) throw new HttpException({ error: 'Invalid community' }, 400);
    const businesses = await guarded(() =>
      this.directory.list(user, { scope: parsedScope.data, q, country, city, category, community: parsedCommunity?.data }),
    );
    return { businesses };
  }

  @Get('businesses/:id')
  @ResponseContract(businessResponseSchema)
  async get(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number): Promise<{ business: Business }> {
    return { business: await guarded(() => this.directory.get(user, id)) };
  }

  @Post('businesses')
  @ResponseContract(businessResponseSchema)
  async create(@CurrentUser() user: User, @Body() body: BusinessUpsertDto): Promise<{ business: Business }> {
    return { business: await this.directory.create(user, body) };
  }

  @Put('businesses/:id')
  @ResponseContract(businessResponseSchema)
  async update(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: BusinessUpsertDto,
  ): Promise<{ business: Business }> {
    return { business: await guarded(() => this.directory.update(user, id, body)) };
  }

  @Delete('businesses/:id')
  async remove(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number): Promise<{ success: boolean }> {
    await guarded(() => this.directory.remove(user, id));
    return { success: true };
  }

  @Post('businesses/:id/save')
  @HttpCode(200)
  @ResponseContract(businessResponseSchema)
  async save(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number): Promise<{ business: Business }> {
    return { business: await guarded(() => this.directory.setSaved(user, id, true)) };
  }

  @Delete('businesses/:id/save')
  @ResponseContract(businessResponseSchema)
  async unsave(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number): Promise<{ business: Business }> {
    return { business: await guarded(() => this.directory.setSaved(user, id, false)) };
  }

  @Patch('businesses/:id/status')
  @HttpCode(200)
  @ResponseContract(businessResponseSchema)
  async setStatus(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: BusinessStatusDto,
  ): Promise<{ business: Business }> {
    return { business: await guarded(() => this.directory.setStatus(user, id, body.status)) };
  }
}
