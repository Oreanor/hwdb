const fs = require('fs');
const path = require('path');

function analyzeData() {
    try {
        const data = JSON.parse(fs.readFileSync(path.join('public', 'carsdata_all.json'), 'utf8'));
        let count = 0;
        let totalCount = 0;
        let examples = [];

        data.forEach(car => {
            if (car.data) {
                car.data.forEach(item => {
                    totalCount++;
                    const keys = Object.keys(item);
                    if (keys.length <= 3) {
                        count++;
                        examples.push({
                            car: car.link,
                            data: item
                        });
                    }
                });
            }
        });

        console.log(`\nНайдено объектов с 4 или менее ключами: ${count} штук`);


        console.log(`\nВсего объектов в базе: ${totalCount} штук`);
    } catch (error) {
        console.error('Ошибка при анализе данных:', error);
    }
}

analyzeData(); 