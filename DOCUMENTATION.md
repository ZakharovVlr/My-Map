## Модуль: src/data/loadMapData.js

### Назначение
Загружает GeoJSON-файл по указанному URL и возвращает распарсенные данные (объект FeatureCollection).

### Почему так
fetch() — асинхронный запрос, поэтому функция помечена async и использует await
для ожидания сначала самого HTTP-ответа, потом — распарсенного тела ответа (.json()).

### API
loadMapData(url: string) → Promise<Object>

### Использование
import { loadMapData } from './data/loadMapData.js';
loadMapData('/data/lopatino.geojson').then(geojson => { ... });