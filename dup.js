const fs = require('fs');

// Read the carsdata.json file
const carsData = JSON.parse(fs.readFileSync('public/carsdata.json', 'utf8'));

// Function to find models with duplicate images
function findModelsWithDuplicateImages() {
    const modelsWithDuplicates = [];

    carsData.forEach(car => {
        // Get all non-empty image URLs for this model
        const imageUrls = car.d
            .filter(item => item.p) // Filter out items without images
            .map(item => item.p);

        // Check if there are duplicates
        const uniqueUrls = new Set(imageUrls);
        if (uniqueUrls.size < imageUrls.length) {
            // Found duplicates, add to our results
            modelsWithDuplicates.push({
                model: car.lnk,
                fandomUrl: `https://hotwheels.fandom.com/wiki/${car.lnk}`,
                duplicateCount: imageUrls.length - uniqueUrls.size
            });
        }
    });

    return modelsWithDuplicates;
}

// Find and display results
const results = findModelsWithDuplicateImages();

console.log('Models with duplicate images:');
console.log('============================');
results.forEach(result => {
    console.log(`Model: ${result.model}`);
    console.log(`Fandom URL: ${result.fandomUrl}`);
    console.log(`Number of duplicate images: ${result.duplicateCount}`);
    console.log('----------------------------');
});

console.log(`\nTotal models with duplicate images: ${results.length}`); 