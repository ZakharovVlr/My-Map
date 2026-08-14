import './style.css'
import { getBounds, createProjection, renderMap } from './core/Projection.js'
import { loadMapData } from './data/loadMapData.js';

// 1. Сразу настраиваем холст
document.querySelector('#app').innerHTML = `<canvas id="mapCanvas"></canvas>`;
const canvas = document.getElementById('mapCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// 2. Указываем чистый относительный путь БЕЗ слэша в начале и БЕЗ import.meta
// Для Vite это означает: "в локалке бери из public/data, а в сети — из текущей папки сайта"
// Автоматически находим базовый путь (например, "/My-Map/") из адреса сайта
const basePath = window.location.pathname.endsWith('/')
  ? window.location.pathname
  : window.location.pathname + '/';

// Склеиваем идеальный путь к файлу данных
const finalUrl = basePath + 'data/lopatino.geojson';

loadMapData(finalUrl).then(geojson => {
  console.log(geojson);

  const bounds = getBounds(geojson);
  const project = createProjection(bounds, canvas.width, canvas.height);

  renderMap(geojson, project, ctx);
});





