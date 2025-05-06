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

export const fetchCarByLnk = async (lnk: string): Promise<CarData> => {
  const response = await fetch('/api/car', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ links: [lnk] }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch car data');
  }
  const cars = await response.json();
  return cars[0];
};