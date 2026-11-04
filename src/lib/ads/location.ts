import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/** How long to wait for a fresh fix before giving up. Browsers can wait forever otherwise. */
const FIX_TIMEOUT_MS = 10_000;

/** Device-local memory of the last approximate area, for visits where no fix arrives. */
const LAST_AREA_KEY = 'lovi.ads.lastArea';

/** Last areas older than this are not reused: the user has probably moved. */
const LAST_AREA_MAX_AGE_MS = 7 * 24 * 60 * 60_000;

/** ~1 km: precise enough for "a 750 m" style distances, not a home address. */
const roundCoordinate = (value: number) => Math.round(value * 100) / 100;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

async function readLastArea(): Promise<Coordinates | null> {
  try {
    const raw = await AsyncStorage.getItem(LAST_AREA_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as Coordinates & { savedAt: number };
    if (Date.now() - saved.savedAt > LAST_AREA_MAX_AGE_MS) return null;
    return { latitude: saved.latitude, longitude: saved.longitude };
  } catch {
    return null;
  }
}

async function saveLastArea(location: Coordinates): Promise<void> {
  try {
    await AsyncStorage.setItem(
      LAST_AREA_KEY,
      JSON.stringify({
        latitude: roundCoordinate(location.latitude),
        longitude: roundCoordinate(location.longitude),
        savedAt: Date.now(),
      })
    );
  } catch {
    // Storage can be unavailable (private browsing); the next visit just asks again.
  }
}

async function getFreshFix(): Promise<Coordinates | null> {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (!permission.granted) return null;

  const recent = await Location.getLastKnownPositionAsync({ maxAge: 30 * 60_000 }).catch(
    () => null
  );
  const fix =
    recent ??
    (await withTimeout(
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      FIX_TIMEOUT_MS
    ));

  return fix ? { latitude: fix.coords.latitude, longitude: fix.coords.longitude } : null;
}

/**
 * The device's approximate position, or `null` when there is none at all. Never throws:
 * sponsored cards are optional, so a missing location just means no ads.
 *
 * A fresh fix wins and is remembered on the device, rounded to ~1 km. When no fix arrives
 * (permission not granted on this visit, a browser that only asks once, a slow or blocked
 * prompt), the last remembered area from the past week is used instead, so the cards do not
 * vanish between visits. Nothing here leaves the device except through `fetchNearbyAds`, and
 * the server snaps it to a ~5 km zone.
 */
export async function getApproximateLocation(): Promise<Coordinates | null> {
  let fresh: Coordinates | null = null;
  try {
    // The permission request itself can hang on web when the prompt is suppressed.
    fresh = await withTimeout(getFreshFix(), FIX_TIMEOUT_MS + 2_000);
  } catch {
    fresh = null;
  }

  if (fresh) {
    await saveLastArea(fresh);
    return fresh;
  }
  return readLastArea();
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
