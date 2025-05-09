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
  
  const response = await fetch(`/api/search?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch data');
  }
  return response.json();
};

export const fetchCarsByLinks = async (links: string[]): Promise<CarData[]> => {
  const response = await fetch('/api/car', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ links }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch car data');
  }
  return response.json();
};

export const fetchCarByLnk = async (lnk: string): Promise<CarData> => {
  const cars = await fetchCarsByLinks([lnk]);
  return cars[0];
};

// Получить варианты по массиву id (hwid)
export const fetchVariantsByIds = async (ids: string[]): Promise<CarData[]> => {
  const response = await fetch('/api/variants', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ids }),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch variants by ids');
  }
  return response.json();
};