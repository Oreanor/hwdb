const fs = require('fs');

const filePath = './carsdata.json';
const filePath2 = './carsdata2.json';

let data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

let counter = 0; // Начинаем с 100000, чтобы всегда было 6 знаков

for (const car of data) {
  if (Array.isArray(car.d)) {
    for (const item of car.d) {
      item.hwid = (counter++).toString().padStart(6, '0');
    }
  }
}

fs.writeFileSync(filePath2, JSON.stringify(data, null, 2), 'utf-8');
console.log('hwid успешно добавлены!');