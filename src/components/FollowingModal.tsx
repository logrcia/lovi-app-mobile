import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { alpha, COLORS, FONTS, INK_WASH, RADIUS, SHADOWS } from '../theme';
import type { Pet } from '../types';
import { AppModal } from './AppModal';

interface FollowingModalProps {
  visible: boolean;
  onClose: () => void;
  /** Pets the current profile follows, derived from `pet_follows` by `loviData`. */
  pets: Pet[];
  onSelectPet: (petId: string) => void;
}

/**
 * "Cuentas que seguís" — the list behind the counter on Mi perfil.
 * A follow row navigates to that pet's profile, which is the account you actually follow.
 */
export const FollowingModal: React.FC<FollowingModalProps> = ({
  visible,
  onClose,
  pets,
  onSelectPet,
}) => {
  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      eyebrow="tu red"
      title="Cuentas que seguís"
      description="Las mascotas cuyos recuerdos aparecen en tu feed"
      accent={COLORS.butter}
    >
      {pets.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="compass-outline" size={20} color={alpha(COLORS.ink, 0.5)} />
          </View>
          <Text style={styles.emptyTitle}>Todavía no seguís a ninguna</Text>
          <Text style={styles.emptyCopy}>
            Entrá a Explorar y tocá «Seguir» en una mascota para verla acá.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {pets.map((pet) => (
            <Pressable
              key={pet.id}
              onPress={() => {
                onClose();
                onSelectPet(pet.id);
              }}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              accessibilityRole="button"
              accessibilityLabel={`Ver el perfil de ${pet.name}`}
            >
              <Image source={pet.avatar} style={styles.avatar} alt="" />

              <View style={styles.copy}>
                <Text style={styles.name} numberOfLines={1}>
                  {pet.name}
                </Text>
                <Text style={styles.meta} numberOfLines={1}>
                  {pet.species} · {pet.owner.name}
                </Text>
              </View>

              <View style={styles.pill}>
                <Text style={styles.pillLabel}>Siguiendo</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </AppModal>
  );
};

const styles = StyleSheet.create({
  list: {
    maxHeight: 320,
  },
  listContent: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.cream,
    ...SHADOWS.soft,
  },
  rowPressed: {
    opacity: 0.85,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.parchment,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontFamily: FONTS.sans,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
  },
  meta: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    color: INK_WASH.medium,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: alpha(COLORS.fucsia, 0.12),
  },
  pillLabel: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.fucsia,
  },
  empty: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 18,
  },
  emptyIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alpha(COLORS.ink, 0.06),
  },
  emptyTitle: {
    fontFamily: FONTS.sans,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
  },
  emptyCopy: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    lineHeight: 15,
    color: INK_WASH.medium,
    textAlign: 'center',
  },
});
