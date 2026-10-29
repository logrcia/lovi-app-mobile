import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Sticker } from '../components/Sticker';
import { FollowingModal } from '../components/FollowingModal';
import {
  alpha,
  CARD_SURFACE,
  COLORS,
  DOCK_CLEARANCE,
  FONTS,
  RADIUS,
  SCREEN_PADDING,
  SHADOWS,
  TEXT,
} from '../theme';
import type { Pet, UserProfile } from '../types';

interface UserProfileScreenProps {
  user: UserProfile;
  pets: Pet[];
  /** Pets the logged-in profile follows. Only meaningful when `user` is that profile. */
  followingPets: Pet[];
  currentUserId: string;
  onSelectPet: (petId: string) => void;
  onOpenCreate: () => void;
  onOpenAddPet: () => void;
  onFollowToggle: (petId: string) => void;
  onSignOut: () => void;
  onBack?: () => void;
}

interface PreferenceRow {
  id: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  background: string;
  iconColor: string;
  label: string;
  value: string;
  valueColor: string;
}

const PREFERENCES: PreferenceRow[] = [
  {
    id: 'notifications',
    icon: 'notifications',
    background: alpha(COLORS.butter, 0.25),
    iconColor: COLORS.ink,
    label: 'Recordatorios de vacunas y turnos',
    value: 'Activo',
    valueColor: COLORS.fucsia,
  },
  {
    id: 'privacy',
    icon: 'shield-checkmark',
    background: alpha(COLORS.navy, 0.15),
    iconColor: COLORS.navy,
    label: 'Privacidad de la libreta sanitaria',
    value: 'Solo dueño',
    valueColor: alpha(COLORS.ink, 0.5),
  },
  {
    id: 'export',
    icon: 'download',
    background: alpha(COLORS.orange, 0.2),
    iconColor: COLORS.orange,
    label: 'Descargar copia del diario (PDF)',
    value: 'Listo',
    valueColor: alpha(COLORS.ink, 0.5),
  },
];

