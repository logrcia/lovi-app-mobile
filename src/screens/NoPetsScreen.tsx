import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Sticker } from '../components/Sticker';
import { COLORS, CARD_SURFACE, FONTS, RADIUS, SCREEN_PADDING, SHADOWS, TEXT } from '../theme';

interface NoPetsScreenProps {
  onGoToProfile: () => void;
}

/**
 * Shown instead of Pet Profile / Calendar / composer when the signed-in account has no pets.
 * Those screens are about a pet you own, so there is nothing truthful to render.
 */
export const NoPetsScreen: React.FC<NoPetsScreenProps> = ({ onGoToProfile }) => (
  <View style={styles.root}>
    <Sticker variant="parchment" rotation="none">
      todavía sin mascotas
    </Sticker>

    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Ionicons name="paw-outline" size={26} color={COLORS.ink} />
      </View>

      <Text style={styles.title}>Tu diario arranca con una mascota</Text>

      <Text style={styles.copy}>
        Todavía no agregaste ninguna. Sumá la primera y el calendario, los álbumes y los recuerdos
        se arman solos alrededor de ella.
      </Text>

      <Pressable
        onPress={onGoToProfile}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        accessibilityRole="button"
      >
        <Text style={styles.buttonLabel}>Ir a mi perfil</Text>
      </Pressable>
    </View>
  </View>
);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SCREEN_PADDING,
    gap: 16,
    backgroundColor: COLORS.cream,
  },
  card: {
    ...CARD_SURFACE,
    borderRadius: RADIUS.xxl,
    padding: 22,
    alignItems: 'center',
    gap: 10,
    maxWidth: 340,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.butter,
  },
  title: {
    ...TEXT.title,
    textAlign: 'center',
  },
  copy: {
    ...TEXT.body,
    textAlign: 'center',
  },
  button: {
    marginTop: 6,
    backgroundColor: COLORS.fucsia,
    borderRadius: RADIUS.pill,
    paddingVertical: 12,
    paddingHorizontal: 22,
    ...SHADOWS.fucsiaGlow,
  },
  buttonLabel: {
    fontFamily: FONTS.sans,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.parchment,
  },
  pressed: {
    opacity: 0.9,
  },
});
