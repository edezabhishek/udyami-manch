import { Controller, Get, Param, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { readEnv } from '../../app-config';
import { Public } from '../auth-core/public.decorator';
import { SeoService, type SeoPage } from './seo.service';

const WHY = 'a public page: search engines and AI crawlers must read it without an account';

function baseUrl(req: Request): string {
  const configured = readEnv().app.appUrl?.trim().replace(/\/+$/, '');
  return configured || `${req.protocol}://${req.get('host')}`;
}

function send(res: Response, page: SeoPage): void {
  if (page.redirect) { res.redirect(301, page.redirect); return; }
  res.status(page.status).setHeader('Cache-Control', page.status === 200 ? 'public, max-age=300' : 'no-store');
  res.type('html').send(page.html);
}

/** The public pages of the site, delivered as finished HTML. See SeoService. */
@Controller()
export class SeoController {
  constructor(private readonly seo: SeoService) {}

  @Get()
  @Public(WHY)
  async home(@Req() req: Request, @Res() res: Response): Promise<void> { send(res, await this.seo.home(baseUrl(req))); }

  @Get('dashboard')
  @Public(WHY)
  async dashboard(@Req() req: Request, @Res() res: Response): Promise<void> { send(res, await this.seo.home(baseUrl(req))); }

  @Get('atlas')
  @Public(WHY)
  async atlas(@Req() req: Request, @Res() res: Response): Promise<void> { send(res, await this.seo.home(baseUrl(req))); }

  @Get('vacay')
  @Public(WHY)
  async events(@Req() req: Request, @Res() res: Response): Promise<void> { send(res, await this.seo.events_(baseUrl(req))); }

  @Get('terms')
  @Public(WHY)
  terms(@Req() req: Request, @Res() res: Response): void { send(res, this.seo.legal(baseUrl(req), 'terms')); }

  @Get('privacy')
  @Public(WHY)
  privacy(@Req() req: Request, @Res() res: Response): void { send(res, this.seo.legal(baseUrl(req), 'privacy')); }

  @Get('business/:slug')
  @Public(WHY)
  async business(@Param('slug') slug: string, @Req() req: Request, @Res() res: Response): Promise<void> { send(res, await this.seo.business(baseUrl(req), slug)); }

  @Get('place/:country')
  @Public(WHY)
  async country(@Param('country') country: string, @Req() req: Request, @Res() res: Response): Promise<void> { send(res, await this.seo.place(baseUrl(req), country)); }

  @Get('place/:country/:city')
  @Public(WHY)
  async city(@Param('country') country: string, @Param('city') city: string, @Req() req: Request, @Res() res: Response): Promise<void> { send(res, await this.seo.place(baseUrl(req), country, city)); }

  @Get('sitemap.xml')
  @Public(WHY)
  async sitemap(@Req() req: Request, @Res() res: Response): Promise<void> {
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.type('application/xml').send(await this.seo.sitemap(baseUrl(req)));
  }

  @Get('robots.txt')
  @Public(WHY)
  robots(@Req() req: Request, @Res() res: Response): void {
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.type('text/plain').send(this.seo.robots(baseUrl(req)));
  }
}
