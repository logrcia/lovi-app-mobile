import React from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import {
  createComment,
  listComments,
  type MemoryCommentView,
} from '../lib/repositories/comments';
import { formatMemoryStamp } from '../lib/repositories/loviData';
import { alpha, COLORS, FONTS, INK_WASH, RADIUS, SHADOWS, TEXT } from '../theme';
import type { LoviMemory } from '../types';
import { AppModal } from './AppModal';

interface MemoryCommentsModalProps {
  visible: boolean;
  memory: LoviMemory | null;
  onClose: () => void;
  /** Called after a comment is created so the feed can bump the card count locally. */
  onCommentCreated?: (memoryId: string) => void;
}

type CommentsStatus = 'idle' | 'loading' | 'ready' | 'error';

/**
 * Comments sheet for one memory.
 *
 * The list is loaded lazily the first time the sheet opens, so the feed never depends on the
 * `memory_comments` table at render time. A posted comment is appended locally and then
 * reconciled against `listComments`; the feed itself is never refetched from here.
 */
export const MemoryCommentsModal: React.FC<MemoryCommentsModalProps> = ({
  visible,
  memory,
  onClose,
  onCommentCreated,
}) => {
  const memoryId = memory?.id ?? null;

  const [comments, setComments] = React.useState<MemoryCommentView[]>([]);
  const [status, setStatus] = React.useState<CommentsStatus>('idle');
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [reloadToken, setReloadToken] = React.useState(0);

  const [draft, setDraft] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [sendError, setSendError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setComments([]);
    setDraft('');
    setSending(false);
    setSendError(null);
    setLoadError(null);

    if (!visible || !memoryId) {
      setStatus('idle');
      return;
    }

    let cancelled = false;
    setStatus('loading');

    listComments(memoryId)
      .then((rows) => {
        if (cancelled) return;
        setComments(rows);
        setStatus('ready');
      })
      .catch((unknownError: unknown) => {
        if (cancelled) return;
        setLoadError(
          unknownError instanceof Error
            ? unknownError.message
            : 'No pudimos cargar los comentarios.'
        );
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [visible, memoryId, reloadToken]);

  const canSend = draft.trim().length > 0 && !sending;

  const handleSend = async () => {
    const body = draft.trim();
    if (!body || sending || !memoryId) return;

    setSending(true);
    setSendError(null);

    try {
      await createComment(memoryId, body);
    } catch (unknownError) {
      setSendError(
        unknownError instanceof Error ? unknownError.message : 'Probá de nuevo.'
      );
      setSending(false);
      return;
    }

    const optimistic: MemoryCommentView = {
      id: `pending-${Date.now()}`,
      body,
      createdAt: formatMemoryStamp(new Date().toISOString()),
      author: { id: '', name: 'Vos', avatarUrl: null },
    };
    setComments((previous) => [optimistic, ...previous]);
    setDraft('');
    setStatus('ready');
    setSending(false);
    onCommentCreated?.(memoryId);

    // Best-effort reconciliation: replace the provisional row with the persisted one,
    // including its real author profile. The comment is already saved, so a read failure
    // here must not surface as a failed post.
    try {
      const rows = await listComments(memoryId);
      setComments(rows);
    } catch {
      // Keep the provisional row; the next open reloads the list.
    }
  };

  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      eyebrow="recuerdos"
      title="Comentarios"
      description={memory ? `En «${memory.title}»` : undefined}
      accent={COLORS.butter}
      footer={
        <>
          <View style={styles.composer}>
            <TextInput
              value={draft}
              onChangeText={(value) => {
                setDraft(value);
                if (sendError) setSendError(null);
              }}
              placeholder="Escribí un comentario…"
              placeholderTextColor={INK_WASH.faint}
              selectionColor={COLORS.fucsia}
              maxLength={1000}
              multiline
              editable={!sending}
              style={styles.input}
              accessibilityLabel="Escribir un comentario"
            />

            <Pressable
              onPress={() => void handleSend()}
              disabled={!canSend}
              style={({ pressed }) => [
                styles.send,
                !canSend && styles.sendDisabled,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Enviar comentario"
              accessibilityState={{ disabled: !canSend, busy: sending }}
            >
              {sending ? (
                <ActivityIndicator size="small" color={COLORS.parchment} />
              ) : (
                <Ionicons name="send" size={15} color={COLORS.parchment} />
              )}
            </Pressable>
          </View>

          {sendError ? <Text style={styles.sendError}>{sendError}</Text> : null}
        </>
      }
    >
      {status === 'loading' ? (
        <View style={styles.state}>
          <ActivityIndicator color={COLORS.ink} />
        </View>
      ) : null}

      {status === 'error' ? (
        <View style={styles.state}>
          <View style={styles.stateIcon}>
            <Ionicons name="cloud-offline-outline" size={20} color={alpha(COLORS.ink, 0.5)} />
          </View>
          <Text style={styles.emptyTitle}>No pudimos cargar los comentarios</Text>
          <Text style={styles.emptyCopy}>{loadError}</Text>
          <Pressable
            onPress={() => setReloadToken((token) => token + 1)}
            style={({ pressed }) => [styles.retry, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Reintentar"
          >
            <Text style={styles.retryLabel}>Reintentar</Text>
          </Pressable>
        </View>
      ) : null}

      {status === 'ready' && comments.length === 0 ? (
        <View style={styles.state}>
          <View style={styles.stateIcon}>
            <Ionicons name="chatbubble-ellipses-outline" size={20} color={alpha(COLORS.ink, 0.5)} />
          </View>
          <Text style={styles.emptyTitle}>Todavía no hay comentarios. Sé el primero.</Text>
        </View>
      ) : null}

      {status === 'ready' && comments.length > 0 ? (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {comments.map((comment) => (
            <View key={comment.id} style={styles.row}>
              {comment.author.avatarUrl ? (
                <Image
                  source={{ uri: comment.author.avatarUrl }}
                  style={styles.avatar}
                  alt=""
                />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarInitial}>
                    {(comment.author.name[0] ?? 'C').toUpperCase()}
                  </Text>
                </View>
              )}

              <View style={styles.copy}>
                <View style={styles.rowHeader}>
                  <Text style={styles.authorName} numberOfLines={1}>
                    {comment.author.name}
                  </Text>
                  <Text style={styles.timestamp}>{comment.createdAt}</Text>
                </View>
                <Text style={styles.body}>{comment.body}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      ) : null}
    </AppModal>
  );
};

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.7,
  },

  /* States */
  state: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 18,
  },
  stateIcon: {
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
    textAlign: 'center',
  },
  emptyCopy: {
    ...TEXT.small,
    textAlign: 'center',
  },
  retry: {
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.cream,
  },
  retryLabel: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.fucsia,
  },

  /* List */
  list: {
    maxHeight: 340,
  },
  listContent: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 10,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.cream,
    ...SHADOWS.soft,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.parchment,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.butter,
  },
  avatarInitial: {
    fontFamily: FONTS.serif,
    fontSize: 16,
    color: COLORS.ink,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  authorName: {
    flexShrink: 1,
    fontFamily: FONTS.sans,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.ink,
  },
  timestamp: {
    flexShrink: 0,
    fontFamily: FONTS.sans,
    fontSize: 9,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: INK_WASH.faint,
  },
  body: {
    ...TEXT.body,
    fontSize: 12,
    lineHeight: 17,
  },

  /* Composer */
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  input: {
    flex: 1,
    maxHeight: 96,
    minHeight: 40,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: INK_WASH.hairline,
    backgroundColor: COLORS.cream,
    fontFamily: FONTS.sans,
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.ink,
    textAlignVertical: 'top',
  },
  send: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.fucsia,
    ...SHADOWS.fucsiaGlow,
  },
  sendDisabled: {
    opacity: 0.45,
  },
  sendError: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    lineHeight: 15,
    color: COLORS.fucsia,
  },
});
