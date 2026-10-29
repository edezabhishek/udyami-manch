import { OptionalAuth } from '../auth-core/public.decorator';
import { getCountryGeoGz } from '../atlas/atlas-geo';
import { Controller, Get, Res } from '@nestjs/common';

import type { Response } from 'express';

/** /api/udyami/map-geo — the country outlines the public world map draws. */
@Controller('api/udyami')
export class UdyamiMapController {
  @Get('map-geo')
  @OptionalAuth('the public world map: country outlines are static public data')
  mapGeo(@Res() res: Response): void {
    const gz = getCountryGeoGz();
    if (!gz) {
      res.setHeader('Cache-Control', 'no-store');
      res.json({ type: 'FeatureCollection', features: [] });
      return;
    }
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Encoding', 'gzip');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(gz);
  }
}
