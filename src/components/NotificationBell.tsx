import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { COLORS, FONTS, RADIUS, SHADOWS } from '../theme';

interface NotificationBellProps {
  unreadCount: number;
  onPress: () => void;
}

/** Round bell with an unread badge; "9+" past nine so the badge never outgrows the button. */
export const NotificationBell: React.FC<NotificationBellProps> = ({ unreadCount, onPress }) => {
  const label =
    unreadCount > 0
      ? `Notificaciones, ${unreadCount} sin leer`
      : 'Notificaciones';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
    >
      <Ionicons
        name={unreadCount > 0 ? 'notifications' : 'notifications-outline'}
        size={22}
        color={COLORS.ink}
      />
      {unreadCount > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
        </View>
      ) : null}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.parchment,
    ...SHADOWS.soft,
  },
  pressed: {
    opacity: 0.7,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: RADIUS.pill,
    borderWidth: 2,
    borderColor: COLORS.parchment,
    backgroundColor: COLORS.fucsia,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: FONTS.sans,
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '700',
    color: COLORS.parchment,
  },
});
