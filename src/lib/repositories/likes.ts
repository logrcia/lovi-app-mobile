import { supabase } from '../db/client';

/** Supabase speaks English; the card speaks Spanish. */
function readableError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes('row-level security')) {
    return 'Ese me gusta no se puede guardar.';
  }
  if (normalized.includes('could not find the table')) {
    return 'Los me gusta todavía no están disponibles.';
  }

  return message;
}

/** Every memory this profile liked. Read once for the whole feed, never per card. */
export async function listLikedMemoryIds(profileId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('memory_likes')
    .select('memory_id')
    .eq('user_id', profileId);

  if (error) throw new Error(readableError(error.message));

  return new Set((data ?? []).map((row) => row.memory_id));
}

/**
 * `(memory_id, user_id)` is the primary key, so a second tap must not fail: the upsert
 * swallows the duplicate instead of raising a uniqueness error. `user_id` is left out of the
 * payload on purpose — the column defaults to `auth.uid()` and the insert policy checks it.
 * Unliking is a plain delete, which RLS scopes to the caller's own row.
 */
export async function setMemoryLiked(memoryId: string, liked: boolean): Promise<void> {
  if (liked) {
    const { error } = await supabase
      .from('memory_likes')
      .upsert(
        { memory_id: memoryId },
        { onConflict: 'memory_id,user_id', ignoreDuplicates: true }
      );

    if (error) throw new Error(readableError(error.message));
    return;
  }

  const { error } = await supabase
    .from('memory_likes')
    .delete()
    .eq('memory_id', memoryId);

  if (error) throw new Error(readableError(error.message));
}
