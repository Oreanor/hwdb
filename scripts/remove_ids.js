const fs = require('fs');
const path = require('path');

// Read the JSON file
const jsonPath = path.join(__dirname, '../public/data');
console.log('Reading file from:', jsonPath);

const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
console.log('Total years:', data.length);
console.log('First year structure:', JSON.stringify(data[0], null, 2));

// Process each year's data
const cleanedData = data.map(yearData => {
    console.log(`Processing year ${yearData.year}`);
    return {
        ...yearData,
        data: yearData.data.map(car => {
            const { id, name, ...rest } = car;
            return rest;
        })
    };
});

console.log('First year after cleaning:', JSON.stringify(cleanedData[0], null, 2));

// Write back to file
fs.writeFileSync(jsonPath, JSON.stringify(cleanedData, null, 2));
console.log('File written successfully!');

// Verify the changes
const verifyData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const carsWithExtraFields = verifyData.flatMap(year => 
    year.data.filter(car => car.id !== undefined || car.name !== undefined)
);
console.log('Cars that still have id or name:', carsWithExtraFields.length);
if (carsWithExtraFields.length > 0) {
    console.log('Example of car with extra fields:', JSON.stringify(carsWithExtraFields[0], null, 2));
} 