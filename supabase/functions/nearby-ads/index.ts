// Supabase Edge Function (Deno): sponsored businesses near the caller.
//
// POST { latitude, longitude }  →  { zone, source, label, everyNPosts, places }
//
// The SerpAPI key lives only here, as the SERPAPI_KEY secret. Results are cached per ~5 km zone
// in `ad_zones` for `ad_settings.cache_ttl_hours`, so a search is spent per zone, not per user.
// The user's exact position never leaves this function: the search and the cache use the zone's
// center.

import { createClient } from 'npm:@supabase/supabase-js@2';

import {
  demoPlaces,
  isFresh,
  isValidCoordinate,
  mapSerpResults,
  serpApiUrl,
  type SponsoredPlace,
  zoneFor,
} from './places.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });

interface Settings {
  enabled: boolean;
  every_n_posts: number;
  search_query: string;
  cache_ttl_hours: number;
  max_results: number;
  label: string;
  use_demo_fallback: boolean;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (request.method !== 'POST') return json({ error: 'Use POST' }, 405);

  let body: { latitude?: unknown; longitude?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Body must be JSON' }, 400);
  }
  if (!isValidCoordinate(body.latitude, body.longitude)) {
    return json({ error: 'latitude and longitude must be valid numbers' }, 400);
  }

  // Service role: the cache table is invisible to the API roles on purpose.
  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } }
  );

  const { data: settings, error: settingsError } = await admin
    .from('ad_settings')
    .select('enabled, every_n_posts, search_query, cache_ttl_hours, max_results, label, use_demo_fallback')
    .eq('id', 1)
    .single<Settings>();

  if (settingsError || !settings) return json({ error: 'ad_settings is missing' }, 500);

  const zone = zoneFor(body.latitude as number, body.longitude as number);
  const reply = (source: 'serpapi' | 'demo' | 'off', places: SponsoredPlace[]) =>
    json({
      zone: zone.key,
      source,
      label: settings.label,
      everyNPosts: settings.every_n_posts,
      places,
    });

  if (!settings.enabled) return reply('off', []);

  const query = settings.search_query.trim();

  const { data: cached } = await admin
    .from('ad_zones')
    .select('places, source, fetched_at')
    .eq('zone_key', zone.key)
    .eq('search_query', query)
    .maybeSingle<{ places: SponsoredPlace[]; source: 'serpapi' | 'demo'; fetched_at: string }>();

  if (cached && isFresh(cached.fetched_at, cached.source, settings.cache_ttl_hours)) {
    return reply(cached.source, cached.places.slice(0, settings.max_results));
  }

  let places: SponsoredPlace[] = [];
  let source: 'serpapi' | 'demo' = 'serpapi';

  const apiKey = Deno.env.get('SERPAPI_KEY');
  if (apiKey) {
    try {
      const response = await fetch(serpApiUrl(query, zone, apiKey), {
        signal: AbortSignal.timeout(15_000),
      });
      const payload = await response.json();
      if (response.ok && !payload?.error) {
        places = mapSerpResults(payload, settings.max_results);
      } else {
        console.warn('[nearby-ads] SerpAPI error:', payload?.error ?? response.status);
      }
    } catch (error) {
      console.warn('[nearby-ads] SerpAPI request failed:', error);
    }
  } else {
    console.warn('[nearby-ads] SERPAPI_KEY is not set');
  }

  if (places.length === 0) {
    // A stale real result is better than a demo one.
    if (cached?.source === 'serpapi' && cached.places.length > 0) {
      return reply('serpapi', cached.places.slice(0, settings.max_results));
    }
    if (!settings.use_demo_fallback) return reply('serpapi', []);
    places = demoPlaces(zone);
    source = 'demo';
  }

  await admin.from('ad_zones').upsert({
    zone_key: zone.key,
    search_query: query,
    places,
    source,
    fetched_at: new Date().toISOString(),
  });

  return reply(source, places);
});
