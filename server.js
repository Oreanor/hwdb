const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Читаем данные из файла
const carsData = JSON.parse(fs.readFileSync(path.join('public', 'carsdata.json'), 'utf8'));

// Роут для получения всех данных
app.get('/api/cars', (req, res) => {
    res.json(carsData);
});

// Роут для фильтрации по году
app.get('/api/cars/year/:year', (req, res) => {
    const year = req.params.year;
    const filteredCars = carsData.filter(car => 
        car.data.some(item => item.Year === year)
    );
    res.json(filteredCars);
});

// Роут для поиска по названию
app.get('/api/cars/search', (req, res) => {
    const searchTerm = req.query.s?.toLowerCase();
    if (!searchTerm) {
        return res.status(400).json({ error: 'Search term is required' });
    }

    const filteredCars = carsData.filter(car => 
        car.link.toLowerCase().includes(searchTerm)
    );
    res.json(filteredCars);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 