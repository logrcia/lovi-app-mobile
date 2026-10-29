import { supabase } from '../db/client';

/**
 * `pet_follows` has a composite primary key `(follower_id, pet_id)`, so both directions must be
 * idempotent: tapping again is not an error, it is the same state written twice.
 */
export async function setPetFollowing(params: {
  petId: string;
  followerId: string;
  following: boolean;
}): Promise<void> {
  const { petId, followerId, following } = params;

  if (following) {
    const { error } = await supabase.from('pet_follows').upsert(
      { follower_id: followerId, pet_id: petId },
      { onConflict: 'follower_id,pet_id', ignoreDuplicates: true }
    );

    if (error) throw new Error(error.message);
    return;
  }

  const { error } = await supabase
    .from('pet_follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('pet_id', petId);

  if (error) throw new Error(error.message);
}
