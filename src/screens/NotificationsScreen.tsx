import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import {
  listNotifications,
  markAllNotificationsRead,
  type AppNotification,
  type NotificationKind,
} from '../lib/repositories/notifications';
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

interface NotificationsScreenProps {
  profileId: string;
  onBack: () => void;
  /** Called once everything on screen has been marked as read, so the bell badge can clear. */
  onAllRead: () => void;
  onOpenPet: (petId: string) => void;
  onOpenActor: (actor: AppNotification['actor']) => void;
  onOpenComments: (memoryId: string) => void;
}

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const KIND_ICON: Record<NotificationKind, { icon: IoniconName; color: string }> = {
  follow: { icon: 'person-add', color: COLORS.navy },
  like: { icon: 'heart', color: COLORS.fucsia },
  comment: { icon: 'chatbubble', color: COLORS.orange },
};

const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** "ahora", "hace 5 min", "hace 3 h", "ayer", "hace 4 d", then a plain date. */
export function formatRelative(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  const minutes = Math.floor((now.getTime() - date.getTime()) / 60_000);

  if (minutes < 1) return 'ahora';
  if (minutes < 60) return `hace ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;

  const days = Math.floor(hours / 24);
  if (days === 1) return 'ayer';
  if (days < 7) return `hace ${days} d`;

  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`;
}

/**
 * The inbox. The header is pinned above the list, so the back arrow stays reachable however
 * far down you scroll. Opening the screen marks everything as read, but the rows that were new
 * on arrival keep their highlight until you leave, so you can still see what was new.
 */
export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
  profileId,
  onBack,
  onAllRead,
  onOpenPet,
  onOpenActor,
  onOpenComments,
}) => {
  const [items, setItems] = useState<AppNotification[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Read through a ref so a parent passing a fresh callback each render cannot re-trigger the
  // load (and with it another mark-as-read request).
  const onAllReadRef = useRef(onAllRead);
  onAllReadRef.current = onAllRead;

  const load = useCallback(async () => {
    try {
      const next = await listNotifications(profileId);
      setItems(next);
      setError(null);

      if (next.some((item) => item.unread)) {
        await markAllNotificationsRead(profileId);
      }
      onAllReadRef.current();
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : 'Error desconocido');
    }
  }, [profileId]);

  useEffect(() => {
    void load();
  }, [load]);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handlePress = (item: AppNotification) => {
    if (item.kind === 'follow') onOpenActor(item.actor);
    else if (item.kind === 'comment' && item.memory) onOpenComments(item.memory.id);
    else onOpenPet(item.pet.id);
  };

  return (
    <View style={styles.screen}>
      {/* Pinned header */}
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Volver"
          hitSlop={6}
        >
          <Ionicons name="arrow-back" size={20} color={COLORS.ink} />
        </Pressable>
        <Text style={styles.title}>Notificaciones</Text>
      </View>

      {items === null && !error ? (
        <View style={styles.centered}>
          <ActivityIndicator color={COLORS.ink} />
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} />}
        >
          {error && !items ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No pudimos cargar tus notificaciones</Text>
              <Pressable onPress={() => void refresh()} accessibilityRole="button">
                <Text style={styles.retry}>Reintentar</Text>
              </Pressable>
            </View>
          ) : items && items.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons name="notifications-outline" size={24} color={COLORS.ink} />
              </View>
              <Text style={styles.emptyTitle}>Todavía no hay novedades</Text>
              <Text style={styles.emptyCopy}>
                Cuando alguien siga a tus mascotas o le dé me gusta o comente sus recuerdos, te
                vas a enterar acá.
              </Text>
            </View>
          ) : (
            items?.map((item) => (
              <NotificationRow key={item.id} item={item} onPress={() => handlePress(item)} />
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
};

const NotificationRow: React.FC<{ item: AppNotification; onPress: () => void }> = ({
  item,
  onPress,
}) => {
  const { icon, color } = KIND_ICON[item.kind];
  const initial = (item.actor.name[0] ?? 'L').toUpperCase();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        item.unread ? styles.rowUnread : null,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
    >
      <View style={styles.avatarWrap}>
        {item.actor.avatarUrl ? (
          <Image source={{ uri: item.actor.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarInitial}>{initial}</Text>
          </View>
        )}
        <View style={[styles.kindBadge, { backgroundColor: color }]}>
          <Ionicons name={icon} size={10} color={COLORS.parchment} />
        </View>
      </View>

      <View style={styles.rowText}>
        <Text style={styles.message}>
          <Text style={styles.strong}>{item.actor.name}</Text>
          {item.kind === 'follow' ? (
            <>
              {' empezó a seguir a '}
              <Text style={styles.strong}>{item.pet.name}</Text>
            </>
          ) : item.kind === 'like' ? (
            <>
              {' le dio me gusta a '}
              <Text style={styles.strong}>«{item.memory?.title ?? 'un recuerdo'}»</Text>
            </>
          ) : (
            <>
              {' comentó en '}
              <Text style={styles.strong}>«{item.memory?.title ?? 'un recuerdo'}»</Text>
            </>
          )}
        </Text>

        {item.kind === 'comment' && item.commentBody ? (
          <Text style={styles.quote} numberOfLines={2}>
            “{item.commentBody}”
          </Text>
        ) : null}

        <Text style={styles.time}>{formatRelative(item.createdAt)}</Text>
      </View>

      {item.unread ? <View style={styles.unreadDot} /> : null}
    </Pressable>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: COLORS.cream,
    borderBottomWidth: 1,
    borderBottomColor: INK_WASH.hairline,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.parchment,
    ...SHADOWS.soft,
  },
  title: {
    ...TEXT.headline,
  },

  /* List */
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: 12,
    paddingBottom: DOCK_CLEARANCE,
    gap: 8,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.parchment,
    borderWidth: 1,
    borderColor: INK_WASH.hairline,
  },
  rowUnread: {
    backgroundColor: alpha(COLORS.butter, 0.18),
    borderColor: alpha(COLORS.butter, 0.6),
  },
  avatarWrap: {
    width: 44,
    height: 44,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.cream,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.butter,
  },
  avatarInitial: {
    fontFamily: FONTS.serif,
    fontSize: 18,
    color: COLORS.ink,
  },
  kindBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 20,
    height: 20,
    borderRadius: RADIUS.pill,
    borderWidth: 2,
    borderColor: COLORS.parchment,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  message: {
    ...TEXT.body,
    color: COLORS.ink,
  },
  strong: {
    fontWeight: '700',
  },
  quote: {
    fontFamily: FONTS.serif,
    fontSize: 12,
    lineHeight: 17,
    fontStyle: 'italic',
    color: INK_WASH.medium,
  },
  time: {
    ...TEXT.small,
    fontSize: 10,
    color: INK_WASH.faint,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.fucsia,
  },

  /* Empty / error */
  emptyCard: {
    alignItems: 'center',
    gap: 8,
    padding: 24,
    marginTop: 24,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.parchment,
    ...SHADOWS.card,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.butter,
    marginBottom: 4,
  },
  emptyTitle: {
    ...TEXT.subtitle,
    textAlign: 'center',
  },
  emptyCopy: {
    ...TEXT.body,
    textAlign: 'center',
  },
  retry: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.fucsia,
  },
});
