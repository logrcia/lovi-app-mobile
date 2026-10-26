import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { LoviCard } from '../components/LoviCard';
import { Sticker } from '../components/Sticker';
import {
  alpha,
  COLORS,
  DOCK_CLEARANCE,
  FONTS,
  RADIUS,
  SCREEN_PADDING,
  SHADOWS,
  TEXT,
} from '../theme';
import type { LoviMemory, Pet } from '../types';

interface HomeScreenProps {
  pets: Pet[];
  memories: LoviMemory[];
  onSelectPet: (petId: string) => void;
  onFollowToggle: (petId: string) => void;
  onOpenCreate: () => void;
  onOpenUserProfile: () => void;
}

/**
 * Editorial scrapbook feed: greeting, the user's pets strip and every Lovi memory
 * (own + followed) in one single timeline.
 */
export const HomeScreen: React.FC<HomeScreenProps> = ({
  pets,
  memories,
  onSelectPet,
  onFollowToggle,
  onOpenCreate,
  onOpenUserProfile,
}) => {
  const myPets = pets.filter((pet) => pet.isMine);

  const owner = myPets[0]?.owner;
  const ownerFirstName = owner?.name.split(' ')[0] ?? 'Abril';
  const ownerAvatar = owner?.avatar;

  if (memories.length === 0) {
    return (
      <ScrollView
        style={styles.screen}
        contentContainerStyle={{
          paddingHorizontal: SCREEN_PADDING,
          paddingTop: 12,
          paddingBottom: DOCK_CLEARANCE,
          gap: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.empty}>
          <Sticker variant="butter" rotation="none" style={styles.emptySticker}>
            tu diario social
          </Sticker>

          <View style={styles.emptyCard}>
            <View style={styles.emptySparkle}>
              <Ionicons name="sparkles" size={28} color={COLORS.ink} />
            </View>

            <Text style={styles.emptyQuote}>
              «El cuaderno todavía tiene sus hojas en blanco…»
            </Text>

            <Text style={styles.emptyCopy}>
              Aún no guardaste recuerdos de tus mascotas ni empezaste a seguir a otras. Guardá tu
              primer Lovi o explorá compañeros de cuatro patas.
            </Text>

            <Pressable
              onPress={onOpenCreate}
              style={({ pressed }) => [styles.emptyButton, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Loviar un recuerdo"
            >
              <Text style={styles.emptyButtonLabel}>Loviar un recuerdo</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{
        paddingHorizontal: SCREEN_PADDING,
        paddingTop: 12,
        paddingBottom: DOCK_CLEARANCE,
        gap: 20,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header — "Hola, {name}" editorial greeting */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Sticker variant="butter" rotation="none">
              tu diario social
            </Sticker>
            <Text style={styles.greeting}>
              {'Hola, '}
              <Text style={styles.greetingName}>{ownerFirstName}</Text>
            </Text>
          </View>

          <Pressable
            onPress={onOpenUserProfile}
            style={({ pressed }) => [styles.userAvatarButton, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={`Ver perfil de ${ownerFirstName}`}
          >
            {ownerAvatar ? (
              <Image source={ownerAvatar} style={styles.userAvatar} />
            ) : (
              <View style={[styles.userAvatar, styles.userAvatarFallback]}>
                <Text style={styles.userAvatarInitial}>
                  {(ownerFirstName[0] ?? 'A').toUpperCase()}
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        <Text style={styles.intro}>
          Los recuerdos de tus mascotas y de las que seguís, mezclados en una sola línea de tiempo.
        </Text>

        {/* Horizontal strip — Tus mascotas */}
        <View style={styles.petsSection}>
          <View style={styles.petsHeaderRow}>
            <Text style={styles.petsLabel}>Tus mascotas</Text>
            <Text style={styles.petsCount}>{myPets.length} en casa</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.petsStrip}
          >
            {myPets.map((pet) => (
              <Pressable
                key={pet.id}
                onPress={() => onSelectPet(pet.id)}
                style={({ pressed }) => [styles.petCard, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={`Ver perfil de ${pet.name}`}
              >
                <View style={styles.petAvatarWrap}>
                  <Image source={pet.avatar} style={styles.petAvatar} />
                  <View style={styles.starBadge}>
                    <Text style={styles.starText}>★</Text>
                  </View>
                </View>
                <Text style={styles.petName} numberOfLines={1}>
                  {pet.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Vertical feed */}
      <View style={styles.feed}>
        {memories.map((memory) => {
          const authorPet = pets.find((pet) => pet.id === memory.petId) ?? pets[0];

          return (
            <LoviCard
              key={memory.id}
              memory={memory}
              pet={authorPet}
              onPetClick={onSelectPet}
              onFollowToggle={onFollowToggle}
            />
          );
        })}
      </View>

      {/* Closing note */}
      <View style={styles.footerCard}>
        <Text style={styles.footerText}>bajá para seguir loviando…</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  pressed: {
    opacity: 0.7,
  },

  /* Header */
  header: {
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    ...TEXT.display,
    marginTop: 6,
  },
  greetingName: {
    fontStyle: 'italic',
    color: COLORS.fucsia,
  },
  userAvatarButton: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.pill,
    borderWidth: 2,
    borderColor: COLORS.parchment,
    backgroundColor: COLORS.parchment,
    overflow: 'hidden',
    flexShrink: 0,
    ...SHADOWS.soft,
  },
  userAvatar: {
    width: '100%',
    height: '100%',
  },
  userAvatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.butter,
  },
  userAvatarInitial: {
    fontFamily: FONTS.serif,
    fontSize: 20,
    color: COLORS.ink,
  },
  intro: {
    ...TEXT.body,
    fontSize: 12,
    lineHeight: 18,
    color: alpha(COLORS.ink, 0.75),
  },

  /* Tus mascotas */
  petsSection: {
    marginTop: 8,
  },
  petsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  petsLabel: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: alpha(COLORS.ink, 0.7),
  },
  petsCount: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    lineHeight: 15,
    color: alpha(COLORS.ink, 0.5),
  },
  petsStrip: {
    gap: 12,
    paddingVertical: 4,
    paddingRight: 4,
  },
  petCard: {
    minWidth: 76,
    padding: 10,
    alignItems: 'center',
    gap: 8,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.parchment,
    ...SHADOWS.card,
  },
  petAvatarWrap: {
    width: 48,
    height: 48,
  },
  petAvatar: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.cream,
  },
  starBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.butter,
    borderWidth: 2,
    borderColor: COLORS.parchment,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starText: {
    fontSize: 8,
    lineHeight: 9,
    fontWeight: '700',
    color: COLORS.ink,
  },
  petName: {
    fontFamily: FONTS.serif,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: COLORS.ink,
    maxWidth: 70,
  },

  /* Feed */
  feed: {
    gap: 16,
  },

  /* Closing */
  footerCard: {
    padding: 20,
    borderRadius: RADIUS.xl,
    backgroundColor: alpha(COLORS.parchment, 0.7),
    alignItems: 'center',
    ...SHADOWS.card,
  },
  footerText: {
    fontFamily: FONTS.serif,
    fontSize: 13,
    lineHeight: 19,
    fontStyle: 'italic',
    color: alpha(COLORS.ink, 0.8),
    textAlign: 'center',
  },

  /* Empty state */
  empty: {
    alignItems: 'center',
    gap: 20,
    marginVertical: 32,
  },
  emptySticker: {
    alignSelf: 'center',
  },
  emptyCard: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: 16,
    padding: 32,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.parchment,
    ...SHADOWS.card,
  },
  emptySparkle: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.xl,
    backgroundColor: alpha(COLORS.butter, 0.3),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyQuote: {
    fontFamily: FONTS.serif,
    fontSize: 20,
    lineHeight: 28,
    fontStyle: 'italic',
    color: COLORS.ink,
    textAlign: 'center',
  },
  emptyCopy: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    lineHeight: 18,
    color: alpha(COLORS.ink, 0.7),
    textAlign: 'center',
    maxWidth: 320,
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.fucsia,
    ...SHADOWS.fucsiaGlow,
  },
  emptyButtonLabel: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: COLORS.parchment,
  },
});
