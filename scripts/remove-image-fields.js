const fs = require('fs');

// Read the carsdata.json file
const carsData = JSON.parse(fs.readFileSync('public/carsdata.json', 'utf8'));

// Remove 'p' field from each item in 'd' arrays
carsData.forEach(car => {
    car.d.forEach(item => {
        delete item.p;
    });
});

// Write the modified data back to the file
fs.writeFileSync('public/carsdata.json', JSON.stringify(carsData, null, 2));

console.log('Successfully removed all image fields (p) from carsdata.json'); 