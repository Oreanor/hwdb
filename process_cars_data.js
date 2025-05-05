const fs = require('fs');

function processCarsData() {
    // Read the JSON file
    const rawData = fs.readFileSync('public/carsdata.json', 'utf8');
    const data = JSON.parse(rawData);
    
    // Initialize object to store unique values for each field
    const fieldValues = {};
    
    // Process each object in the main array
    data.forEach(car => {
        // Process each item in the 'd' array of each car
        car.d.forEach(item => {
            Object.entries(item).forEach(([key, value]) => {
                if (value) { // Only add non-empty values
                    if (!fieldValues[key]) {
                        fieldValues[key] = new Set();
                    }
                    fieldValues[key].add(value);
                }
            });
        });
    });
    
    // Convert Sets to sorted arrays
    const result = {};
    Object.entries(fieldValues).forEach(([field, values]) => {
        result[field] = Array.from(values).sort();
    });
    
    // Save the results to a new file
    fs.writeFileSync(
        'cars_field_values.json',
        JSON.stringify(result, null, 2),
        'utf8'
    );
}

processCarsData(); 