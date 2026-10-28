import { File } from 'expo-file-system';

import type { MediaType } from '../../types';
import { supabase } from '../db/client';

export interface NewMemoryDraft {
  petId: string;
  title: string;
  description?: string;
  mediaType: MediaType;
  /** Local `file://` uri; required for everything except a text-only memory. */
  mediaLocalUri?: string;
  mediaMimeType?: string | null;
}

const EXTENSION_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/** Supabase speaks English; the composer speaks Spanish. */
function readableError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes('row-level security')) {
    return 'Ese recuerdo no se puede guardar en esa mascota.';
  }
  if (normalized.includes('exceeded the maximum allowed size') || normalized.includes('too large')) {
    return 'La foto es demasiado grande. Probá con otra.';
  }
  if (normalized.includes('mime type') || normalized.includes('not supported')) {
    return 'Ese formato de foto no está soportado. Probá con JPG o PNG.';
  }
  if (normalized.includes('media_presence')) {
    return 'Ese formato necesita un archivo y todavía no lo tenemos.';
  }

  return message;
}

function buildMediaPath(petId: string, contentType: string): string {
  const extension = EXTENSION_BY_TYPE[contentType] ?? 'jpg';
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
    throw new Error('Ese recuerdo necesita una foto.');
  }

  const contentType = draft.mediaMimeType ?? 'image/jpeg';
  const path = buildMediaPath(draft.petId, contentType);

  // Expo's fetch rejects `{ uri }` FormData parts, so the bytes are read directly.
  let bytes: ArrayBuffer;
  try {
    bytes = await new File(draft.mediaLocalUri).arrayBuffer();
  } catch {
    throw new Error('No pudimos leer la foto de tu celular. Probá con otra.');
  }

  const { error: uploadError } = await supabase.storage
    .from('pet-media')
    .upload(path, bytes, { contentType, upsert: false });

  if (uploadError) throw new Error(readableError(uploadError.message));

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
    })
    .select('id')
    .single();

  if (error) throw new Error(readableError(error.message));

  return data.id;
}
