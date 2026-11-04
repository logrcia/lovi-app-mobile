/**
 * Pure helpers for the `nearby-ads` edge function: no Deno, no network, no database. Kept apart
 * from the handler so they can be unit-tested with plain Node.
 */

/** What the app receives for each sponsored business. */
export interface SponsoredPlace {
  id: string;
  name: string;
  /** Google category, e.g. "Veterinario". */
  category: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  rating: number | null;
  reviews: number | null;
  thumbnail: string | null;
  latitude: number;
  longitude: number;
  /** A Google Maps link that opens this business. */
  mapsUrl: string;
}

/** Zones are a grid of 0.05° (~5 km at Buenos Aires' latitude). */
const ZONE_STEP = 0.05;

export interface Zone {
  key: string;
  latitude: number;
  longitude: number;
}

const snap = (value: number) => Math.round(value / ZONE_STEP) * ZONE_STEP;

/**
 * The zone a coordinate falls in. The search runs from the zone's center, never the user's exact
 * position, so SerpAPI and the cache only ever see a ~5 km cell.
 */
export function zoneFor(latitude: number, longitude: number): Zone {
  const lat = Number(snap(latitude).toFixed(2));
  const lng = Number(snap(longitude).toFixed(2));
  return { key: `${lat.toFixed(2)}:${lng.toFixed(2)}`, latitude: lat, longitude: lng };
}

export function isValidCoordinate(latitude: unknown, longitude: unknown): boolean {
  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180
  );
}

/** SerpAPI `google_maps` engine URL for a search around a zone. */
export function serpApiUrl(query: string, zone: Zone, apiKey: string): string {
  const params = new URLSearchParams({
    engine: 'google_maps',
    type: 'search',
    q: query,
    ll: `@${zone.latitude},${zone.longitude},14z`,
    hl: 'es',
    api_key: apiKey,
  });
  return `https://serpapi.com/search.json?${params.toString()}`;
}

const text = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

const num = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

const mapsUrlFor = (name: string, placeId: string | null, lat: number, lng: number) => {
  const params = new URLSearchParams({ api: '1', query: name });
  if (placeId) params.set('query_place_id', placeId);
  else params.set('query', `${lat},${lng}`);
  return `https://www.google.com/maps/search/?${params.toString()}`;
};

/**
 * Maps SerpAPI's `local_results` to the app's shape. Rows without a name or coordinates are
 * dropped: the card needs both to show the business and its distance.
 */
export function mapSerpResults(payload: unknown, maxResults: number): SponsoredPlace[] {
  const results =
    payload && typeof payload === 'object' && Array.isArray((payload as { local_results?: unknown }).local_results)
      ? ((payload as { local_results: unknown[] }).local_results)
      : [];

  const places: SponsoredPlace[] = [];
  for (const raw of results) {
    if (!raw || typeof raw !== 'object') continue;
    const row = raw as Record<string, unknown>;
    const gps = (row.gps_coordinates ?? {}) as Record<string, unknown>;
    const name = text(row.title);
    const latitude = num(gps.latitude);
    const longitude = num(gps.longitude);
    if (!name || latitude === null || longitude === null) continue;

    const placeId = text(row.place_id);
    const id = placeId ?? text(row.data_id) ?? `${name}@${latitude.toFixed(5)},${longitude.toFixed(5)}`;

    places.push({
      id,
      name,
      category: text(row.type),
      address: text(row.address),
      phone: text(row.phone),
      website: text(row.website),
      rating: num(row.rating),
      reviews: num(row.reviews),
      thumbnail: text(row.thumbnail),
      latitude,
      longitude,
      mapsUrl: mapsUrlFor(name, placeId, latitude, longitude),
    });

    if (places.length >= maxResults) break;
  }
  return places;
}

/**
 * Fictional businesses placed around the zone, for when the real search cannot run. The names
 * say "(demo)" so nobody mistakes them for real places.
 */
export function demoPlaces(zone: Zone): SponsoredPlace[] {
  const samples = [
    { name: 'Veterinaria Patitas (demo)', category: 'Veterinario', dLat: 0.006, dLng: -0.004, rating: 4.8, reviews: 312 },
    { name: 'Clínica Huellitas (demo)', category: 'Hospital veterinario', dLat: -0.008, dLng: 0.005, rating: 4.6, reviews: 198 },
    { name: 'Pet Shop Colita Feliz (demo)', category: 'Tienda de mascotas', dLat: 0.003, dLng: 0.009, rating: 4.7, reviews: 87 },
    { name: 'Peluquería Canina Firulais (demo)', category: 'Peluquería canina', dLat: -0.004, dLng: -0.01, rating: 4.5, reviews: 64 },
  ];

  return samples.map((sample, index) => {
    const latitude = Number((zone.latitude + sample.dLat).toFixed(6));
    const longitude = Number((zone.longitude + sample.dLng).toFixed(6));
    return {
      id: `demo-${index + 1}`,
      name: sample.name,
      category: sample.category,
      address: null,
      phone: null,
      website: null,
      rating: sample.rating,
      reviews: sample.reviews,
      thumbnail: null,
      latitude,
      longitude,
      mapsUrl: mapsUrlFor(sample.name, null, latitude, longitude),
    };
  });
}

/** A cached search is reused until it is older than the TTL; a demo fallback only for an hour. */
export function isFresh(
  fetchedAt: string,
  source: 'serpapi' | 'demo',
  ttlHours: number,
  now: Date = new Date()
): boolean {
  const ageHours = (now.getTime() - new Date(fetchedAt).getTime()) / 3_600_000;
  return ageHours < (source === 'demo' ? Math.min(1, ttlHours) : ttlHours);
}
