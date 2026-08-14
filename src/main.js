import './style.css'
import { getBounds, createProjection, renderMap } from './core/Projection.js'
import { loadMapData } from './data/loadMapData.js';
import lopatinoUrl from '../public/data/lopatino.geojson?url'; // 1. Импортировали путь

// 2. Настраиваем холст
document.querySelector('#app').innerHTML = `<canvas id="mapCanvas"></canvas>`;
const canvas = document.getElementById('mapCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// 3. Запускаем загрузку по гарантированному пути
loadMapData(lopatinoUrl).then(geojson => {
  console.log(geojson);

  const bounds = getBounds(geojson);
  const project = createProjection(bounds, canvas.width, canvas.height);

  renderMap(geojson, project, ctx);
});



