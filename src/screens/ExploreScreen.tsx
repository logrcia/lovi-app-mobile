import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Sticker } from '../components/Sticker';
import {
  alpha,
  COLORS,
  DOCK_CLEARANCE,
  FONTS,
  INK_WASH,
  RADIUS,
  SCREEN_PADDING,
  SHADOWS,
  TEXT,
} from '../theme';
import type { Pet } from '../types';

interface ExploreScreenProps {
  pets: Pet[];
  onSelectPet: (petId: string) => void;
  onFollowToggle: (petId: string) => void;
}

/**
 * Discovery surface: we follow pets, never people. Search + follow cards.
 */
export const ExploreScreen: React.FC<ExploreScreenProps> = ({
  pets,
  onSelectPet,
  onFollowToggle,
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isFocused, setIsFocused] = React.useState(false);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const explorePets = pets.filter((pet) => !pet.isMine);
  const filteredPets = explorePets.filter(
    (pet) =>
      pet.name.toLowerCase().includes(normalizedQuery) ||
      pet.species.toLowerCase().includes(normalizedQuery) ||
      pet.bio.toLowerCase().includes(normalizedQuery) ||
      pet.owner.name.toLowerCase().includes(normalizedQuery)
  );

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{
        paddingHorizontal: SCREEN_PADDING,
        paddingTop: 12,
        paddingBottom: DOCK_CLEARANCE,
        gap: 16,
      }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.header}>
        <Sticker variant="butter" rotation="none">
          descubrir
        </Sticker>
        <Text style={styles.title}>Explorar mascotas</Text>
        <Text style={styles.intro}>
          En Lovi seguimos mascotas, nunca personas. Encontrá nuevas historias de cuatro patas.
        </Text>
      </View>

      {/* Pill search bar */}
      <View style={styles.searchWrap}>
        <View style={styles.searchIcon} pointerEvents="none">
          <Ionicons name="search" size={16} color={alpha(COLORS.ink, 0.4)} />
        </View>

        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Buscar por nombre o especie (Luna, gato, etc.)…"
          placeholderTextColor={alpha(COLORS.ink, 0.4)}
          style={[
            styles.searchInput,
            isFocused && styles.searchInputFocused,
            searchQuery.length > 0 && styles.searchInputWithClear,
          ]}
          autoCorrect={false}
          autoCapitalize="none"
          accessibilityLabel="Buscar mascotas"
        />

        {searchQuery.length > 0 ? (
          <Pressable
            onPress={() => setSearchQuery('')}
            style={({ pressed }) => [styles.clearButton, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Limpiar búsqueda"
          >
            <Text style={styles.clearLabel}>Limpiar</Text>
          </Pressable>
        ) : null}
      </View>

      {/* Counter bar */}
      <View style={styles.counterBar}>
        <Text style={styles.counterStrong}>{filteredPets.length} para descubrir</Text>
        <Text style={styles.counterLabel}>Comunidad Lovi</Text>
      </View>

      {/* Empty search result */}
      {filteredPets.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyQuote}>
            No encontramos mascotas con «{searchQuery}»
          </Text>
          <Text style={styles.emptyCopy}>
            Probá buscar por especie como «perro», «gato» o revisá que el nombre esté bien escrito.
          </Text>
          <Pressable
            onPress={() => setSearchQuery('')}
            style={({ pressed }) => [styles.resetButton, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Ver todas las mascotas"
          >
            <Text style={styles.resetLabel}>Ver todas las mascotas</Text>
          </Pressable>
        </View>
      ) : null}

      {/* Pet cards */}
      <View style={styles.list}>
        {filteredPets.map((pet) => (
          <View key={pet.id} style={styles.card}>
            {/* Top row: avatar, name + meta, follow button */}
            <View style={styles.topRow}>
              <Pressable
                onPress={() => onSelectPet(pet.id)}
                style={({ pressed }) => [styles.petHead, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={`Ver perfil de ${pet.name}`}
              >
                <View style={styles.avatarWrap}>
                  <Image source={pet.avatar} style={styles.avatar} />
                  <View style={styles.speciesWrap}>
                    <Sticker
                      variant="butter"
                      rotation="none"
                      style={styles.speciesSticker}
                      textStyle={styles.speciesLabel}
                    >
                      {pet.species}
                    </Sticker>
                  </View>
                </View>

                <View style={styles.nameBlock}>
                  <Text style={styles.petName} numberOfLines={1}>
                    {pet.name}
                  </Text>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaText}>{pet.age}</Text>
                    <Text style={styles.metaText}>·</Text>
                    <Text style={styles.metaText}>{pet.followersCount} seguidores</Text>
                  </View>
                </View>
              </Pressable>

              <Pressable
                onPress={() => onFollowToggle(pet.id)}
                style={({ pressed }) => [
                  styles.followButton,
                  pet.isFollowing ? styles.followingButton : styles.notFollowingButton,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`${pet.isFollowing ? 'Dejar de seguir' : 'Seguir'} a ${pet.name}`}
              >
                <Text
                  style={[
                    styles.followLabel,
                    pet.isFollowing ? styles.followingLabel : styles.notFollowingLabel,
                  ]}
                >
                  {pet.isFollowing ? 'Siguiendo' : 'Seguir'}
                </Text>
              </Pressable>
            </View>

            {/* Middle: bio across the full card width */}
            <Pressable
              onPress={() => onSelectPet(pet.id)}
              style={({ pressed }) => [styles.bioBlock, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={`Ver perfil de ${pet.name}`}
            >
              <Text style={styles.bioText}>{pet.bio}</Text>
            </Pressable>

            {/* Bottom row: owner + view profile */}
            <View style={styles.bottomRow}>
              <View style={styles.ownerRow}>
                <Image source={pet.owner.avatar} style={styles.ownerAvatar} />
                <Text style={styles.ownerLine} numberOfLines={1}>
                  su dueño <Text style={styles.ownerName}>{pet.owner.name}</Text>
                </Text>
              </View>

              <Pressable
                onPress={() => onSelectPet(pet.id)}
                style={({ pressed }) => [styles.profileLink, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={`Ver perfil de ${pet.name}`}
              >
                <Text style={styles.profileLinkLabel}>Ver perfil</Text>
                <Ionicons name="chevron-forward" size={14} color={COLORS.fucsia} />
              </Pressable>
            </View>
          </View>
        ))}
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
    gap: 6,
  },
  title: {
    ...TEXT.display,
  },
  intro: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    lineHeight: 18,
    color: alpha(COLORS.ink, 0.75),
  },

  /* Search */
  searchWrap: {
    position: 'relative',
    justifyContent: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 1,
  },
  searchInput: {
    paddingLeft: 44,
    paddingRight: 16,
    paddingVertical: 14,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.parchment,
    borderWidth: 1,
    borderColor: INK_WASH.hairline,
    fontFamily: FONTS.sans,
    fontSize: 12,
    lineHeight: 16,
    color: COLORS.ink,
    ...SHADOWS.card,
  },
  searchInputFocused: {
    borderColor: alpha(COLORS.fucsia, 0.4),
  },
  searchInputWithClear: {
    paddingRight: 72,
  },
  clearButton: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  clearLabel: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    fontWeight: '600',
    color: alpha(COLORS.ink, 0.5),
  },

  /* Counter */
  counterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: alpha(COLORS.ink, 0.06),
  },
  counterStrong: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '500',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: alpha(COLORS.ink, 0.6),
  },
  counterLabel: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: alpha(COLORS.ink, 0.6),
  },

  /* Empty search */
  emptyCard: {
    alignItems: 'center',
    gap: 12,
    padding: 32,
    marginVertical: 16,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.parchment,
    ...SHADOWS.card,
  },
  emptyQuote: {
    fontFamily: FONTS.serif,
    fontSize: 18,
    lineHeight: 25,
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
  resetButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.cream,
  },
  resetLabel: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: COLORS.ink,
  },

  /* Cards */
  list: {
    gap: 14,
  },
  card: {
    padding: 16,
    gap: 12,
    borderRadius: RADIUS.xxl,
    borderWidth: 1,
    borderColor: INK_WASH.hairline,
    backgroundColor: COLORS.parchment,
    ...SHADOWS.card,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  petHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatarWrap: {
    width: 56,
    height: 56,
    flexShrink: 0,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.cream,
  },
  speciesWrap: {
    position: 'absolute',
    bottom: -4,
    right: -4,
  },
  speciesSticker: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  speciesLabel: {
    fontSize: 8,
    lineHeight: 10,
    letterSpacing: 0.6,
  },
  nameBlock: {
    flexShrink: 1,
    gap: 2,
  },
  petName: {
    fontFamily: FONTS.serif,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '600',
    color: COLORS.ink,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    lineHeight: 15,
    color: alpha(COLORS.ink, 0.6),
  },
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    flexShrink: 0,
  },
  followingButton: {
    backgroundColor: COLORS.cream,
  },
  notFollowingButton: {
    backgroundColor: COLORS.fucsia,
    ...SHADOWS.fucsiaGlow,
  },
  followLabel: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  followingLabel: {
    color: alpha(COLORS.ink, 0.8),
  },
  notFollowingLabel: {
    color: COLORS.parchment,
  },
  bioBlock: {
    padding: 12,
    borderRadius: RADIUS.md,
    backgroundColor: alpha(COLORS.cream, 0.6),
  },
  bioText: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    lineHeight: 18,
    color: alpha(COLORS.ink, 0.8),
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: alpha(COLORS.ink, 0.06),
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  ownerAvatar: {
    width: 16,
    height: 16,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.cream,
  },
  ownerLine: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    lineHeight: 15,
    color: alpha(COLORS.ink, 0.6),
    flexShrink: 1,
  },
  ownerName: {
    fontWeight: '600',
    color: COLORS.ink,
  },
  profileLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flexShrink: 0,
  },
  profileLinkLabel: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: COLORS.fucsia,
  },
});
