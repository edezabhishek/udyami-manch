/** URL-safe text: "Himalayan Fusion, New Lynn" becomes "himalayan-fusion-new-lynn". */
export function slugify(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70)
    .replace(/-+$/g, '');
}

/** The address of a business's own page, for example "/business/12-himalayan-fusion-restaurant-and-bar-auckland". */
export function businessPath(b: { id: number; name: string; city: string }): string {
  return `/business/${b.id}-${slugify(`${b.name} ${b.city}`) || 'business'}`;
}

/** The address of a country page, or of a city page inside it. */
export function placePath(country: string, city?: string): string {
  const c = slugify(country) || 'world';
  return city ? `/place/${c}/${slugify(city) || 'city'}` : `/place/${c}`;
}
