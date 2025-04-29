const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');


const BASE_URL = 'https://hotwheels.fandom.com/wiki/';

// COLUMN_MAPPING как раньше
const COLUMN_MAPPING = {
    'Col #': [
        'Col #', 'Col. #', 'Coll #', 'Collector #', '#', 
        'Casting#', 'cast #', 'Cast #', 'cast#', 'Cast#'
    ],
    'Year': [
        'Year', "'Year", 'Card year', 'Card Year', 'Year of card', 
        'Year of the card', 'Year & Card'
    ],
    'Series': [
        'Series', 'Series / Card', 'Series #', 'Card Type(s)',
        'Card Back', 'Card'
    ],
    'Color': [
        'Color', 'Color (Car)', 'Color (Camper)', 'Body Color', 
        'Exterior Color', 'Misc Body Color', 'Lower Body Color',
        'Exterior / / / Interior Color'
    ],
    'Tampo': [
        'Tampo', 'Tampo Colours', 'TAMPO type', 'Tampos', 'Deco Tampo',
        'Graphics', 'Color / Tampo', 'Notes / Tampo', 'Doll Tampo'
    ],
    'Base': [
        'Base Color / Type', 'Base Color / / / Type', 'Base Color/Type',
        'Base / Color / Type', 'Base Color', 'Base Type', 'Chassis Color / Type',
        'Base / / / Color', 'Base / / / Type', 'Base / Color / / / Type',
        'Base Color / / /', 'Base Color / / / / / / / Type',
        'Base Color / / / / Type', 'Base Color / / / bype',
        'Base Color / / / Metal', 'Base Color / / / Plastic',
        'Base color / / / Type', 'Base Color / / / Types',
        'Base Color / / / ype', 'Base Color / / Type',
        'Base Color / / Type /', 'Base Color / /&lt;brType',
        'Base Color / /br&gt;Type', 'Base Color / Types',
        'Base Color/ / / / Type', 'Base Color&#160;? Type',
        'Base Color&lt;br&lt;/ / Type', 'Base Type / / / Color',
        'Chassis Color / / / Type', 'Chassis Type / / / Color',
        'Color / / / Chassis Type', 'Color / / / Type',
        'Core Color / / / Type'
    ],
    'Window': [
        'Window Color', 'Window', 'Windshield Color'
    ],
    'Interior': [
        'Interior Color', 'Interior', 'Interior Colour',
        'Interior / / / Driver Color', 'Interior / / / Engine Color',
        'Interior / / / Headlights Color', 'Interior &amp; Engine Color',
        'Interior Bike Color', 'Interior Color / / / Rollcage Color',
        'Interior Color / Tub', 'Interior Flaps Color',
        'Interior/ Jets Color', 'Interior/Vents Color'
    ],
    'Wheel': [
        'Wheel Type', 'Wheel type'
    ],
    'Toy #': [
        'Toy #', 'Toy Number', 'Toy#', 'cast #', 'Cast #', 'cast#', 'Cast#',
        'Casting Name', 'Casting#'
    ],
    'Country': [
        'Country', 'Country #', 'Origin', 'Birthplace', "'Birthplace",
        "'Birthplace:", 'Birthplace:', 'Birthplace:&#160;', 'Brithplace',
        'Born', 'Born:'
    ],
    'Notes': [
        'Notes', 'Note', 'Fun Facts', 'FUN FACTS', 'FUN FACTS #1 of 180!',
        'Fun Facts:', 'Fun Facts: #55 of 180!', 'FUN FACTS!', 'Fun Facts!',
        'Notes / / / Type', 'Notes / / / Variation', 'Notes / / / Variations',
        'Notes / Variation', 'Notes / Variations', 'Notes/Variations',
        'Notes&#160;', 'From the back of the 2007 card:',
        'From the back of the 2008 card', 'From the back of the 2008 card:'
    ],
    'Photo': [
        'Photo', 'Photos', 'Photoz', 'Picture', 'Pictures', 'Image',
        'Left Side Photo'
    ]
};

