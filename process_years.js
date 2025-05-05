const fs = require('fs');

function processYears() {
    // Read the JSON file
    const rawData = fs.readFileSync('public/carsdata.json', 'utf8');
    const data = JSON.parse(rawData);
    
    // Process each car in the main array
    data.forEach(car => {
        // Process each item in the 'd' array of each car
        car.d.forEach(item => {
            if (item.y && /^\d+$/.test(item.y) && item.y.length % 4 === 0) {
                // Split the year string into chunks of 4 digits
                const chunks = item.y.match(/.{1,4}/g);
                item.y = chunks.join(' ');
            }
        });
    });
    
    // Save the modified data back to the file
    fs.writeFileSync(
        'public/carsdata.json',
        JSON.stringify(data, null, 2),
        'utf8'
    );
}

processYears(); 