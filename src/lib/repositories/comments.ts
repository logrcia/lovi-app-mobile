import { mediaUrl, supabase } from '../db/client';
import type { DbMemoryComment } from '../db/session';
import { formatMemoryStamp } from './loviData';

export interface MemoryCommentView {
  id: string;
  body: string;
  createdAt: string;
  author: { id: string; name: string; avatarUrl: string | null };
}

/** Supabase speaks English; the composer speaks Spanish. */
function readableError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes('row-level security')) {
    return 'Ese comentario no se puede publicar.';
  }
  if (normalized.includes('memory_comments_body_check')) {
    return 'El comentario tiene que tener entre 1 y 1000 caracteres.';
  }

  return message;
}

/** Newest first. Authors are resolved in one extra query, never one query per comment. */
export async function listComments(memoryId: string): Promise<MemoryCommentView[]> {
  const { data, error } = await supabase
    .from('memory_comments')
    .select('*')
    .eq('memory_id', memoryId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(readableError(error.message));

  const comments: DbMemoryComment[] = data ?? [];
  if (comments.length === 0) return [];

  const authorIds = [...new Set(comments.map((comment) => comment.author_id))];
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, name, avatar_path')
    .in('id', authorIds);

  if (profilesError) throw new Error(readableError(profilesError.message));

  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  return comments.map((comment) => {
    const author = profileById.get(comment.author_id);
    return {
      id: comment.id,
      body: comment.body,
      createdAt: formatMemoryStamp(comment.created_at),
      author: {
        id: comment.author_id,
        name: author?.name ?? 'Cuenta de Lovi',
        avatarUrl: mediaUrl(author?.avatar_path ?? null),
      },
    };
  });
}

/**
 * `author_id` is deliberately omitted: the column defaults to `auth.uid()` and the insert
 * policy checks that value, so the client cannot author a comment as someone else.
 */
export async function createComment(memoryId: string, body: string): Promise<void> {
  const trimmed = body.trim();

  if (!trimmed) {
    throw new Error('Escribí un comentario antes de enviarlo.');
  }

  const { error } = await supabase
    .from('memory_comments')
    .insert({ memory_id: memoryId, body: trimmed });

  if (error) throw new Error(readableError(error.message));
}