function normalizeColumnName(name) {
    name = name
        .replace(/<br\s*\/?>(\s*)?/gi, ' / ')
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    for (const [standard, variations] of Object.entries(COLUMN_MAPPING)) {
        if (variations.some(v => v.toLowerCase() === name.toLowerCase())) {
            return standard;
        }
    }
    return name;
}

function cleanHtmlContent(content) {
    let cleaned = content.replace(/<(?!a\s)[^>]*>/g, '');
    cleaned = cleaned.replace(/<a[^>]*>(.*?)<\/a>/g, (m, t) => t);
    cleaned = cleaned
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    return cleaned;
}

async function extractTableData(url) {
    try {
        console.log(`\nFetching URL: ${url}`);
        const response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const html = await response.text();
        const $ = cheerio.load(html);
        const tables = [];
        $('table.wikitable').each((i, table) => {
            const headers = [];
            // Ищем первую строку с th
            let $headerRow = $(table).find('tr').has('th').first();
            $headerRow.find('th').each((j, th) => {
                headers.push($(th).text().replace(/\s+/g, ' ').trim());
            });
            // Если первый заголовок пустой — убираем
            let dataOffset = 0;
            if (headers[0] && headers[0].trim() === '') {
                headers.shift();
                dataOffset = 1;
            }
            const rows = [];
            // Все строки после заголовка
            $(table).find('tr').slice($headerRow.index() + 1).each((j, tr) => {
                const row = [];
                $(tr).find('td').each((k, td) => {
                    let cellText = $(td).text().replace(/\s+/g, ' ').trim();
                    const header = headers[k + dataOffset] || headers[k];
                    if (header && header.toLowerCase().includes('photo')) {
                        const img = $(td).find('img').first();
                        if (img.length) {
                            const src = img.attr('data-src') || img.attr('src') || '';
                            // Удаляем базовый URL из пути
                            cellText = src.replace('https://static.wikia.nocookie.net/hotwheels/images/', '');
                        } else {
                            cellText = '';
                        }
                    }
                    row.push(cellText);
                });
                if (row.length > 0) rows.push(row);
            });
            if (headers.length && rows.length) {
                tables.push({ headers, dataOffset, rows });
            }
        });
        return tables;
    } catch (error) {
        console.error(`Error processing URL ${url}:`, error.message);
        return [];
    }
}

function mapRowToStandard(row, headers) {
    const obj = {};
    headers.forEach((header, i) => {
        obj[header] = row[i] || '';
    });
    // Оставляем только те поля, которые есть в COLUMN_MAPPING
    const result = {};
    for (const key of Object.keys(COLUMN_MAPPING)) {
        if (obj[key]) result[key] = obj[key];
    }
    return result;
}

async function processCar(car) {
    if (!car.link) return car;
    const fullUrl = `${BASE_URL}${car.link}`;
    const tables = await extractTableData(fullUrl);
    let allData = [];
    for (const table of tables) {
        const headers = table.headers.map(normalizeColumnName);
        const dataOffset = table.dataOffset || 0;
        console.log(headers);
        for (const row of table.rows) {
            // Сдвиг индекса если был пустой первый заголовок
            const mapped = mapRowToStandard(row.slice(dataOffset), headers);
            // Добавляем только если есть хоть одно поле из COLUMN_MAPPING
            if (Object.keys(mapped).length > 0) {
                allData.push(mapped);
            }
        }
    }
    car.data = allData;
    return car;
}

async function processAllCars() {
    const carsData = JSON.parse(fs.readFileSync(path.join('', 'cars.json'), 'utf8'));
    const processedCars = [];
    for (const car of carsData) {
        const processedCar = await processCar(car);
        processedCars.push(processedCar);
    }
    const outputPath = path.join('', 'carsdata_all.json');
    fs.writeFileSync(outputPath, JSON.stringify(processedCars, null, 2));
    console.log(`\nГотово! Сохранено в ${outputPath}`);
}

processAllCars().catch(console.error);
