const fs = require('fs');

// Read the carsdata.json file
const carsData = JSON.parse(fs.readFileSync('public/carsdata.json', 'utf8'));

// Replace non-empty 'p' field values with 't'
carsData.forEach(car => {
    car.d.forEach(item => {
        if (item.p && item.p.trim() !== '') {
            item.p = 't';
        }
    });
});

// Write the modified data back to the file
fs.writeFileSync('public/carsdata.json', JSON.stringify(carsData, null, 2));

console.log('Successfully replaced all non-empty image fields (p) with "t" in carsdata.json'); 