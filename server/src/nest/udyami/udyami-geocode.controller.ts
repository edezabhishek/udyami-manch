import { Controller, Get, HttpException, Query, UseGuards } from '@nestjs/common';
import { geocodeResponseSchema, type GeocodeResponse } from '@trek/shared';
import { JwtAuthGuard } from '../auth-core/jwt-auth.guard';
import { ResponseContract } from '../common/response-contract';
import { UdyamiGeocodeService } from './udyami-geocode.service';

/** /api/udyami/geocode — address search for the "Add business" map. Signed-in people only. */
@Controller('api/udyami/geocode')
export class UdyamiGeocodeController {
  constructor(private readonly geocode: UdyamiGeocodeService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ResponseContract(geocodeResponseSchema)
  async search(@Query('q') q?: string): Promise<GeocodeResponse> {
    try {
      return { results: await this.geocode.search(q ?? '') };
    } catch {
      throw new HttpException({ error: 'Address search is not available right now' }, 502);
    }
  }
}
