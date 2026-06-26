const fs = require('fs');

const inputPath = 'public/carsdata.json';
const outputPath = 'public/carsdata2.json';

const data = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));

let counter = 0; // Zero-padded to 6 digits.

for (const car of data) {
  if (Array.isArray(car.d)) {
    for (const item of car.d) {
      item.hwid = (counter++).toString().padStart(6, '0');
    }
  }
}

fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');
console.log('hwid values added successfully!');
