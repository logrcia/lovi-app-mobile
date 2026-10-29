import { supabase } from '../db/client';

export interface NewAlbumDraft {
  petId: string;
  title: string;
  description?: string;
}

function readableError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes('row-level security')) {
    return 'Ese álbum no se puede crear en esa mascota.';
  }

  return message;
}

/**
 * A new album has no cover: `cover_memory_id` points at a memory row, and an album with no
 * memories has nothing to point at. The read path falls back to the first memory in the album.
 */
export async function createAlbum(draft: NewAlbumDraft): Promise<string> {
  const { data, error } = await supabase
    .from('albums')
    .insert({
      pet_id: draft.petId,
      title: draft.title,
      description: draft.description ?? null,
    })
    .select('id')
    .single();

  if (error) throw new Error(readableError(error.message));

  return data.id;
}

/** Adding or removing a memory from an album is one nullable column on the memory itself. */
export async function setMemoryAlbum(params: {
  memoryId: string;
  albumId: string | null;
}): Promise<void> {
  const { error } = await supabase
    .from('memories')
    .update({ album_id: params.albumId })
    .eq('id', params.memoryId);

  if (error) throw new Error(readableError(error.message));
}
