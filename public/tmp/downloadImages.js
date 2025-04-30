const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

async function downloadImage(url, outputDir) {
    return new Promise((resolve, reject) => {
        // Очищаем URL от параметров и revision/latest
        const cleanUrl = url.split('/revision/')[0];
        const fullUrl = `https://static.wikia.nocookie.net/hotwheels/images/${cleanUrl}`;
        
        const parsedUrl = new URL(fullUrl);
        const filename = path.basename(parsedUrl.pathname);
        const outputPath = path.join(outputDir, filename || `image_${Date.now()}.jpg`);
        
        const protocol = parsedUrl.protocol === 'https:' ? https : http;
        
        protocol.get(fullUrl, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download image: ${response.statusCode}`));
                return;
            }

            const fileStream = fs.createWriteStream(outputPath);
            response.pipe(fileStream);

            fileStream.on('finish', () => {
                fileStream.close();
                console.log(`Successfully downloaded: ${path.basename(outputPath)}`);
                resolve();
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

async function downloadImages(imageUrls, outputDir = 'public/images') {
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    for (const url of imageUrls) {
        try {
            await downloadImage(url, outputDir);
        } catch (error) {
            console.error(`Error downloading ${url}:`, error.message);
        }
    }
}

// Read carsdata.json and extract image URLs
try {
    const carsData = JSON.parse(fs.readFileSync('public/carsdata.json', 'utf8'));
    // Извлекаем все URL-адреса изображений из массива d каждого автомобиля
    const imageUrls = carsData.flatMap(car => 
        car.d.map(variant => variant.p)
    ).filter(url => url && !url.includes('Image_Not_Available'));
    
    console.log(`Found ${imageUrls.length} image URLs to download`);
    downloadImages(imageUrls).catch(console.error);
} catch (error) {
    console.error('Error reading carsdata.json:', error.message);
} 