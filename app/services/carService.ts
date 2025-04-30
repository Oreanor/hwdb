import { CarData } from '../types';

export const fetchCars = async (field?: string, value?: string, year?: string): Promise<CarData[]> => {
  const params = new URLSearchParams();
  if (field && value) {
    params.append('field', field);
    params.append('value', value);
  }
  if (year) {
    params.append('year', year);
  }
  
  const response = await fetch(`/api/cars?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch data');
  }
  return response.json();
};

export const fetchCarByLnk = async (lnk: string): Promise<CarData> => {
  const params = new URLSearchParams();
  params.append('lnk', lnk);
  
  const response = await fetch(`/api/car?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch car data');
  }
  return response.json();
}; 