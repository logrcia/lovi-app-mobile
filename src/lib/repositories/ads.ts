import { supabase } from '../db/client';
import type { Database } from '../db/types';

export type AdSettings = Database['public']['Tables']['ad_settings']['Row'];

/** One sponsored business, as the `nearby-ads` edge function returns it. */
export interface SponsoredPlace {
  id: string;
  name: string;
  category: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  rating: number | null;
  reviews: number | null;
  thumbnail: string | null;
  latitude: number;
  longitude: number;
  mapsUrl: string;
}

export interface NearbyAds {
  zone: string;
  source: 'serpapi' | 'demo' | 'off';
  label: string;
  everyNPosts: number;
  places: SponsoredPlace[];
}

export interface AdStatRow {
  placeId: string;
  placeName: string;
  impressions: number;
  clicks: number;
  viewers: number;
}

export async function fetchAdSettings(): Promise<AdSettings | null> {
  const { data, error } = await supabase.from('ad_settings').select('*').eq('id', 1).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Sends the position to the edge function, which snaps it to a zone and answers from its cache
 * or a fresh search. The exact coordinates are not stored anywhere.
 */
export async function fetchNearbyAds(latitude: number, longitude: number): Promise<NearbyAds> {
  const { data, error } = await supabase.functions.invoke<NearbyAds>('nearby-ads', {
    body: { latitude, longitude },
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error('nearby-ads devolvió una respuesta vacía');
  return data;
}

/**
 * Fire-and-forget: a lost impression must never break the feed, so failures are only logged.
 * `profile_id` defaults to `auth.uid()` and the insert policy checks it.
 */
export function logAdEvent(
  kind: 'impression' | 'click',
  place: Pick<SponsoredPlace, 'id' | 'name'>,
  zone: string
): void {
  void supabase
    .from('ad_events')
    .insert({
      kind,
      place_id: place.id.slice(0, 200),
      place_name: place.name.slice(0, 200),
      zone_key: zone.slice(0, 40),
    })
    .then(({ error }) => {
      if (error) console.warn('[lovi] No se pudo registrar el evento de publicidad:', error.message);
    });
}

export async function isAdAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_ad_admin');
  if (error) return false;
  return data === true;
}

export async function fetchAdStats(): Promise<AdStatRow[]> {
  const { data, error } = await supabase.rpc('ad_stats');
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    placeId: row.place_id,
    placeName: row.place_name,
    impressions: Number(row.impressions),
    clicks: Number(row.clicks),
    viewers: Number(row.viewers),
  }));
}
