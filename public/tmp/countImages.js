const fs = require('fs');

try {
    const carsData = JSON.parse(fs.readFileSync('public/carsdata.json', 'utf8'));
    
    // Получаем все URL изображений
    const allImages = carsData.flatMap(car => car.d.map(variant => variant.p));
    
    // Общее количество записей с картинками
    const totalImages = allImages.length;
    
    // Количество записей без картинок (Image_Not_Available)
    const missingImages = allImages.filter(url => url && url.includes('Image_Not_Available')).length;
    
    // Количество уникальных картинок (исключая Image_Not_Available)
    const uniqueImages = new Set(
        allImages.filter(url => url && !url.includes('Image_Not_Available'))
    ).size;
    
    console.log(`Статистика изображений в базе данных:
- Всего записей с картинками: ${totalImages}
- Записей без картинок (Image_Not_Available): ${missingImages}
- Уникальных картинок: ${uniqueImages}`);

} catch (error) {
    console.error('Error reading carsdata.json:', error.message);
} 