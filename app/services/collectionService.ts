import { supabase } from '../lib/supabase';

// Получить коллекцию пользователя (массив id)
export const getCollection = async (userId: string): Promise<string[]> => {
  const { data, error } = await supabase
    .from('collections')
    .select('car_data')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching collection:', error);
    throw error;
  }

  return data && data.length > 0 && Array.isArray(data[0].car_data) ? data[0].car_data : [];
};

// Добавить вариант в коллекцию и вернуть обновлённый массив id
export const addToCollection = async (userId: string, id: string): Promise<string[]> => {
  const current = await getCollection(userId);
  if (current.includes(id)) return current;
  const newCollection = [...current, id];

  if (current.length === 0) {
    const { error } = await supabase
      .from('collections')
      .insert([{ user_id: userId, car_data: newCollection }]);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('collections')
      .update({ car_data: newCollection })
      .eq('user_id', userId);
    if (error) throw error;
  }
  return newCollection;
};

// Удалить вариант из коллекции и вернуть обновлённый массив id
export const removeFromCollection = async (userId: string, id: string): Promise<string[]> => {
  const current = await getCollection(userId);
  const newCollection = current.filter(x => x !== id);
  const { error } = await supabase
    .from('collections')
    .update({ car_data: newCollection })
    .eq('user_id', userId);
  if (error) throw error;
  return newCollection;
}; 