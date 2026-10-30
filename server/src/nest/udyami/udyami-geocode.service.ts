import { Injectable } from '@nestjs/common';
import type { GeocodeResult } from '@trek/shared';

const ENDPOINT = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'UdyamiManch/1.0 (https://udyamimanch.com; edezabhishek@gmail.com)';
const MIN_GAP_MS = 1100; // the OpenStreetMap server asks for at most one request a second
const CACHE_MAX = 500;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface NominatimHit {
  display_name?: string;
  lat?: string;
  lon?: string;
  address?: Record<string, string | undefined>;
}

/**
 * Turns a typed address into places on the map, with OpenStreetMap's free
 * Nominatim service. One request at a time and one a second at most, as its usage
 * policy asks, and answers are kept for a day so a repeated search costs nothing.
 */
@Injectable()
export class UdyamiGeocodeService {
  private readonly cache = new Map<string, { at: number; results: GeocodeResult[] }>();
  private chain: Promise<unknown> = Promise.resolve();
  private lastAt = 0;

  async search(query: string): Promise<GeocodeResult[]> {
    const q = query.trim().replace(/\s+/g, ' ').slice(0, 200);
    if (q.length < 3) return [];
    const key = q.toLowerCase();
    const hit = this.cache.get(key);
    if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.results;

    const run = this.chain.then(() => this.fetchOnce(q));
    this.chain = run.catch(() => undefined);
    const results = await run;
    if (this.cache.size >= CACHE_MAX) this.cache.delete(this.cache.keys().next().value as string);
    this.cache.set(key, { at: Date.now(), results });
    return results;
  }

  private async fetchOnce(q: string): Promise<GeocodeResult[]> {
    const wait = this.lastAt + MIN_GAP_MS - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    this.lastAt = Date.now();
    const url = `${ENDPOINT}?${new URLSearchParams({ q, format: 'jsonv2', addressdetails: '1', limit: '5' })}`;
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'en' }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`address search answered ${res.status}`);
    const hits = (await res.json()) as NominatimHit[];
    const out: GeocodeResult[] = [];
    for (const h of hits) {
      const latitude = Number(h.lat);
      const longitude = Number(h.lon);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;
      const a = h.address ?? {};
      const street = [a.house_number, a.road].filter(Boolean).join(' ');
      out.push({
        label: h.display_name ?? q,
        latitude,
        longitude,
        address: street || null,
        city: a.city ?? a.town ?? a.suburb ?? a.village ?? a.municipality ?? null,
        country: a.country ?? null,
      });
    }
    return out;
  }
}
