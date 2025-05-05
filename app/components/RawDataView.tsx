import { CarData } from '../types';
import { useState, useEffect } from 'react';


export default function RawDataView() {

    const [loading, setLoading] = useState(false);
    const [cars, setCars] = useState<CarData[]>([]);
    const [selectedModel, setSelectedModel] = useState<CarData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [draggedValue, setDraggedValue] = useState<{value: string, field: string} | null>(null);



    const handleModelClick = (car: CarData) => {
        setSelectedModel(car);
    };

    const handleDragStart = (value: string, field: string) => {
        setDraggedValue({ value, field });
      };
    
      const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
      };
    
      const handleDrop = (rowIndex: number, field: string) => {
        if (draggedValue) {
          const newCars = [...cars];
          const modelIndex = cars.findIndex(car => car.lnk === selectedModel?.lnk);
          if (modelIndex !== -1) {
            const newModel = { ...newCars[modelIndex] };
            const newVariants = [...newModel.d];
            
            // Find the source row and clear its value
            const sourceRowIndex = newVariants.findIndex(variant => 
              variant[draggedValue.field as keyof typeof variant] === draggedValue.value
            );
            if (sourceRowIndex !== -1) {
              newVariants[sourceRowIndex] = { 
                ...newVariants[sourceRowIndex],
                [draggedValue.field]: ''
              };
            }
            
            // Set the new value in the target cell
            newVariants[rowIndex] = { 
              ...newVariants[rowIndex], 
              [field]: draggedValue.value 
            };
            
            newModel.d = newVariants;
            newCars[modelIndex] = newModel;
            setCars(newCars);
            setSelectedModel(newModel);
          }
        }
      };
    
      const handleCopyFromPrevious = (rowIndex: number) => {
        if (rowIndex > 0) {
          const newCars = [...cars];
          const modelIndex = cars.findIndex(car => car.lnk === selectedModel?.lnk);
          if (modelIndex !== -1) {
            const newModel = { ...newCars[modelIndex] };
            const newVariants = [...newModel.d];
            const previousVariant = newVariants[rowIndex - 1];
            const currentVariant = newVariants[rowIndex];
            
            // Copy missing values from previous row
            Object.entries(previousVariant).forEach(([key, value]) => {
              if (!currentVariant[key as keyof typeof currentVariant]) {
                currentVariant[key as keyof typeof currentVariant] = value;
              }
            });
            
            newModel.d = newVariants;
            newCars[modelIndex] = newModel;
            setCars(newCars);
            setSelectedModel(newModel);
          }
        }
      };

    useEffect(() => {
        const loadInitialData = async () => {
          try {
            setLoading(true);
            const response = await fetch('/carsdata.json');
            if (!response.ok) {
              throw new Error('Failed to load cars data');
            }
            const data = await response.json();
            console.log('Loaded cars data:', data);
            setCars(data);
          } catch (err) {
            console.error('Error loading cars:', err);
            setError(err instanceof Error ? err.message : 'An error occurred');
          } finally {
            setLoading(false);
          }
        };
    
        loadInitialData();
      }, []);

    const handleSave = async () => {
        try {
          const response = await fetch('/api/save', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(cars),
          });
          
          if (!response.ok) {
            throw new Error('Failed to save data');
          }
          
          alert('Data saved successfully!');
        } catch (error) {
          console.error('Error saving data:', error);
          alert('Error saving data: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
      };
      
  return (
    <div className="flex flex-row gap-4 h-full">
      {/* Left panel - Model list */}
      <div className="w-64 overflow-y-auto border-r border-gray-200 dark:border-gray-700">
        <div className="p-4">
          <div className="sticky top-0 bg-white dark:bg-gray-900 z-10 pb-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Models</h2>
              <button
                onClick={handleSave}
                className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
              >
                Save
              </button>
            </div>
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-gray-500 dark:text-gray-400">Loading models...</div>
            </div>
          ) : error ? (
            <div className="p-4 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded">
              {error}
            </div>
          ) : (
            <div className="space-y-2">
              {cars.map((car) => (
                <div
                  key={car.lnk}
                  className={`p-3 rounded-lg cursor-pointer ${
                    selectedModel?.lnk === car.lnk
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100'
                  }`}
                  onClick={() => handleModelClick(car)}
                >
                  <div className="font-medium truncate">{car.lnk || 'Unknown Model'}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right panel - Data table */}
      <div className="flex-1 overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500 dark:text-gray-400">Loading model details...</div>
          </div>
        ) : error ? (
          <div className="p-4 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded">
            {error}
          </div>
        ) : selectedModel ? (
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              <a 
                href={`https://hotwheels.fandom.com/wiki/${selectedModel.lnk}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                {selectedModel.lnk || 'Unknown Model'} Details
              </a>
            </h2>
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border-collapse">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="w-16 px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700">Year</th>
                  <th className="w-16 px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700">Number</th>
                  <th className="w-32 px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700">Series</th>
                  <th className="w-24 px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700">Color</th>
                  <th className="w-24 px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700">Tampo</th>
                  <th className="w-24 px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700">Base</th>
                  <th className="w-24 px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700">Window</th>
                  <th className="w-24 px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700">Interior</th>
                  <th className="w-24 px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700">Wheels</th>
                  <th className="w-24 px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700">Tn</th>
                  <th className="w-24 px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700">Country</th>
                  <th className="w-32 px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700">Notes</th>
                  <th className="w-16 px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700">Image</th>
                  <th className="w-16 px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {selectedModel.d.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td 
                      className="px-2 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700"
                      draggable
                      onDragStart={() => handleDragStart(item.y || '', 'y')}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(index, 'y')}
                    >{item.y || '-'}</td>
                    <td 
                      className="px-2 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700"
                      draggable
                      onDragStart={() => handleDragStart(item.N || '', 'N')}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(index, 'N')}
                    >{item.N || '-'}</td>
                    <td 
                      className="px-2 py-4 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700"
                      draggable
                      onDragStart={() => handleDragStart(item.Sr || '', 'Sr')}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(index, 'Sr')}
                    >
                      <div className="truncate max-w-[8rem]" title={item.Sr || ''}>{item.Sr || '-'}</div>
                    </td>
                    <td 
                      className="px-2 py-4 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700"
                      draggable
                      onDragStart={() => handleDragStart(item.c || '', 'c')}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(index, 'c')}
                    >
                      <div className="truncate max-w-[6rem]" title={item.c || ''}>{item.c || '-'}</div>
                    </td>
                    <td 
                      className="px-2 py-4 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700"
                      draggable
                      onDragStart={() => handleDragStart(item.Tm || '', 'Tm')}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(index, 'Tm')}
                    >
                      <div className="truncate max-w-[6rem]" title={item.Tm || ''}>{item.Tm || '-'}</div>
                    </td>
                    <td 
                      className="px-2 py-4 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700"
                      draggable
                      onDragStart={() => handleDragStart(item.Bs || '', 'Bs')}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(index, 'Bs')}
                    >
                      <div className="truncate max-w-[6rem]" title={item.Bs || ''}>{item.Bs || '-'}</div>
                    </td>
                    <td 
                      className="px-2 py-4 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700"
                      draggable
                      onDragStart={() => handleDragStart(item.Wn || '', 'Wn')}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(index, 'Wn')}
                    >
                      <div className="truncate max-w-[6rem]" title={item.Wn || ''}>{item.Wn || '-'}</div>
                    </td>
                    <td 
                      className="px-2 py-4 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700"
                      draggable
                      onDragStart={() => handleDragStart(item.In || '', 'In')}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(index, 'In')}
                    >
                      <div className="truncate max-w-[6rem]" title={item.In || ''}>{item.In || '-'}</div>
                    </td>
                    <td 
                      className="px-2 py-4 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700"
                      draggable
                      onDragStart={() => handleDragStart(item.Wh || '', 'Wh')}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(index, 'Wh')}
                    >
                      <div className="truncate max-w-[6rem]" title={item.Wh || ''}>{item.Wh || '-'}</div>
                    </td>
                    <td 
                      className="px-2 py-4 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700"
                      draggable
                      onDragStart={() => handleDragStart(item.Tn || '', 'Tn')}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(index, 'Tn')}
                    >
                      <div className="truncate max-w-[6rem]" title={item.Tn || ''}>{item.Tn || '-'}</div>
                    </td>
                    <td 
                      className="px-2 py-4 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700"
                      draggable
                      onDragStart={() => handleDragStart(item.Cn || '', 'Cn')}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(index, 'Cn')}
                    >
                      <div className="truncate max-w-[6rem]" title={item.Cn || ''}>{item.Cn || '-'}</div>
                    </td>
                    <td 
                      className="px-2 py-4 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700"
                      draggable
                      onDragStart={() => handleDragStart(item.Nt || '', 'Nt')}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(index, 'Nt')}
                    >
                      <div className="truncate max-w-[8rem]" title={item.Nt || ''}>{item.Nt || '-'}</div>
                    </td>
                    <td 
                      className="px-2 py-4 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700"
                    >
                      {item.p ? (
                        <a 
                          href={`https://hotwheels.fandom.com/wiki/${item.p}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Image
                        </a>
                      ) : '-'}
                    </td>
                    <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {index > 0 && (
                        <button
                          onClick={() => handleCopyFromPrevious(index)}
                          className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          Copy ↑
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            Select a model to view its details
          </div>
        )}
      </div>
    </div>
  );
} 