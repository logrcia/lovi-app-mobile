import { File } from 'expo-file-system';

import type { Pet } from '../../types';
import { supabase } from '../db/client';
import { SPECIES_DB } from '../labels';

export interface PetAvatarSource {
  /** Local `file://` uri returned by the image picker. */
  uri: string;
  mimeType?: string | null;
}

export interface CreatePetInput {
  ownerId: string;
  name: string;
  species: Pet['species'];
  /** `YYYY-MM-DD`, derived from the age text by `parseAgeToBirthday`. */
  birthday: string | null;
  bio: string;
  avatar?: PetAvatarSource | null;
}

const EXTENSION_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/** The bucket speaks English and the app speaks Spanish; every failure surfaces in Spanish. */
function readableError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes('row-level security')) {
    return 'Tu sesión no tiene permiso para crear esta mascota.';
  }
  if (normalized.includes('exceeded the maximum allowed size') || normalized.includes('too large')) {
    return 'La foto es demasiado grande. Probá con otra.';
  }
  if (normalized.includes('mime type') || normalized.includes('not supported')) {
    return 'Ese formato de foto no está soportado. Probá con JPG o PNG.';
  }

  return message;
}

/**
 * Creates the pet and, when a photo was chosen, uploads it to `pet-media/{pet_id}/`.
 *
 * The order is forced by the storage policies: the bucket authorizes writes through
 * `is_pet_owner(path_pet_id(name))`, so the row must exist before the upload. If the
 * upload fails the row is rolled back, so retrying from the sheet cannot duplicate pets.
 */
export async function createPet(input: CreatePetInput): Promise<string> {
  const { data, error } = await supabase
    .from('pets')
    .insert({
      owner_id: input.ownerId,
      name: input.name,
      species: SPECIES_DB[input.species],
      birthday: input.birthday,
      bio: input.bio,
    })
    .select('id')
    .single();

  if (error) throw new Error(readableError(error.message));

  if (!input.avatar) return data.id;

  try {
    await attachPetAvatar(data.id, input.avatar);
  } catch (uploadError) {
    const { error: rollbackError } = await supabase.from('pets').delete().eq('id', data.id);

    if (rollbackError) {
      console.warn('[lovi] mascota creada sin foto, rollback falló:', rollbackError.message);
      throw new Error(
        'La mascota se guardó pero la foto no se pudo subir. Recargá para verla.'
      );
    }

    throw uploadError;
  }

  return data.id;
}

async function attachPetAvatar(petId: string, avatar: PetAvatarSource): Promise<void> {
  const contentType = avatar.mimeType ?? 'image/jpeg';
  const extension = EXTENSION_BY_TYPE[contentType] ?? 'jpg';
  const path = `${petId}/avatar.${extension}`;

  // Expo SDK 58 replaced the global fetch, and its FormData rejects `{ uri }` parts
  // ("Unsupported FormDataPart implementation"). Read the real bytes instead: `File`
  // hands us an ArrayBuffer, which storage-js uploads verbatim.
  let bytes: ArrayBuffer;
  try {
    bytes = await new File(avatar.uri).arrayBuffer();
  } catch {
    throw new Error('No pudimos leer la foto de tu celular. Probá con otra.');
  }

  const { error: uploadError } = await supabase.storage
    .from('pet-media')
    .upload(path, bytes, { contentType, upsert: true });

  if (uploadError) throw new Error(readableError(uploadError.message));

  const { error: updateError } = await supabase
    .from('pets')
    .update({ avatar_path: path })
    .eq('id', petId);

  if (updateError) throw new Error(readableError(updateError.message));
}
