import { CarData } from '../types';

export const fetchCars = async (year: string, searchQuery: string = ''): Promise<CarData[]> => {
  const query = searchQuery ? `&s=${encodeURIComponent(searchQuery)}` : '';
  const response = await fetch(`/api/cars?y=${year}${query}`);
  if (!response.ok) {
    throw new Error('Failed to fetch data');
  }
  return response.json();
}; 