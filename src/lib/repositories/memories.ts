import type { MediaType } from '../../types';
import { supabase } from '../db/client';
import { EXTENSION_BY_MIME_TYPE } from '../media/memoryMedia';
import { readLocalAssetBytes } from '../media/readAssetBytes';

export interface NewMemoryDraft {
  petId: string;
  title: string;
  description?: string;
  mediaType: MediaType;
  /** Local `file://` uri; required for everything except a text-only memory. */
  mediaLocalUri?: string;
  mediaMimeType?: string | null;
  /** Length of a video or audio memory, in whole seconds. */
  mediaDurationSeconds?: number | null;
}

/** What the file is called in user-facing errors, per format. */
const MEDIA_NOUN: Record<MediaType, string> = {
  image: 'la foto',
  video: 'el video',
  audio: 'el audio',
  text: 'el archivo',
};

const DEFAULT_MIME_TYPE: Record<MediaType, string> = {
  image: 'image/jpeg',
  video: 'video/mp4',
  audio: 'audio/mp4',
  text: 'application/octet-stream',
};

/** Supabase speaks English; the composer speaks Spanish. */
function readableError(message: string, mediaType: MediaType = 'image'): string {
  const noun = MEDIA_NOUN[mediaType];
  const normalized = message.toLowerCase();

  if (normalized.includes('row-level security')) {
    return 'Ese recuerdo no se puede guardar en esa mascota.';
  }
  if (normalized.includes('exceeded the maximum allowed size') || normalized.includes('too large')) {
    return `${capitalize(noun)} pesa más de 50 MB. Probá con un archivo más liviano.`;
  }
  if (normalized.includes('mime type') || normalized.includes('not supported')) {
    return mediaType === 'image'
      ? 'Ese formato de foto no está soportado. Probá con JPG o PNG.'
      : `Ese formato no está soportado para ${noun}.`;
  }
  if (normalized.includes('media_presence')) {
    return 'Ese formato necesita un archivo y todavía no lo tenemos.';
  }

  return message;
}

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

function buildMediaPath(petId: string, contentType: string): string {
  const extension = EXTENSION_BY_MIME_TYPE[contentType] ?? 'bin';
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${petId}/memories/${Date.now()}-${suffix}.${extension}`;
}

/**
 * The file is uploaded before the row is inserted: `memories.media_path` is NOT NULL for
 * every non-text memory, and the storage policy only checks that the object sits inside a
 * pet you own — it does not need the memory to exist yet. If the insert fails, the uploaded
 * object is removed again so a retry cannot leave orphans in the bucket.
 */
export async function createMemory(draft: NewMemoryDraft): Promise<string> {
  if (draft.mediaType === 'text') {
    return insertMemory(draft, null);
  }

  if (!draft.mediaLocalUri) {
    throw new Error(`Ese recuerdo necesita ${MEDIA_NOUN[draft.mediaType]}.`);
  }

  const contentType = draft.mediaMimeType ?? DEFAULT_MIME_TYPE[draft.mediaType];
  const path = buildMediaPath(draft.petId, contentType);

  // Expo's fetch rejects `{ uri }` FormData parts, so the bytes are read directly.
  let bytes: ArrayBuffer;
  try {
    bytes = await readLocalAssetBytes(draft.mediaLocalUri);
  } catch {
    throw new Error(`No pudimos leer ${MEDIA_NOUN[draft.mediaType]}. Probá con otro archivo.`);
  }

  const { error: uploadError } = await supabase.storage
    .from('pet-media')
    .upload(path, bytes, { contentType, upsert: false });

  if (uploadError) throw new Error(readableError(uploadError.message, draft.mediaType));

  try {
    return await insertMemory(draft, path);
  } catch (insertError) {
    await supabase.storage.from('pet-media').remove([path]);
    throw insertError;
  }
}

async function insertMemory(draft: NewMemoryDraft, mediaPath: string | null): Promise<string> {
  const { data, error } = await supabase
    .from('memories')
    .insert({
      pet_id: draft.petId,
      title: draft.title,
      description: draft.description ?? null,
      media_type: draft.mediaType,
      media_path: mediaPath,
      media_duration_seconds:
        draft.mediaType === 'video' || draft.mediaType === 'audio'
          ? (draft.mediaDurationSeconds ?? null)
          : null,
    })
    .select('id')
    .single();

  if (error) throw new Error(readableError(error.message, draft.mediaType));

  return data.id;
}

/**
 * Deletes the row first, then the object. The order matters: removing the file before the row
 * could leave a memory pointing at nothing if the delete then failed. `storage.remove` reports
 * failures through `error` instead of throwing, so a leftover object never surfaces as a
 * failed delete — the feed is already free of the memory at that point.
 */
export async function deleteMemory(id: string): Promise<void> {
  const { data, error: readError } = await supabase
    .from('memories')
    .select('media_path')
    .eq('id', id)
    .maybeSingle();

  if (readError) throw new Error(readableError(readError.message));

  const { error: deleteError } = await supabase
    .from('memories')
    .delete()
    .eq('id', id);

  if (deleteError) throw new Error(readableError(deleteError.message));

  const mediaPath = data?.media_path ?? null;
  if (mediaPath) {
    await supabase.storage.from('pet-media').remove([mediaPath]);
  }
}
