import { UdyamiBusinesses } from '../../db/entities/UdyamiBusinesses.entity';
import { UdyamiEvents } from '../../db/entities/UdyamiEvents.entity';
import type { BusinessRow, UdyamiBusinessesRepository } from '../../db/repositories/UdyamiBusinesses.repository';
import type { EventRow, UdyamiEventsRepository } from '../../db/repositories/UdyamiEvents.repository';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import { businessPath, placePath, slugify } from '@trek/shared';
import fs from 'node:fs';
import path from 'node:path';
import { PUBLIC_DIR } from '../platform/platform.routes';

const SITE = 'Udyami Manch';
const COMMUNITY: Record<string, string> = { nepali: 'Nepali owned', indian: 'Indian owned', both: 'Nepali and Indian owned' };

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const json = (o: unknown): string => JSON.stringify(o).replace(/</g, '\\u003c');
const cut = (s: string, n: number): string => (s.length <= n ? s : `${s.slice(0, n - 1).trimEnd()}…`);
const isoUtc = (db: string): string => `${db.replace(' ', 'T')}Z`;

export interface SeoPage { status: number; html: string; redirect?: string }

interface PageSpec {
  title: string;
  description: string;
  path: string;
  body: string;
  jsonLd?: unknown[];
  noindex?: boolean;
  status?: number;
}

/**
 * Finished HTML for the pages a search engine or an AI crawler should read: the
 * app's own shell with the title, description, share preview and structured data
 * filled in for the page, and the content itself inside it. The app replaces that
 * content the moment it loads, so visitors see the normal site.
 */
@Injectable()
export class SeoService {
  private shell: string | null | undefined;

  constructor(
    @InjectRepository(UdyamiBusinesses) private readonly businesses: UdyamiBusinessesRepository,
    @InjectRepository(UdyamiEvents) private readonly events: UdyamiEventsRepository,
  ) {}

  private loadShell(): string | null {
    if (this.shell !== undefined) return this.shell;
    try { this.shell = fs.readFileSync(path.join(PUBLIC_DIR, 'index.html'), 'utf8'); } catch { this.shell = null; }
    return this.shell;
  }

  private async approved(): Promise<BusinessRow[]> {
    return this.businesses.list({ status: 'approved' }, 5000);
  }

  private render(base: string, spec: PageSpec): SeoPage {
    const url = `${base}${spec.path}`;
    const image = `${base}/icons/icon-512x512.png`;
    const head = [
      `<title>${esc(spec.title)}</title>`,
      `<meta name="description" content="${esc(spec.description)}" />`,
      `<meta name="robots" content="${spec.noindex ? 'noindex,follow' : 'index,follow,max-image-preview:large'}" />`,
      `<link rel="canonical" href="${esc(url)}" />`,
      `<meta property="og:type" content="website" />`,
      `<meta property="og:site_name" content="${SITE}" />`,
      `<meta property="og:title" content="${esc(spec.title)}" />`,
      `<meta property="og:description" content="${esc(spec.description)}" />`,
      `<meta property="og:url" content="${esc(url)}" />`,
      `<meta property="og:image" content="${esc(image)}" />`,
      `<meta name="twitter:card" content="summary" />`,
      `<meta name="twitter:title" content="${esc(spec.title)}" />`,
      `<meta name="twitter:description" content="${esc(spec.description)}" />`,
      `<meta name="twitter:image" content="${esc(image)}" />`,
      ...(spec.jsonLd ?? []).map((o) => `<script type="application/ld+json">${json(o)}</script>`),
      '<style>.seo{font-family:system-ui,sans-serif;max-width:860px;margin:0 auto;padding:24px;color:#14232B;line-height:1.55}.seo a{color:#1F4455}.seo nav a{margin-right:14px;font-weight:600}.seo li{margin:4px 0}</style>',
    ].join('\n    ');
    const nav = `<nav><a href="/atlas">Atlas</a><a href="/">Businesses</a><a href="/vacay">Events</a></nav>`;
    const content = `<div class="seo"><header><strong>${SITE}</strong> ${nav}</header><main>${spec.body}</main></div>`;
    const shell = this.loadShell();
    const html = shell
      ? shell
        .replace(/<title>[\s\S]*?<\/title>/i, '')
        .replace(/<(?:meta|link)[^>]*data-seo-default[^>]*>\s*/gi, '')
        .replace('</head>', `    ${head}\n  </head>`)
        .replace('<div id="root"></div>', `<div id="root">${content}</div>`)
      : `<!doctype html><html lang="en"><head><meta charset="utf-8" />${head}</head><body>${content}</body></html>`;
    return { status: spec.status ?? 200, html };
  }

