import { useCallback, useEffect, useRef, useState } from 'react';

import { getApproximateLocation, type Coordinates } from '../ads/location';
import { fetchNearbyAds, logAdEvent, type SponsoredPlace } from '../repositories/ads';

export interface SponsoredAdsState {
  /** Empty until loaded, and stays empty when location is denied or ads are off. */
  places: SponsoredPlace[];
  everyNPosts: number;
  label: string;
  /** The device position, kept on the device, for the "a 1,2 km" distance on each card. */
  userLocation: Coordinates | null;
  onImpression: (place: SponsoredPlace) => void;
  onClick: (place: SponsoredPlace) => void;
}

const EMPTY: Pick<SponsoredAdsState, 'places' | 'everyNPosts' | 'label'> = {
  places: [],
  everyNPosts: 5,
  label: 'Patrocinado',
};

/**
 * Loads the sponsored cards once per session, the first time `active` is true (the feed is on
 * screen), so the location prompt appears in context instead of at launch. Impressions are
 * counted once per business per session, and every tap on a card counts as a click.
 */
export function useSponsoredAds(active: boolean): SponsoredAdsState {
  const [state, setState] = useState(EMPTY);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [zone, setZone] = useState('');
  const started = useRef(false);
  const seen = useRef(new Set<string>());

  useEffect(() => {
    if (!active || started.current) return;
    started.current = true;

    void (async () => {
      const location = await getApproximateLocation();
      if (!location) return;
      setUserLocation(location);

      try {
        const ads = await fetchNearbyAds(location.latitude, location.longitude);
        setZone(ads.zone);
        setState({ places: ads.places, everyNPosts: ads.everyNPosts, label: ads.label });
      } catch (error) {
        console.warn('[lovi] No se pudo cargar la publicidad:', error);
      }
    })();
  }, [active]);

  const onImpression = useCallback(
    (place: SponsoredPlace) => {
      if (!zone || seen.current.has(place.id)) return;
      seen.current.add(place.id);
      logAdEvent('impression', place, zone);
    },
    [zone]
  );

  const onClick = useCallback(
    (place: SponsoredPlace) => {
      if (zone) logAdEvent('click', place, zone);
    },
    [zone]
  );

  return { ...state, userLocation, onImpression, onClick };
}
