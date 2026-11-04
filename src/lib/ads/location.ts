import * as Location from 'expo-location';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * The device's approximate position, or `null` when the user declines or it cannot be read.
 * Never throws: sponsored cards are optional, so a missing location just means no ads.
 *
 * Balanced accuracy (roughly a city block) is plenty, since the server snaps it to a ~5 km
 * zone anyway, and it resolves much faster than GPS-level accuracy. A recent cached fix is
 * used first so returning to the feed does not wait on the radio again.
 */
export async function getApproximateLocation(): Promise<Coordinates | null> {
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) return null;

    const recent = await Location.getLastKnownPositionAsync({ maxAge: 30 * 60_000 }).catch(
      () => null
    );
    const fix =
      recent ??
      (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));

    return { latitude: fix.coords.latitude, longitude: fix.coords.longitude };
  } catch {
    return null;
  }
}

/** Great-circle distance in kilometres. */
export function distanceKm(from: Coordinates, to: Coordinates): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(to.latitude - from.latitude);
  const dLng = toRad(to.longitude - from.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.latitude)) * Math.cos(toRad(to.latitude)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

/** `0.42` → `'a 420 m'`, `3.17` → `'a 3,2 km'`. */
export function formatDistance(km: number): string {
  if (km < 1) return `a ${Math.max(50, Math.round((km * 1000) / 50) * 50)} m`;
  return `a ${km.toFixed(1).replace('.', ',')} km`;
}
