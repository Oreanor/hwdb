import { supabase } from '../lib/supabase';

// Returns the user's collection as an array of variant ids.
export const getCollection = async (userId: string): Promise<string[]> => {
  const { data, error } = await supabase
    .from('collections')
    .select('car_data')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching collection:', error);
    throw error;
  }

  // Each user has at most one row; an empty result means an empty collection.
  if (!data || data.length === 0) {
    return [];
  }

  return data[0].car_data || [];
};

// Adds a variant to the user's collection and returns the updated id list.
export const addToCollection = async (userId: string, id: string): Promise<string[]> => {
  const current = await getCollection(userId);
  if (current.includes(id)) return current;
  const newCollection = [...current, id];

  // Upsert: update the existing row if the user already has one, otherwise insert.
  const { data: existing } = await supabase
    .from('collections')
    .select('user_id')
    .eq('user_id', userId);

  if (existing && existing.length > 0) {
    const { error } = await supabase
      .from('collections')
      .update({ car_data: newCollection })
      .eq('user_id', userId);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('collections')
      .insert([{ user_id: userId, car_data: newCollection }]);
    if (error) throw error;
  }

  return newCollection;
};

// Removes a variant from the user's collection and returns the updated id list.
export const removeFromCollection = async (userId: string, id: string): Promise<string[]> => {
  const current = await getCollection(userId);
  if (current.length === 0) return [];

  const newCollection = current.filter(x => x !== id);

  const obj = await supabase
    .from('collections')
    .update({ car_data: newCollection })
    .eq('user_id', userId);

  if (obj.error) throw obj.error;

  // On a successful update (status 204) return the new list; otherwise keep the old one.
  return obj.status === 204 ? newCollection : current;
};
