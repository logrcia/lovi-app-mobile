import { mediaUrl, supabase } from '../db/client';
import type { DbNotification } from '../db/session';

export type NotificationKind = DbNotification['type'];

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  /** ISO timestamp; the screen formats it relative to now. */
  createdAt: string;
  unread: boolean;
  actor: { id: string; name: string; handle: string; avatarUrl: string | null };
  pet: { id: string; name: string };
  memory: { id: string; title: string } | null;
  /** The comment text, for `comment` notifications. */
  commentBody: string | null;
}

/** The list is a recent-activity inbox, not an archive. */
const PAGE_SIZE = 60;

/**
 * Newest first. The row only stores ids, so actors, pets, memories and comments are resolved in
 * one query per table (never one per notification), the same way comments resolve authors.
 * RLS already limits the rows to the signed-in recipient; the filter makes the intent explicit.
 */
export async function listNotifications(profileId: string): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('recipient_id', profileId)
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE);

  if (error) throw new Error(error.message);

  const rows: DbNotification[] = data ?? [];
  if (rows.length === 0) return [];

  const unique = (values: (string | null)[]) =>
    [...new Set(values.filter((value): value is string => value !== null))];

  const actorIds = unique(rows.map((row) => row.actor_id));
  const petIds = unique(rows.map((row) => row.pet_id));
  const memoryIds = unique(rows.map((row) => row.memory_id));
  const commentIds = unique(rows.map((row) => row.comment_id));

  const [profiles, pets, memories, comments] = await Promise.all([
    supabase.from('profiles').select('id, name, handle, avatar_path').in('id', actorIds),
    supabase.from('pets').select('id, name').in('id', petIds),
    memoryIds.length > 0
      ? supabase.from('memories').select('id, title').in('id', memoryIds)
      : Promise.resolve({ data: [], error: null }),
    commentIds.length > 0
      ? supabase.from('memory_comments').select('id, body').in('id', commentIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const failed = [profiles, pets, memories, comments].find((result) => result.error);
  if (failed?.error) throw new Error(failed.error.message);

  const profileById = new Map((profiles.data ?? []).map((row) => [row.id, row]));
  const petById = new Map((pets.data ?? []).map((row) => [row.id, row]));
  const memoryById = new Map((memories.data ?? []).map((row) => [row.id, row]));
  const commentById = new Map((comments.data ?? []).map((row) => [row.id, row]));

  return rows.map((row) => {
    const actor = profileById.get(row.actor_id);
    const memory = row.memory_id ? memoryById.get(row.memory_id) : undefined;

    return {
      id: row.id,
      kind: row.type,
      createdAt: row.created_at,
      unread: row.read_at === null,
      actor: {
        id: row.actor_id,
        name: actor?.name ?? 'Cuenta de Lovi',
        handle: `@${actor?.handle ?? 'lovi'}`,
        avatarUrl: mediaUrl(actor?.avatar_path ?? null),
      },
      pet: { id: row.pet_id, name: petById.get(row.pet_id)?.name ?? 'tu mascota' },
      memory: memory ? { id: memory.id, title: memory.title } : null,
      commentBody: row.comment_id ? (commentById.get(row.comment_id)?.body ?? null) : null,
    };
  });
}

/** Rows only, no payload: the badge needs the number, nothing else. */
export async function countUnreadNotifications(profileId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('recipient_id', profileId)
    .is('read_at', null);

  if (error) throw new Error(error.message);
  return count ?? 0;
}

/** `read_at` is the only column the recipient may write, by grant and by policy. */
export async function markAllNotificationsRead(profileId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('recipient_id', profileId)
    .is('read_at', null);

  if (error) throw new Error(error.message);
}