export const UserProfileScreen: React.FC<UserProfileScreenProps> = ({
  user,
  pets,
  followingPets,
  currentUserId,
  onSelectPet,
  onOpenAddPet,
  onFollowToggle,
  onSignOut,
  onBack,
}) => {
  const [isFollowingOpen, setIsFollowingOpen] = React.useState(false);

  const isMe = user.id === currentUserId;
  const displayPets = pets.filter((pet) =>
    isMe ? pet.isMine : pet.owner.id === user.id || pet.owner.name === user.name
  );

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <FollowingModal
        visible={isFollowingOpen}
        onClose={() => setIsFollowingOpen(false)}
        pets={followingPets}
        onSelectPet={onSelectPet}
      />

      {onBack ? (
        <Pressable
          onPress={onBack}
          style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <Ionicons name="chevron-back" size={14} color={alpha(COLORS.ink, 0.7)} />
          <Text style={styles.backLabel}>Volver</Text>
        </Pressable>
      ) : null}

      {/* Profile header */}
      <View style={styles.header}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatarRing}>
            <Image source={user.avatar} style={styles.avatar} />
          </View>
          <View style={styles.ownerBadge}>
            <Text style={styles.ownerBadgeText}>{isMe ? 'Dueña' : 'Dueño/a'}</Text>
          </View>
        </View>

        <View style={styles.identity}>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.handle}>
            {user.handle} · {user.location}
          </Text>
          <Text style={styles.bio}>{user.bio}</Text>
        </View>
      </View>

      {/* Pets */}
      <View style={styles.petsSection}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderText}>
            <Text style={styles.sectionTitle}>{isMe ? 'Mis mascotas' : 'Sus mascotas'}</Text>
            <Text style={styles.sectionSubtitle}>
              {isMe
                ? 'Tocá una mascota para ver su diario, álbumes y cuidados'
                : `Mascotas que cuida ${user.name.split(' ')[0]} en Lovi`}
            </Text>
          </View>
          {isMe ? (
            <Pressable
              onPress={onOpenAddPet}
              style={({ pressed }) => [styles.addPetButton, pressed && styles.addPetButtonPressed]}
              accessibilityRole="button"
              accessibilityLabel="Agregar nueva mascota"
            >
              <Ionicons name="add" size={14} color={COLORS.butter} />
              <Text style={styles.addPetLabel}>Nueva mascota</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.petList}>
          {displayPets.length === 0 ? (
            <View style={styles.emptyPets}>
              <Text style={styles.emptyPetsTitle}>
                {isMe ? 'Todavía no sumaste ninguna' : 'Sin mascotas todavía'}
              </Text>
              <Text style={styles.emptyPetsCopy}>
                {isMe
                  ? 'Usá «Nueva mascota» para arrancar su diario, su calendario y sus recuerdos.'
                  : `${user.name.split(' ')[0]} todavía no sumó mascotas a Lovi.`}
              </Text>
            </View>
          ) : null}

          {displayPets.map((pet) => (
            <Pressable
              key={pet.id}
              onPress={() => onSelectPet(pet.id)}
              style={({ pressed }) => [styles.petCard, pressed && styles.petCardPressed]}
              accessibilityRole="button"
              accessibilityLabel={`Ver perfil de ${pet.name}`}
            >
              <View style={styles.petBody}>
                <View style={styles.petAvatarWrap}>
                  <Image source={pet.avatar} style={styles.petAvatar} />
                  <View style={styles.speciesSticker}>
                    <Sticker
                      variant="butter"
                      rotation="none"
                      style={styles.speciesStickerSurface}
                      textStyle={styles.speciesStickerText}
                    >
                      {pet.species}
                    </Sticker>
                  </View>
                </View>

                <View style={styles.petDetails}>
                  <View style={styles.petNameRow}>
                    <Text style={styles.petName} numberOfLines={1}>
                      {pet.name}
                    </Text>
                    <Text style={styles.petAge}>{pet.age}</Text>
                  </View>

                  <Text style={styles.petBio} numberOfLines={1}>
                    {pet.bio}
                  </Text>

                  <View style={styles.petMetaRow}>
                    <Text style={styles.petMetaText}>{pet.followersCount} seguidores</Text>
                    {pet.isMine ? (
                      <>
                        <Text style={styles.petMetaText}>·</Text>
                        <Text style={styles.mineLabel}>Tu mascota</Text>
                      </>
                    ) : (
                      <>
                        <Text style={styles.petMetaText}>·</Text>
                        <Pressable
                          onPress={() => onFollowToggle(pet.id)}
                          style={({ pressed }) => [
                            styles.followButton,
                            pet.isFollowing ? styles.followingButton : styles.notFollowingButton,
                            pressed && styles.followButtonPressed,
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
                      </>
                    )}
                  </View>
                </View>
              </View>

              <View style={styles.chevron}>
                <Ionicons name="chevron-forward" size={16} color={alpha(COLORS.ink, 0.6)} />
              </View>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Who this profile follows */}
      {isMe ? (
        <Pressable
          onPress={() => setIsFollowingOpen(true)}
          style={({ pressed }) => [
            styles.followingCard,
            pressed && styles.followingCardPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Ver las cuentas que seguís (${followingPets.length})`}
        >
          <View style={styles.followingIcon}>
            <Ionicons name="heart" size={16} color={COLORS.fucsia} />
          </View>

          <View style={styles.followingCopy}>
            <Text style={styles.followingTitle}>
              {followingPets.length === 0
                ? 'No seguís a ninguna cuenta'
                : followingPets.length === 1
                  ? 'Seguís a 1 cuenta'
                  : `Seguís a ${followingPets.length} cuentas`}
            </Text>
            <Text style={styles.followingSubtitle}>Ver la lista de mascotas que seguís</Text>
          </View>

          <Ionicons name="chevron-forward" size={16} color={alpha(COLORS.ink, 0.6)} />
        </Pressable>
      ) : null}

      {/* Account & preferences — only for the current user */}
      {isMe ? (
        <View style={styles.accountSection}>
          <Text style={styles.accountTitle}>Cuenta y Preferencias</Text>

          <View style={styles.accountCard}>
            {PREFERENCES.map((row, index) => (
              <Pressable
                key={row.id}
                style={({ pressed }) => [
                  styles.accountRow,
                  index > 0 && styles.accountRowDivider,
                  pressed && styles.accountRowPressed,
                ]}
              >
                <View style={styles.accountRowLeft}>
                  <View style={[styles.accountIcon, { backgroundColor: row.background }]}>
                    <Ionicons name={row.icon} size={16} color={row.iconColor} />
                  </View>
                  <Text style={styles.accountLabel}>{row.label}</Text>
                </View>
                <Text style={[styles.accountValue, { color: row.valueColor }]}>{row.value}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            onPress={onSignOut}
            style={({ pressed }) => [styles.signOutButton, pressed && styles.accountRowPressed]}
            accessibilityRole="button"
            accessibilityLabel="Cerrar sesión"
          >
            <Ionicons name="log-out-outline" size={15} color={COLORS.fucsia} />
            <Text style={styles.signOutLabel}>Cerrar sesión</Text>
          </Pressable>

          <Text style={styles.footer}>Lovi · {user.joinedDate}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: 12,
    paddingBottom: DOCK_CLEARANCE,
    gap: 20,
  },
  backButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  backButtonPressed: {
    backgroundColor: COLORS.parchment,
  },
  backLabel: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    color: alpha(COLORS.ink, 0.7),
  },
  header: {
    alignItems: 'center',
    gap: 12,
  },
  avatarWrap: {
    width: 104,
    height: 104,
  },
  avatarRing: {
    width: 104,
    height: 104,
    borderRadius: RADIUS.pill,
    padding: 4,
    backgroundColor: COLORS.parchment,
    ...SHADOWS.soft,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: RADIUS.pill,
  },
  ownerBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.butter,
    ...SHADOWS.card,
  },
  ownerBadgeText: {
    fontFamily: FONTS.sans,
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: COLORS.ink,
  },
  identity: {
    alignItems: 'center',
    gap: 4,
  },
  name: {
    fontFamily: FONTS.serif,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '300',
    letterSpacing: -0.5,
    textAlign: 'center',
    color: COLORS.ink,
  },
  handle: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
    textAlign: 'center',
    color: alpha(COLORS.ink, 0.5),
  },
  bio: {
    maxWidth: 340,
    paddingTop: 4,
    fontFamily: FONTS.sans,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    color: alpha(COLORS.ink, 0.75),
  },
  petsSection: {
    gap: 12,
  },
  followingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    ...CARD_SURFACE,
    borderRadius: RADIUS.lg,
  },
  followingCardPressed: {
    opacity: 0.85,
  },
  followingIcon: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alpha(COLORS.fucsia, 0.12),
  },
  followingCopy: {
    flex: 1,
    gap: 2,
  },
  followingTitle: {
    fontFamily: FONTS.sans,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    color: COLORS.ink,
  },
  followingSubtitle: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    lineHeight: 15,
    color: alpha(COLORS.ink, 0.6),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionHeaderText: {
    flex: 1,
    gap: 2,
  },
  sectionTitle: {
    fontFamily: FONTS.serif,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    color: COLORS.ink,
  },
  sectionSubtitle: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    lineHeight: 17,
    color: alpha(COLORS.ink, 0.6),
  },
  addPetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.dock,
    ...SHADOWS.soft,
  },
  addPetButtonPressed: {
    opacity: 0.85,
  },
  addPetLabel: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: COLORS.butter,
  },
  petList: {
    gap: 12,
  },
  petCard: {
    ...CARD_SURFACE,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  petCardPressed: {
    opacity: 0.92,
  },
  petBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  petAvatarWrap: {
    width: 64,
    height: 64,
  },
  petAvatar: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.md,
  },
  speciesSticker: {
    position: 'absolute',
    bottom: -4,
    right: -4,
  },
  speciesStickerSurface: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  speciesStickerText: {
    fontSize: 9,
    lineHeight: 12,
  },
  petDetails: {
    flex: 1,
    gap: 2,
  },
  petNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  petName: {
    flexShrink: 1,
    fontFamily: FONTS.serif,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '600',
    color: COLORS.ink,
  },
  petAge: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    lineHeight: 14,
    color: alpha(COLORS.ink, 0.5),
  },
  petBio: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    lineHeight: 18,
    color: alpha(COLORS.ink, 0.7),
  },
  petMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
  },
  petMetaText: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: alpha(COLORS.ink, 0.5),
  },
  mineLabel: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: COLORS.fucsia,
  },
  followButton: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  followingButton: {
    backgroundColor: alpha(COLORS.ink, 0.1),
  },
  notFollowingButton: {
    backgroundColor: COLORS.fucsia,
  },
  followButtonPressed: {
    opacity: 0.8,
  },
  followLabel: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  followingLabel: {
    color: COLORS.ink,
  },
  notFollowingLabel: {
    color: COLORS.parchment,
  },
  chevron: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cream,
  },
  accountSection: {
    gap: 10,
    paddingTop: 8,
  },
  accountTitle: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: alpha(COLORS.ink, 0.6),
  },
  accountCard: {
    ...CARD_SURFACE,
    overflow: 'hidden',
  },
  emptyPets: {
    ...CARD_SURFACE,
    borderRadius: RADIUS.xl,
    paddingVertical: 22,
    paddingHorizontal: 18,
    alignItems: 'center',
    gap: 6,
  },
  emptyPetsTitle: {
    ...TEXT.title,
    textAlign: 'center',
  },
  emptyPetsCopy: {
    ...TEXT.body,
    textAlign: 'center',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: alpha(COLORS.fucsia, 0.3),
    backgroundColor: alpha(COLORS.fucsia, 0.06),
  },
  signOutLabel: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.fucsia,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: 14,
  },
  accountRowDivider: {
    borderTopWidth: 1,
    borderTopColor: alpha(COLORS.ink, 0.06),
  },
  accountRowPressed: {
    backgroundColor: alpha(COLORS.cream, 0.4),
  },
  accountRowLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  accountIcon: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountLabel: {
    flexShrink: 1,
    fontFamily: FONTS.sans,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
    color: COLORS.ink,
  },
  accountValue: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '600',
  },
  footer: {
    paddingTop: 8,
    fontFamily: FONTS.sans,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    color: alpha(COLORS.ink, 0.4),
  },
});
