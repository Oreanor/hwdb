import Image from 'next/image';
import { CarData, CarDataItem } from '../types';
import { getImageUrl as getFullImageUrl } from '../utils/utils';
import { FIELD_ORDER } from '../consts';

interface CarTableProps {
  car: CarData;
  onImageClick: (url: string) => void;
}

const CarTable: React.FC<CarTableProps> = ({ car, onImageClick }) => {
  const getImageUrl = (year: string, item: CarDataItem): string | undefined => {
    if (item.p && !item.p.includes('Image_Not_Available')) {
      return getFullImageUrl(item.p);
    }
    return undefined;
  };

  // Получаем только те поля, которые есть в данных
  const availableFields = FIELD_ORDER.filter(field => 
    car.d.some(item => item[field.key] !== undefined)
  );

  return (
    <div className="overflow-hidden">
      <div className="overflow-y-auto max-h-[calc(90vh-12rem)]">
        <table className="w-full table-fixed divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="px-1 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 w-[10%]">Photo</th>
              <th className="px-1 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 w-[5%]">Year</th>
              {availableFields.map(field => (
                <th key={field.key} className="px-1 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 w-[7.5%]">
                  {field.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {car.d.map((item, index) => {
              const imageUrl = getImageUrl(item.y, item);
              return (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-1 py-1 whitespace-nowrap">
                    {imageUrl && (
                      <div 
                        className="w-16 h-16 relative cursor-pointer"
                        onClick={() => onImageClick(imageUrl)}
                      >
                        <Image
                          src={imageUrl}
                          alt={`${car.lnk} - ${item.y}`}
                          fill
                          objectFit="contain"
                          sizes="64px"
                        />
                      </div>
                    )}
                  </td>
                  <td className="px-1 py-1 text-sm text-gray-900 break-words">{item.y}</td>
                  {availableFields.map(field => (
                    <td key={field.key} className="px-1 py-1 text-sm text-gray-900 break-words">
                      {(item[field.key] as string) || '-'}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CarTable; 