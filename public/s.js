const https = require('https');
const fs = require('fs');

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';

      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function fetchYearData(year) {
  const url = `https://hotwheels.fandom.com/wiki/List_of_${year}_Hot_Wheels`;
  console.log(`Fetching ${url}`);

  try {
    const html = await fetch(url);
    const items = [];

    // Найти строки таблицы
    const rowRegex = /<tr>(.*?)<\/tr>/gs;
    const rows = html.match(rowRegex) || [];

    for (const rowHtml of rows) {
      // Найти все картинки в строке
      const imgs = [...rowHtml.matchAll(/<img[^>]+src="([^"]+)"[^>]*>/g)];
      // Найти ссылку на модельку
      const linkMatch = rowHtml.match(/<a[^>]+href="\/wiki\/([^"]+)"[^>]*>/);

      if (linkMatch) {
        const link = linkMatch[1];
        let imgSrc = null;

        // Если есть хотя бы одна картинка, берем вторую
        if (imgs.length > 1) {
          imgSrc = imgs[1][1]; // ВТОРАЯ картинка
        }

        // Если картинки нет, проверяем на наличие цвета или другого текста
        if (!imgSrc) {
          const colorMatch = rowHtml.match(/<td[^>]*>([^<]+)<\/td>/);
          if (colorMatch) {
            const colorText = colorMatch[1].trim().toLowerCase();
            if (colorText !== "color" && colorText !== "") {
              imgSrc = ""; // Ставим пустую ссылку, если цвет указан
            }
          }
        }

        // Если у нас есть ссылка и изображение
        const imgPath = imgSrc ? imgSrc.split('/static.wikia.nocookie.net/hotwheels/')[1] : null;
        const cbParam = (imgSrc && imgSrc.split('cb=')[1] || '').split('&')[0];

        if (imgPath) {
          items.push({
            l: link.trim(),
            i: imgPath.split('?')[0] + '/revision/latest' + (cbParam ? `?cb=${cbParam}` : '')
          });
        } else {
          // Если картинки нет, ставим пустую ссылку
          items.push({
            l: link.trim(),
            i: ''
          });
        }
      }
    }

    return {
      year,
      data: items
    };

  } catch (err) {
    console.error(`Failed to fetch ${year}:`, err.message);
    return {
      year,
      data: []
    };
  }
}

async function main() {
  const year = 1977; // Только для 1977 года
  const result = [];

  const yearData = await fetchYearData(year);
  if (yearData.data.length === 0) {
    console.warn(`No data for year ${year}`);
  }
  result.push(yearData);

  fs.writeFileSync('hotwheels_1977.json', JSON.stringify(result, null, 2));
  console.log('Done! Saved to hotwheels_1977.json');
}

main();
