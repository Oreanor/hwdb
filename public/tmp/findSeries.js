const fs = require('fs');
const path = require('path');

function findSeries() {
    try {
        const filePath = path.join('', 'carsdata_all.json');
        console.log('Проверяю файл:', filePath);
        
        if (!fs.existsSync(filePath)) {
            console.error('Файл не найден!');
            return;
        }

        const fileContent = fs.readFileSync(filePath, 'utf8');
        console.log('Размер файла:', fileContent.length, 'байт');
        
        if (fileContent.length === 0) {
            console.error('Файл пуст!');
            return;
        }

        const data = JSON.parse(fileContent);
        console.log('Количество машин в базе:', data.length);
        
        const seriesSet = new Set();
        let totalItems = 0;

        data.forEach(car => {
            console.log('Проверяю машину:', car.d);
            if (car.d) {
                car.d.forEach(item => {
                    totalItems++;

                    if (item.Wh) {
                        seriesSet.add(item.Wh);
                    }
                });
            }
        });

        const seriesArray = Array.from(seriesSet).sort();
        
        console.log(`\nВсего проверено объектов: ${totalItems} штук`);
        console.log(`Найдено уникальных значений Wheel type: ${seriesArray.length} штук\n`);
        seriesArray.forEach(series => {
            console.log(series);
        });
    } catch (error) {
        console.error('Ошибка при анализе данных:', error);
    }
}

findSeries(); 