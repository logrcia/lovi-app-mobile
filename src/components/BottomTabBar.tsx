import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { alpha, COLORS, DOCK_HEIGHT, FONTS, RADIUS, SHADOWS } from '../theme';
import type { MainTab, ScreenType } from '../types';

interface BottomTabBarProps {
  currentScreen: ScreenType;
  onNavigate: (tab: MainTab) => void;
  onOpenCreate: () => void;
}

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const TABS: Array<{ key: MainTab; label: string; icon: IconName; activeIcon: IconName }> = [
  { key: 'home', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
  { key: 'explore', label: 'Explorar', icon: 'compass-outline', activeIcon: 'compass' },
  { key: 'calendar', label: 'Calendario', icon: 'calendar-outline', activeIcon: 'calendar' },
  { key: 'userProfile', label: 'Mi Perfil', icon: 'person-outline', activeIcon: 'person' },
];

/**
 * Floating dark dock. Home · Explorar · (+ fucsia raised) · Calendario · Mi Perfil.
 */
export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  currentScreen,
  onNavigate,
  onOpenCreate,
}) => {
  const insets = useSafeAreaInsets();

  const isActive = (tab: MainTab) =>
    currentScreen === tab || (tab === 'userProfile' && currentScreen === 'petProfile');

  const renderTab = (tab: (typeof TABS)[number]) => {
    const active = isActive(tab.key);

    return (
      <Pressable
        key={tab.key}
        onPress={() => onNavigate(tab.key)}
        style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        accessibilityLabel={tab.label}
      >
        <Ionicons
          name={active ? tab.activeIcon : tab.icon}
          size={18}
          color={active ? COLORS.butter : alpha(COLORS.parchment, 0.6)}
        />
        <Text style={[styles.tabLabel, active ? styles.tabLabelActive : styles.tabLabelIdle]}>
          {tab.label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={[styles.wrapper, { bottom: Math.max(insets.bottom, 8) + 4 }]} pointerEvents="box-none">
      <View style={styles.dock}>
        {renderTab(TABS[0])}
        {renderTab(TABS[1])}

        <View style={styles.fabSlot}>
          <Pressable
            onPress={onOpenCreate}
            style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
            accessibilityRole="button"
            accessibilityLabel="Loviar recuerdo"
          >
            <Ionicons name="add" size={26} color={COLORS.parchment} />
          </Pressable>
        </View>

        {renderTab(TABS[2])}
        {renderTab(TABS[3])}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  dock: {
    width: '100%',
    maxWidth: 370,
    height: DOCK_HEIGHT,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.dock,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    ...SHADOWS.dock,
  },
  tab: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  pressed: {
    opacity: 0.65,
  },
  tabLabel: {
    fontFamily: FONTS.sans,
    fontSize: 9,
    lineHeight: 11,
    letterSpacing: -0.1,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: COLORS.butter,
    fontWeight: '600',
  },
  tabLabelIdle: {
    color: alpha(COLORS.parchment, 0.6),
  },
  fabSlot: {
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.fucsia,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
    borderWidth: 4,
    borderColor: COLORS.dock,
    ...SHADOWS.fucsiaGlow,
    ...Platform.select({ android: { elevation: 10 }, default: {} }),
  },
  fabPressed: {
    transform: [{ scale: 0.94 }],
  },
});
