import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { CarData } from '../../types';
import { formatCarName } from '../../utils/utils';
import { MAIN_OBJECT_FIELDS, VARIANT_FIELDS } from '../../consts';


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const field = searchParams.get('field');
    const value = searchParams.get('value');
    const year = searchParams.get('year');

    console.log('Request params:', { field, value, year });

    // Читаем данные из файла
    const filePath = path.join(process.cwd(), 'public', 'carsdata.json');
    console.log('Reading file from:', filePath);
    
    if (!fs.existsSync(filePath)) {
      console.error('File does not exist:', filePath);
      return NextResponse.json(
        { error: 'Data file not found' },
        { status: 404 }
      );
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');
    console.log('File size:', fileContent.length);
    
    const carsData: CarData[] = JSON.parse(fileContent);
    console.log('Total cars:', carsData.length);

    let filteredData = carsData;

    // Сначала фильтруем по году, если он указан
    if (year) {
      filteredData = filteredData.map(car => ({
        ...car,
        d: car.d.filter(item => item.y === year)
      })).filter(car => car.d.length > 0);
    }

    // Затем применяем поиск по полю, если оно указано
    if (field && value) {
      const searchValue = value.toLowerCase();
      console.log('Searching by field:', field, 'value:', searchValue);
      
      filteredData = filteredData.map(car => {
        // Проверяем, является ли поле одним из полей основного объекта
        const mainObjectField = MAIN_OBJECT_FIELDS[field];
        
        if (mainObjectField) {
          // Для поля name форматируем значение перед сравнением
          const fieldValue = mainObjectField === 'lnk' 
            ? formatCarName(car[mainObjectField]).toLowerCase()
            : (car[mainObjectField] as string)?.toLowerCase();

          if (fieldValue?.includes(searchValue)) {
            return car;
          }
          return { ...car, d: [] };
        }
        
        // Проверяем, является ли поле одним из полей вариантов
        const variantField = VARIANT_FIELDS[field];
        if (!variantField) {
          console.warn('Unknown field:', field);
          return { ...car, d: [] };
        }
        
        // Ищем в массиве вариантов
        const filteredVariants = car.d.filter(item => {
          const fieldValue = item[variantField];
          if (typeof fieldValue === 'string') {
            return fieldValue.toLowerCase().includes(searchValue);
          }
          return false;
        });
        
        return { ...car, d: filteredVariants };
      }).filter(car => car.d.length > 0);
      
      console.log('Cars after search:', filteredData.length);
    }

    return NextResponse.json(filteredData);
  } catch (error) {
    console.error('Error processing request:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
    }
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 