  private orgJsonLd(base: string): unknown[] {
    return [
      { '@context': 'https://schema.org', '@type': 'Organization', name: SITE, url: base, logo: `${base}/icons/icon-512x512.png` },
      { '@context': 'https://schema.org', '@type': 'WebSite', name: SITE, url: base },
    ];
  }

  private crumbs(base: string, items: { name: string; path: string }[]): unknown {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: `${base}${it.path}` })),
    };
  }

  private countries(list: BusinessRow[]): { name: string; count: number }[] {
    const m = new Map<string, { name: string; count: number }>();
    for (const b of list) {
      const k = slugify(b.country);
      const e = m.get(k) ?? { name: b.country.trim(), count: 0 };
      e.count += 1;
      m.set(k, e);
    }
    return [...m.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }

  private businessList(list: BusinessRow[]): string {
    return `<ul>${list.map((b) => `<li><a href="${businessPath(b)}">${esc(b.name)}</a>, ${esc(b.category)}, ${esc(b.city)}, ${esc(b.country)} (${COMMUNITY[b.community]})</li>`).join('')}</ul>`;
  }

  async home(base: string): Promise<SeoPage> {
    const list = await this.approved();
    const countries = this.countries(list);
    const where = countries.length ? ` in ${countries.slice(0, 3).map((c) => c.name).join(', ')} and beyond` : ' around the world';
    return this.render(base, {
      title: `${SITE} | Nepali and Indian owned businesses worldwide`,
      description: `Find Nepali and Indian owned restaurants, shops and services${where}. Browse the Atlas, the business directory and online community events.`,
      path: '/',
      jsonLd: this.orgJsonLd(base),
      body: `<h1>Nepali and Indian owned businesses, worldwide</h1>
<p>${SITE} is a directory of businesses owned and run by Nepali and Indian people. Find a restaurant, grocery, accountant or other service owned by someone from your community, wherever you live, and see them on the Atlas.</p>
${countries.length ? `<h2>Browse by country</h2><ul>${countries.map((c) => `<li><a href="${placePath(c.name)}">${esc(c.name)}</a> (${c.count})</li>`).join('')}</ul>` : ''}
${list.length ? `<h2>Businesses</h2>${this.businessList(list.slice(0, 60))}` : ''}
<p><a href="/vacay">Online events and the festival calendar</a></p>`,
    });
  }

  async events_(base: string): Promise<SeoPage> {
    const rows: EventRow[] = (await this.events.list({ status: 'approved' }, 200)).filter((e) => isoUtc(e.ends_at) >= new Date().toISOString());
    const ld = rows.slice(0, 20).map((e) => ({
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: e.title,
      description: e.description ?? undefined,
      startDate: isoUtc(e.starts_at),
      endDate: isoUtc(e.ends_at),
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
      location: { '@type': 'VirtualLocation', url: `${base}/vacay` },
      url: `${base}/vacay`,
    }));
    return this.render(base, {
      title: `Online events and festival calendar | ${SITE}`,
      description: 'Online webinars, workshops and meetups for Nepali and Indian business owners, plus a calendar of Dashain, Tihar, Diwali, Holi, Nepali New Year and New Zealand public holidays.',
      path: '/vacay',
      jsonLd: [...ld, this.crumbs(base, [{ name: SITE, path: '/' }, { name: 'Events', path: '/vacay' }])],
      body: `<h1>Online events and festival calendar</h1>
<p>Webinars, workshops and meetups for Nepali and Indian business owners, with a calendar of festivals and New Zealand public holidays.</p>
${rows.length ? `<h2>Upcoming online events</h2><ul>${rows.slice(0, 20).map((e) => `<li>${esc(e.title)}, ${esc(isoUtc(e.starts_at).slice(0, 10))}</li>`).join('')}</ul>` : '<p>No online events are scheduled yet.</p>'}`,
    });
  }

  legal(base: string, doc: 'terms' | 'privacy'): SeoPage {
    const isTerms = doc === 'terms';
    return this.render(base, {
      title: `${isTerms ? 'Terms of Use' : 'Privacy Policy'} | ${SITE}`,
      description: isTerms ? `The terms for using ${SITE}.` : `What ${SITE} collects, why, and how to ask for your information to be removed.`,
      path: `/${doc}`,
      body: `<h1>${isTerms ? 'Terms of Use' : 'Privacy Policy'}</h1>`,
    });
  }

  async business(base: string, slug: string): Promise<SeoPage> {
    const id = Number(slug.split('-')[0]);
    const b = Number.isInteger(id) ? await this.businesses.findById(id) : null;
    if (!b || b.status !== 'approved') {
      return this.render(base, { title: `Business not found | ${SITE}`, description: 'This business is not listed.', path: `/business/${slug}`, noindex: true, status: 404, body: '<h1>Business not found</h1><p><a href="/">Browse the directory</a></p>' });
    }
    const canonical = businessPath(b);
    if (canonical !== `/business/${slug}`) return { status: 301, html: '', redirect: canonical };

    const owned = COMMUNITY[b.community];
    const place = `${b.city}, ${b.country}`;
    const description = cut(`${b.name} is a ${owned} ${b.category.toLowerCase()} in ${place}.${b.description ? ` ${b.description}` : ''}${b.address ? ` Address: ${b.address}.` : ''}${b.phone ? ` Phone: ${b.phone}.` : ''}`, 158);
    const lower = b.category.toLowerCase();
    const type = /restaurant|kitchen|dining|momo/.test(lower) ? 'Restaurant' : /cafe|coffee|bakery/.test(lower) ? 'CafeOrCoffeeShop' : /grocer|store|market|mart|shop/.test(lower) ? 'GroceryStore' : /account|tax|bookkeep/.test(lower) ? 'AccountingService' : 'LocalBusiness';
    const same = list<BusinessRow>(await this.approved()).filter((x) => x.id !== b.id && slugify(x.city) === slugify(b.city) && slugify(x.country) === slugify(b.country)).slice(0, 8);
    const ld = {
      '@context': 'https://schema.org',
      '@type': type,
      name: b.name,
      description: b.description ?? `${owned} ${b.category.toLowerCase()} in ${place}`,
      url: `${base}${canonical}`,
      address: { '@type': 'PostalAddress', streetAddress: b.address ?? undefined, addressLocality: b.city, addressCountry: b.country },
      telephone: b.phone ?? undefined,
      email: b.email ?? undefined,
      sameAs: b.website ? [b.website] : undefined,
      image: b.photo_url ?? undefined,
      geo: b.latitude != null && b.longitude != null ? { '@type': 'GeoCoordinates', latitude: b.latitude, longitude: b.longitude } : undefined,
      keywords: `${owned}, ${b.category}, ${b.city}`,
    };
    return this.render(base, {
      title: `${b.name}, ${b.city} | ${owned} ${b.category} | ${SITE}`,
      description,
      path: canonical,
      jsonLd: [ld, this.crumbs(base, [{ name: SITE, path: '/' }, { name: b.country, path: placePath(b.country) }, { name: b.city, path: placePath(b.country, b.city) }, { name: b.name, path: canonical }])],
      body: `<p><a href="/">${SITE}</a> › <a href="${placePath(b.country)}">${esc(b.country)}</a> › <a href="${placePath(b.country, b.city)}">${esc(b.city)}</a></p>
<h1>${esc(b.name)}</h1>
<p>${esc(owned)} ${esc(b.category.toLowerCase())} in ${esc(place)}.</p>
${b.description ? `<p>${esc(b.description)}</p>` : ''}
<ul>
${b.address ? `<li>Address: ${esc(b.address)}, ${esc(place)}</li>` : `<li>Location: ${esc(place)}</li>`}
${b.phone ? `<li>Phone: <a href="tel:${esc(b.phone.replace(/[^+\d]/g, ''))}">${esc(b.phone)}</a></li>` : ''}
${b.website ? `<li>Website: <a href="${esc(b.website)}" rel="nofollow noopener">${esc(b.website.replace(/^https?:\/\//, ''))}</a></li>` : ''}
</ul>
${same.length ? `<h2>More in ${esc(b.city)}</h2>${this.businessList(same)}` : ''}`,
    });
  }

  async place(base: string, countrySlug: string, citySlug?: string): Promise<SeoPage> {
    const all = await this.approved();
    const inCountry = all.filter((b) => slugify(b.country) === countrySlug);
    const list = citySlug ? inCountry.filter((b) => slugify(b.city) === citySlug) : inCountry;
    const here = citySlug ? `/place/${countrySlug}/${citySlug}` : `/place/${countrySlug}`;
    if (list.length === 0) {
      return this.render(base, { title: `Nothing listed here yet | ${SITE}`, description: 'No businesses are listed for this place yet.', path: here, noindex: true, status: 404, body: '<h1>Nothing listed here yet</h1><p><a href="/">Browse the directory</a></p>' });
    }
    const country = list[0].country.trim();
    const city = citySlug ? list[0].city.trim() : null;
    const name = city ? `${city}, ${country}` : country;
    const cities = [...new Map(inCountry.map((b) => [slugify(b.city), b.city.trim()] as const)).values()].sort();
    const canonicalOk = here === (city ? placePath(country, city) : placePath(country));
    if (!canonicalOk) return { status: 301, html: '', redirect: city ? placePath(country, city) : placePath(country) };
    return this.render(base, {
      title: `Nepali and Indian owned businesses in ${name} | ${SITE}`,
      description: cut(`${list.length} Nepali and Indian owned ${list.length === 1 ? 'business' : 'businesses'} in ${name}, including ${list.slice(0, 3).map((b) => b.name).join(', ')}. Find restaurants, shops and services owned by your community.`, 158),
      path: here,
      jsonLd: [
        this.crumbs(base, [{ name: SITE, path: '/' }, { name: country, path: placePath(country) }, ...(city ? [{ name: city, path: placePath(country, city) }] : [])]),
        { '@context': 'https://schema.org', '@type': 'CollectionPage', name: `Nepali and Indian owned businesses in ${name}`, url: `${base}${here}`, mainEntity: { '@type': 'ItemList', itemListElement: list.slice(0, 50).map((b, i) => ({ '@type': 'ListItem', position: i + 1, url: `${base}${businessPath(b)}`, name: b.name })) } },
      ],
      body: `<p><a href="/">${SITE}</a>${city ? ` › <a href="${placePath(country)}">${esc(country)}</a>` : ''}</p>
<h1>Nepali and Indian owned businesses in ${esc(name)}</h1>
<p>${list.length} ${list.length === 1 ? 'business' : 'businesses'} owned and run by Nepali and Indian people.</p>
${city ? '' : `<h2>Cities</h2><ul>${cities.map((c) => `<li><a href="${placePath(country, c)}">${esc(c)}</a></li>`).join('')}</ul>`}
${this.businessList(list)}`,
    });
  }

  async sitemap(base: string): Promise<string> {
    const all = await this.approved();
    const urls: { loc: string; lastmod?: string; priority: string }[] = [
      { loc: `${base}/`, priority: '1.0' },
      { loc: `${base}/atlas`, priority: '0.9' },
      { loc: `${base}/vacay`, priority: '0.8' },
      { loc: `${base}/terms`, priority: '0.2' },
      { loc: `${base}/privacy`, priority: '0.2' },
    ];
    const seen = new Set<string>();
    for (const b of all) {
      for (const p of [placePath(b.country), placePath(b.country, b.city)]) if (!seen.has(p)) { seen.add(p); urls.push({ loc: `${base}${p}`, priority: '0.7' }); }
    }
    for (const b of all) urls.push({ loc: `${base}${businessPath(b)}`, lastmod: b.updated_at ? b.updated_at.slice(0, 10) : undefined, priority: '0.8' });
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${esc(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}<priority>${u.priority}</priority></url>`).join('\n')}\n</urlset>\n`;
  }

  robots(base: string): string {
    return `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /admin\nDisallow: /settings\nDisallow: /login\nDisallow: /register\nDisallow: /forgot-password\nDisallow: /reset-password\n\nSitemap: ${base}/sitemap.xml\n`;
  }
}

function list<T>(x: T[]): T[] { return x; }
