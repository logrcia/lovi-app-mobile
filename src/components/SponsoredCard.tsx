import React, { useEffect } from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { distanceKm, formatDistance, type Coordinates } from '../lib/ads/location';
import type { SponsoredPlace } from '../lib/repositories/ads';
import { alpha, COLORS, FONTS, INK_WASH, RADIUS, SHADOWS, TEXT } from '../theme';

interface SponsoredCardProps {
  place: SponsoredPlace;
  /** The visible tag, from `ad_settings.label`, e.g. "Patrocinado · demo". */
  label: string;
  userLocation: Coordinates | null;
  onImpression: (place: SponsoredPlace) => void;
  onClick: (place: SponsoredPlace) => void;
}

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

/**
 * A sponsored business between feed posts. It borrows the feed card's surface so it reads as
 * part of the scrapbook, but the label, the butter border and the action buttons make it
 * unmistakably an ad.
 */
export const SponsoredCard: React.FC<SponsoredCardProps> = ({
  place,
  label,
  userLocation,
  onImpression,
  onClick,
}) => {
  useEffect(() => {
    onImpression(place);
  }, [place, onImpression]);

  const distance = userLocation
    ? formatDistance(distanceKm(userLocation, place))
    : null;

  const open = (url: string) => {
    onClick(place);
    void Linking.openURL(url).catch(() => undefined);
  };

  const secondary: { icon: IoniconName; label: string; url: string } | null = place.phone
    ? { icon: 'call-outline', label: 'Llamar', url: `tel:${place.phone.replace(/[^\d+]/g, '')}` }
    : place.website
      ? { icon: 'globe-outline', label: 'Sitio web', url: place.website }
      : null;

  const meta = [place.category, distance].filter(Boolean).join(' · ');

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.tag}>
          <Ionicons name="megaphone-outline" size={11} color={COLORS.ink} />
          <Text style={styles.tagText}>{label}</Text>
        </View>
        <Text style={styles.nearby}>Cerca tuyo</Text>
      </View>

      <Pressable
        onPress={() => open(place.mapsUrl)}
        style={({ pressed }) => [styles.body, pressed && styles.pressed]}
        accessibilityRole="link"
        accessibilityLabel={`${label}: ${place.name}. Ver en el mapa`}
      >
        {place.thumbnail ? (
          <Image source={{ uri: place.thumbnail }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, styles.thumbFallback]}>
            <Ionicons name="paw" size={26} color={COLORS.fucsia} />
          </View>
        )}

        <View style={styles.copy}>
          <Text style={styles.name} numberOfLines={2}>
            {place.name}
          </Text>
          {meta ? (
            <Text style={styles.meta} numberOfLines={1}>
              {meta}
            </Text>
          ) : null}
          {place.rating !== null ? (
            <Text style={styles.rating}>
              ★ {place.rating.toFixed(1).replace('.', ',')}
              {place.reviews !== null ? (
                <Text style={styles.reviews}> ({place.reviews} reseñas)</Text>
              ) : null}
            </Text>
          ) : null}
          {place.address ? (
            <Text style={styles.address} numberOfLines={1}>
              {place.address}
            </Text>
          ) : null}
        </View>
      </Pressable>

      <View style={styles.actions}>
        <Pressable
          onPress={() => open(place.mapsUrl)}
          style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`Cómo llegar a ${place.name}`}
        >
          <Ionicons name="navigate" size={14} color={COLORS.ink} />
          <Text style={styles.primaryLabel}>Cómo llegar</Text>
        </Pressable>

        {secondary ? (
          <Pressable
            onPress={() => open(secondary.url)}
            style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={`${secondary.label}: ${place.name}`}
          >
            <Ionicons name={secondary.icon} size={14} color={COLORS.ink} />
            <Text style={styles.secondaryLabel}>{secondary.label}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.parchment,
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    borderColor: alpha(COLORS.butter, 0.9),
    padding: 16,
    gap: 14,
    ...SHADOWS.card,
  },
  pressed: {
    opacity: 0.75,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.butter,
  },
  tagText: {
    ...TEXT.eyebrowStrong,
    fontSize: 9,
    lineHeight: 12,
  },
  nearby: {
    ...TEXT.eyebrow,
    fontSize: 9,
    color: INK_WASH.faint,
  },
  body: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  thumb: {
    width: 76,
    height: 76,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.cream,
  },
  thumbFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alpha(COLORS.fucsia, 0.08),
  },
  copy: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontFamily: FONTS.serif,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
    color: COLORS.ink,
  },
  meta: {
    ...TEXT.small,
    fontSize: 11,
  },
  rating: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.orange,
  },
  reviews: {
    fontWeight: '400',
    color: INK_WASH.soft,
  },
  address: {
    ...TEXT.small,
    fontSize: 11,
    color: INK_WASH.soft,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  primary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.butter,
  },
  primaryLabel: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.ink,
  },
  secondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.cream,
  },
  secondaryLabel: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.ink,
  },
});
