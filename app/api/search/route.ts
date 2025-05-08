import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { CarData } from '../../types';
import { MAIN_OBJECT_FIELDS, VARIANT_FIELDS } from '../../consts';
import { formatCarName } from '../../utils';


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

    // Если указан год, фильтруем только те машины, у которых есть хотя бы один вариант с этим годом
    if (year) {
      filteredData = filteredData.filter(car => 
        car.d.some(item => item.y === year)
      );
    }

    // Затем применяем поиск по полю, если оно указано
    if (field && value && value.trim() !== '') {
      const searchValue = value.toLowerCase();
      const searchWords = searchValue.split(/\s+/).filter(word => word.length > 0);
      console.log('Searching by field:', field, 'words:', searchWords);
      
      filteredData = filteredData.map(car => {
        // Для поля lnk делаем точное сравнение
        if (field === 'link') {
          return car.lnk === value ? { ...car, d: car.d.map(item => ({ y: item.y, p: item.p })) } : { ...car, d: [] };
        }

        // Для поля name ищем в lnk и форматированном lnk
        if (field === 'name') {
          const formattedName = formatCarName(car.lnk).toLowerCase();
          return searchWords.every(word => formattedName.includes(word))
            ? { ...car, d: car.d.map(item => ({ y: item.y, p: item.p })) }
            : { ...car, d: [] };
        }

        // Для поля year ищем в вариантах
        if (field === 'year') {
          // Если у модели есть хотя бы один вариант с указанным годом,
          // возвращаем модель с сокращенными вариантами
          return car.d.some(item => item.y === value) 
            ? { ...car, d: car.d.map(item => ({ y: item.y, p: item.p })) } 
            : { ...car, d: [] };
        }

        // Проверяем, является ли поле одним из полей основного объекта
        const mainObjectField = MAIN_OBJECT_FIELDS[field];
        
        if (mainObjectField) {
          // Для остальных полей форматируем значение перед сравнением
          const fieldValue = (car[mainObjectField] as string)?.toLowerCase();
          if (fieldValue && searchWords.every(word => fieldValue.includes(word))) {
            return { ...car, d: car.d.map(item => ({ y: item.y, p: item.p })) };
          }
          return { ...car, d: [] };
        }
        
        // Проверяем, является ли поле одним из полей вариантов
        const variantField = VARIANT_FIELDS[field];
        if (!variantField) {
          console.warn('Unknown field:', field);
          return { ...car, d: [] };
        }
        
        // Проверяем наличие совпадений в вариантах
        const hasMatchingVariant = car.d.some(item => {
          const fieldValue = item[variantField];
          if (typeof fieldValue === 'string') {
            const lowerFieldValue = fieldValue.toLowerCase();
            return searchWords.every(word => lowerFieldValue.includes(word));
          }
          return false;
        });
        
        return hasMatchingVariant ? { ...car, d: car.d.map(item => ({ y: item.y, p: item.p })) } : { ...car, d: [] };
      }).filter(car => car.d.length > 0);
      
      console.log('Cars after search:', filteredData.length);
    } else {
      // Если нет поиска или value пустое, возвращаем пустой массив
      filteredData = [];
    }

    // Финальный фильтр: если ни у одной машины нет вариантов, возвращаем пустой массив
    filteredData = filteredData.filter(car => car.d && car.d.length > 0);

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