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

  // Если записей нет или массив пустой - возвращаем пустой массив
  if (!data || data.length === 0) {
    return [];
  }

  // Берем первую запись (должна быть только одна)
  return data[0].car_data || [];
};

// Добавить вариант в коллекцию и вернуть обновлённый массив id
export const addToCollection = async (userId: string, id: string): Promise<string[]> => {
  const current = await getCollection(userId);
  if (current.includes(id)) return current;
  const newCollection = [...current, id];

  // Проверяем, есть ли уже запись для пользователя
  const { data: existing } = await supabase
    .from('collections')
    .select('user_id')
    .eq('user_id', userId);

  if (existing && existing.length > 0) {
    // Если запись есть - обновляем
    const { error } = await supabase
      .from('collections')
      .update({ car_data: newCollection })
      .eq('user_id', userId);
    if (error) throw error;
  } else {
    // Если записи нет - создаем новую
    const { error } = await supabase
      .from('collections')
      .insert([{ user_id: userId, car_data: newCollection }]);
    if (error) throw error;
  }

  return newCollection;
};

// Удалить вариант из коллекции и вернуть обновлённый массив id
export const removeFromCollection = async (userId: string, id: string): Promise<string[]> => {
  const current = await getCollection(userId);
  if (current.length === 0) return []; // Коллекции нет — возвращаем пустой массив

  const newCollection = current.filter(x => x !== id);

  const obj = await supabase
    .from('collections')
    .update({ car_data: newCollection })
    .eq('user_id', userId);

  if (obj.error) throw obj.error;
  
  // Если удаление прошло успешно (статус 204), возвращаем новый массив
  // иначе возвращаем старый, как будто ничего не изменилось
  return obj.status === 204 ? newCollection : current;
}; 