import { getSupabase } from '../lib/supabase';
import { LOCAL_BACKEND, LOCAL_COLLECTION_KEY } from '../consts';

// A user's collection is a list of variant ids. Production keeps it in the
// Supabase `collections` table (one row per user: user_id, car_data[]); local
// mode keeps the same shape in localStorage, keyed by user id.

// --- local backend ----------------------------------------------------------

const readLocal = (): Record<string, string[]> => {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(LOCAL_COLLECTION_KEY) ?? '{}');
  } catch {
    return {};
  }
};

const writeLocal = (userId: string, ids: string[]) => {
  localStorage.setItem(LOCAL_COLLECTION_KEY, JSON.stringify({ ...readLocal(), [userId]: ids }));
};

// --- cloud backend ----------------------------------------------------------

const TABLE = 'collections';

const readRemote = async (userId: string): Promise<string[]> => {
  const { data, error } = await getSupabase().from(TABLE).select('car_data').eq('user_id', userId).limit(1);
  if (error) throw error;
  return data?.[0]?.car_data ?? [];
};

// Update the user's row, or insert it when there is none yet.
const writeRemote = async (userId: string, ids: string[]) => {
  const supabase = getSupabase();
  const { data, error } = await supabase.from(TABLE).update({ car_data: ids }).eq('user_id', userId).select('user_id');
  if (error) throw error;
  if (data && data.length > 0) return;
  const { error: insertError } = await supabase.from(TABLE).insert([{ user_id: userId, car_data: ids }]);
  if (insertError) throw insertError;
};

// --- public API -------------------------------------------------------------

export const getCollection = async (userId: string): Promise<string[]> =>
  LOCAL_BACKEND ? readLocal()[userId] ?? [] : readRemote(userId);

const save = async (userId: string, ids: string[]): Promise<string[]> => {
  if (LOCAL_BACKEND) writeLocal(userId, ids);
  else await writeRemote(userId, ids);
  return ids;
};

// Adds a variant to the user's collection and returns the updated id list.
export const addToCollection = async (userId: string, id: string): Promise<string[]> => {
  const current = await getCollection(userId);
  return current.includes(id) ? current : save(userId, [...current, id]);
};

// Removes a variant from the user's collection and returns the updated id list.
export const removeFromCollection = async (userId: string, id: string): Promise<string[]> => {
  const current = await getCollection(userId);
  return current.includes(id) ? save(userId, current.filter((x) => x !== id)) : current;
};
