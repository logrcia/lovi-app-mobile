import React from 'react';
import { StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';

import { alpha, COLORS, FONTS, RADIUS } from '../theme';

type StickerVariant = 'butter' | 'fucsia' | 'parchment' | 'navy' | 'orange';

interface StickerProps {
  children: React.ReactNode;
  variant?: StickerVariant;
  rotation?: 'left' | 'right' | 'none';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const VARIANTS: Record<StickerVariant, { background: string; color: string; border: string }> = {
  butter: {
    background: alpha(COLORS.butter, 0.9),
    color: COLORS.ink,
    border: alpha(COLORS.butter, 0.5),
  },
  fucsia: {
    background: COLORS.fucsia,
    color: COLORS.parchment,
    border: alpha(COLORS.fucsia, 0.4),
  },
  parchment: {
    background: COLORS.parchment,
    color: COLORS.ink,
    border: alpha(COLORS.ink, 0.1),
  },
  navy: {
    background: COLORS.navy,
    color: COLORS.parchment,
    border: alpha(COLORS.navy, 0.4),
  },
  orange: {
    background: COLORS.orange,
    color: COLORS.ink,
    border: alpha(COLORS.orange, 0.4),
  },
};

/** Small editorial label used across the app — never a hard black border, always a soft tint. */
export const Sticker: React.FC<StickerProps> = ({
  children,
  variant = 'butter',
  rotation = 'none',
  style,
  textStyle,
}) => {
  const palette = VARIANTS[variant];

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: palette.background,
          borderColor: palette.border,
          transform: [{ rotate: rotation === 'left' ? '-1deg' : rotation === 'right' ? '1deg' : '0deg' }],
        },
        style,
      ]}
    >
      <Text style={[styles.label, { color: palette.color }, textStyle]} numberOfLines={1}>
        {children}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  label: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
});
