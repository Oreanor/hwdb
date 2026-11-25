import { supabase } from '../lib/supabase';

// A user's collection is one row in `collections`: { user_id, car_data: variantId[] }.

// The stored row's id list, or null when the user has no row yet.
async function readRow(userId: string): Promise<string[] | null> {
  const { data, error } = await supabase.from('collections').select('car_data').eq('user_id', userId).limit(1);
  if (error) throw error;
  return data.length ? (data[0].car_data ?? []) : null;
}

async function writeRow(userId: string, ids: string[], exists: boolean): Promise<void> {
  const { error } = exists
    ? await supabase.from('collections').update({ car_data: ids }).eq('user_id', userId)
    : await supabase.from('collections').insert({ user_id: userId, car_data: ids });
  if (error) throw error;
}

// The user's collection as an array of variant ids.
export const getCollection = async (userId: string): Promise<string[]> => (await readRow(userId)) ?? [];

// Adds a variant and returns the updated id list.
export async function addToCollection(userId: string, id: string): Promise<string[]> {
  const current = await readRow(userId);
  if (current?.includes(id)) return current;
  const next = [...(current ?? []), id];
  await writeRow(userId, next, current !== null);
  return next;
}

// Removes a variant and returns the updated id list.
export async function removeFromCollection(userId: string, id: string): Promise<string[]> {
  const current = await readRow(userId);
  if (!current?.includes(id)) return current ?? [];
  const next = current.filter((x) => x !== id);
  await writeRow(userId, next, true);
  return next;
}
