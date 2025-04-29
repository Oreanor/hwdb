const https = require('https');
const fs = require('fs');

// URL страницы с моделями 1973 года
const listUrl = 'https://hotwheels.fandom.com/wiki/List_of_1973_Hot_Wheels';

// Функция для получения страницы с моделями
async function fetchData() {
  const data = await fetchPage(listUrl);
  const regex = /<div class="wikia-gallery-item".*?href="(\/wiki\/[a-zA-Z0-9_]+)".*?>(.*?)<\/a>/g;
  const cars = [];
  let match;

  // Ищем все совпадения для моделей
  while ((match = regex.exec(data)) !== null) {
    const name = match[1].replace('/wiki/', '').trim(); // Используем относительную ссылку как имя
    const articleUrl = 'https://hotwheels.fandom.com' + match[1];

    // Загружаем страницу модели и извлекаем её информацию
    await getModelDetails(articleUrl, name, cars);
  }

  // Сохраняем результат в JSON файл, когда все данные будут собраны
  fs.writeFileSync('cars_with_details_1973.json', JSON.stringify(cars, null, 2), 'utf-8');
  console.log('Данные успешно сохранены в cars_with_details_1973.json');
}

// Функция для загрузки страницы
function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      let data = '';
      response.on('data', (chunk) => {
        data += chunk;
      });
      response.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

// Функция для получения деталей модели
async function getModelDetails(url, name, cars) {
  const pageData = await fetchPage(url);

  // Мягкие регулярные выражения для извлечения данных
  const descriptionMatch = pageData.match(/<h2.*?>Description<\/h2>.*?<div class="pi-data-value pi-font">(.*?)<\/div>/s);
  const description = descriptionMatch ? descriptionMatch[1].trim() : 'Описание не найдено';

  const designerMatch = pageData.match(/<div class="pi-item pi-data.*?designer.*?">.*?<div class="pi-data-value pi-font">.*?<a.*?>(.*?)<\/a>/s);
  const designer = designerMatch ? designerMatch[1].trim() : 'Неизвестен';

  const numberMatch = pageData.match(/<div class="pi-item pi-data.*?number.*?">.*?<div class="pi-data-value pi-font">(.*?)<\/div>/s);
  const number = numberMatch ? numberMatch[1].trim() : 'Неизвестен';

  // Добавляем модель в массив
  cars.push({
    name: name,
    designer: designer,
    number: number,
    description: description,
  });
}

// Запускаем функцию
fetchData();
