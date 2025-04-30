const fs = require('fs');
const https = require('https');
const http = require('http');

async function checkUrl(url) {
    return new Promise((resolve) => {
        // Очищаем URL от параметров и revision/latest
        const cleanUrl = url.split('/revision/')[0];
        const fullUrl = `https://static.wikia.nocookie.net/hotwheels/images/${cleanUrl}`;
        
        const protocol = fullUrl.startsWith('https') ? https : http;
        
        protocol.get(fullUrl, (response) => {
            if (response.statusCode === 200) {
                resolve({ url, status: 'OK' });
            } else {
                resolve({ url, status: 'ERROR', code: response.statusCode });
            }
        }).on('error', (err) => {
            resolve({ url, status: 'ERROR', message: err.message });
        });
    });
}

async function checkAllUrls() {
    try {
        const carsData = JSON.parse(fs.readFileSync('public/carsdata.json', 'utf8'));
        const allUrls = carsData.flatMap(car => 
            car.d.map(variant => variant.p)
        ).filter(url => url && !url.includes('Image_Not_Available'));
        
        console.log(`Проверка ${allUrls.length} URL-адресов...`);
        
        const results = {
            ok: [],
            error: []
        };
        
        // Проверяем URL-адреса по 10 штук одновременно
        const batchSize = 10;
        for (let i = 0; i < allUrls.length; i += batchSize) {
            const batch = allUrls.slice(i, i + batchSize);
            const batchResults = await Promise.all(batch.map(url => checkUrl(url)));
            
            batchResults.forEach(result => {
                if (result.status === 'OK') {
                    results.ok.push(result.url);
                } else {
                    results.error.push(result);
                }
            });
            
            // Выводим прогресс
            const progress = Math.round((i + batch.length) / allUrls.length * 100);
            console.log(`Прогресс: ${progress}% (${i + batch.length}/${allUrls.length})`);
        }
        
        // Сохраняем результаты в файл
        fs.writeFileSync('url_check_results.json', JSON.stringify({
            total: allUrls.length,
            ok: results.ok.length,
            error: results.error.length,
            errorDetails: results.error
        }, null, 2));
        
        console.log(`
Результаты проверки:
- Всего URL-адресов: ${allUrls.length}
- Доступных: ${results.ok.length}
- Недоступных: ${results.error.length}
- Подробные результаты сохранены в url_check_results.json
        `);
        
    } catch (error) {
        console.error('Ошибка:', error.message);
    }
}

checkAllUrls(); 