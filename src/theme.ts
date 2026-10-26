import { Platform, TextStyle, ViewStyle } from 'react-native';

/**
 * Lovi design tokens — ported 1:1 from the editorial design reference.
 * Every screen/component imports from here so the visual language stays consistent.
 */

export const COLORS = {
  cream: '#F9F2E4',
  parchment: '#FFFBF0',
  ink: '#282B0A',
  orange: '#F39D23',
  fucsia: '#D51993',
  butter: '#F5D244',
  navy: '#294EA7',
  dock: '#1A1C08',
} as const;

export const FONTS = {
  serif: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' }),
  sans: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }),
  mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'Menlo' }),
} as const;

export const RADIUS = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 28,
  xxxl: 32,
  pill: 999,
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

/** Horizontal padding used by every screen. */
export const SCREEN_PADDING = 16;
/** Clearance reserved at the bottom of every scroll view so content never hides behind the floating dock. */
export const DOCK_CLEARANCE = 128;
export const DOCK_HEIGHT = 58;

/** Converts a palette hex into rgba() so we can express the design's subtle ink washes. */
export function alpha(hex: string, opacity: number): string {
  const clean = hex.replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;

  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/** Soft washes derived from the ink color — replaces the reference's `text-[#282B0A]/xx` classes. */
export const INK_WASH = {
  strong: alpha(COLORS.ink, 0.85),
  medium: alpha(COLORS.ink, 0.7),
  soft: alpha(COLORS.ink, 0.55),
  faint: alpha(COLORS.ink, 0.4),
  hairline: alpha(COLORS.ink, 0.08),
  wash: alpha(COLORS.ink, 0.05),
} as const;

export const SHADOWS = {
  /** The signature `.intelly-card` elevation: soft, warm, barely there. */
  card: {
    shadowColor: COLORS.ink,
    shadowOpacity: 0.05,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  } as ViewStyle,
  soft: {
    shadowColor: COLORS.ink,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  } as ViewStyle,
  fucsiaGlow: {
    shadowColor: COLORS.fucsia,
    shadowOpacity: 0.38,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  } as ViewStyle,
  orangeGlow: {
    shadowColor: COLORS.orange,
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  } as ViewStyle,
  darkGlow: {
    shadowColor: COLORS.dock,
    shadowOpacity: 0.32,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  } as ViewStyle,
  dock: {
    shadowColor: COLORS.dock,
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 14,
  } as ViewStyle,
} as const;

/**
 * Typography presets. The reference mixes an editorial serif (headlines) with a
 * compact sans (UI + body). No black borders anywhere: hierarchy comes from size,
 * weight and warm ink washes.
 */
export const TEXT = {
  display: {
    fontFamily: FONTS.serif,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.5,
    color: COLORS.ink,
  } satisfies TextStyle,
  headline: {
    fontFamily: FONTS.serif,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.3,
    color: COLORS.ink,
  } satisfies TextStyle,
  title: {
    fontFamily: FONTS.serif,
    fontSize: 18,
    lineHeight: 24,
    color: COLORS.ink,
  } satisfies TextStyle,
  subtitle: {
    fontFamily: FONTS.serif,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '600',
    color: COLORS.ink,
  } satisfies TextStyle,
  body: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    lineHeight: 18,
    color: INK_WASH.strong,
  } satisfies TextStyle,
  small: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    lineHeight: 16,
    color: INK_WASH.medium,
  } satisfies TextStyle,
  eyebrow: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontWeight: '700',
    color: INK_WASH.soft,
  } satisfies TextStyle,
  eyebrowStrong: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontWeight: '700',
    color: COLORS.ink,
  } satisfies TextStyle,
} as const;

/** Reusable card surface: parchment fill, no black border, soft warm shadow. */
export const CARD_SURFACE = {
  backgroundColor: COLORS.parchment,
  borderRadius: RADIUS.xl,
  borderWidth: 1,
  borderColor: INK_WASH.hairline,
  ...SHADOWS.card,
} as const;
