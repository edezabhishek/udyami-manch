import type { User } from '../../types';
import { AdminGuard } from '../auth-core/admin.guard';
import { CurrentUser } from '../auth-core/current-user.decorator';
import { JwtAuthGuard } from '../auth-core/jwt-auth.guard';
import { OptionalAuth } from '../auth-core/public.decorator';
import { ResponseContract } from '../common/response-contract';
import { NominationCreateDto, NominationStatusDto, SpotlightUpsertDto } from './udyami.dto';
import { UdyamiService } from './udyami.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  currentSpotlightResponseSchema,
  nominationListResponseSchema,
  nominationResponseSchema,
  spotlightListResponseSchema,
  spotlightMonthSchema,
  spotlightSchema,
  type CurrentSpotlightResponse,
  type Nomination,
  type NominationListResponse,
  type Spotlight,
  type SpotlightListResponse,
} from '@trek/shared';

function parseMonth(month: string): string {
  const parsed = spotlightMonthSchema.safeParse(month);
  if (!parsed.success) throw new HttpException({ error: 'Month must be YYYY-MM' }, 400);
  return parsed.data;
}

/**
 * /api/udyami — "Udyami of the Month".
 *
 * Signed-in users read the current feature and send nominations. Admins set
 * each month's feature and review nominations.
 */
@Controller('api/udyami')
export class UdyamiController {
  constructor(private readonly udyami: UdyamiService) {}

  @Get('spotlight')
  @OptionalAuth('the public home page: anyone can see the Udyami of the Month')
  @ResponseContract(currentSpotlightResponseSchema)
  async current(): Promise<CurrentSpotlightResponse> {
    return { spotlight: (await this.udyami.current()) as Spotlight | null };
  }

  @Get('spotlights')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ResponseContract(spotlightListResponseSchema)
  async listSpotlights(): Promise<SpotlightListResponse> {
    return { spotlights: (await this.udyami.listSpotlights()) as Spotlight[] };
  }

  @Put('spotlights/:month')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ResponseContract(spotlightSchema)
  async upsertSpotlight(@Param('month') month: string, @Body() body: SpotlightUpsertDto): Promise<Spotlight> {
    return (await this.udyami.upsertSpotlight(parseMonth(month), body)) as Spotlight;
  }

  @Delete('spotlights/:month')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async deleteSpotlight(@Param('month') month: string): Promise<{ success: boolean }> {
    if (!(await this.udyami.deleteSpotlight(parseMonth(month)))) {
      throw new HttpException({ error: 'No feature for that month' }, 404);
    }
    return { success: true };
  }

  @Post('nominations')
  @ResponseContract(nominationResponseSchema)
  async nominate(@CurrentUser() user: User, @Body() body: NominationCreateDto): Promise<{ nomination: Nomination }> {
    return { nomination: (await this.udyami.nominate(user.id, body)) as Nomination };
  }

  @Get('nominations')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ResponseContract(nominationListResponseSchema)
  async listNominations(): Promise<NominationListResponse> {
    return { nominations: (await this.udyami.listNominations()) as Nomination[] };
  }

  @Patch('nominations/:id')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ResponseContract(nominationResponseSchema)
  async setStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: NominationStatusDto,
  ): Promise<{ nomination: Nomination }> {
    const row = await this.udyami.setNominationStatus(id, body.status);
    if (!row) throw new HttpException({ error: 'Nomination not found' }, 404);
    return { nomination: row as Nomination };
  }
}
