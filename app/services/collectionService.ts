import { supabase } from '../lib/supabase';
import { CarData } from '../types';

export const getCollection = async (userId: string): Promise<CarData[]> => {
  const { data, error } = await supabase
    .from('collections')
    .select('car_data')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching collection:', error);
    throw error;
  }

  return data.map(item => item.car_data);
};

export const addToCollection = async (userId: string, car: CarData): Promise<void> => {
  const { error } = await supabase
    .from('collections')
    .insert([
      {
        user_id: userId,
        car_data: car,
        car_link: car.lnk
      }
    ]);

  if (error) {
    console.error('Error adding to collection:', error);
    throw error;
  }
};

export const removeFromCollection = async (userId: string, carLink: string): Promise<void> => {
  const { error } = await supabase
    .from('collections')
    .delete()
    .eq('user_id', userId)
    .eq('car_link', carLink);

  if (error) {
    console.error('Error removing from collection:', error);
    throw error;
  }
}; 