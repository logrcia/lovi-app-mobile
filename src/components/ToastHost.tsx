import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  dismissMessage,
  getFeedbackSnapshot,
  subscribeFeedback,
  type FeedbackMessage,
} from '../lib/feedback';
import { COLORS, FONTS, INK_WASH, RADIUS, SHADOWS } from '../theme';

const AUTO_DISMISS_MS = 5000;

/**
 * Host for the web feedback channel.
 *
 * `react-native-web` makes `Alert` a no-op, so `showMessage` stores its messages here instead.
 * The card is pinned inside the phone-width frame and renders nothing at all when the store is
 * empty, so it never intercepts touches meant for the app.
 */
export const ToastHost: React.FC = () => {
  const message = React.useSyncExternalStore(
    subscribeFeedback,
    getFeedbackSnapshot,
    // Static rendering never has a message yet, so the snapshot is safe as a server value.
    getFeedbackSnapshot
  );

  const messageId = message?.id ?? null;

  // The id changes with every new message, so a second message restarts the countdown even
  // when it repeats the same copy.
  React.useEffect(() => {
    if (Platform.OS !== 'web' || messageId === null) return;

    const timeout = setTimeout(() => {
      dismissMessage();
    }, AUTO_DISMISS_MS);

    return () => clearTimeout(timeout);
  }, [messageId]);

  if (Platform.OS !== 'web') return null;
  if (message === null) return null;

  return (
    <View style={styles.host} pointerEvents="box-none">
      <Pressable
        onPress={dismissMessage}
        accessibilityRole="alert"
        accessibilityLabel={buildLabel(message)}
        accessibilityLiveRegion="polite"
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      >
        <Text style={styles.title} numberOfLines={2}>
          {message.title}
        </Text>
        {message.message ? <Text style={styles.message}>{message.message}</Text> : null}
      </Pressable>
    </View>
  );
};

function buildLabel(message: FeedbackMessage): string {
  return message.message ? `${message.title}. ${message.message}` : message.title;
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 96,
    zIndex: 1000,
  },
  card: {
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: INK_WASH.hairline,
    backgroundColor: COLORS.parchment,
    ...SHADOWS.soft,
  },
  cardPressed: {
    opacity: 0.92,
  },
  title: {
    fontFamily: FONTS.serif,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '600',
    color: COLORS.ink,
  },
  message: {
    marginTop: 4,
    fontFamily: FONTS.sans,
    fontSize: 12,
    lineHeight: 18,
    color: INK_WASH.medium,
  },
});
