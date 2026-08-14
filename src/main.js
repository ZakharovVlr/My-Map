import './style.css'
import { getBounds, createProjection, renderMap } from './core/Projection.js'
import { loadMapData } from './data/loadMapData.js';

// 1. Добавляем тег в HTML и настраиваем холст СРАЗУ
document.querySelector('#app').innerHTML = `<canvas id="mapCanvas"></canvas>`;

const canvas = document.getElementById('mapCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// 2. И только когда холст готов, запускаем асинхронную загрузку карты
// Используем BASE_URL, чтобы Vite в интернете правильно подставил папку /My-Map/
const dataUrl = `${import.meta.env.BASE_URL}data/lopatino.geojson`;

loadMapData(dataUrl).then(geojson => {
  console.log(geojson);

  const bounds = getBounds(geojson);
  const project = createProjection(bounds, canvas.width, canvas.height);

  // Теперь ctx и canvas гарантированно существуют и доступны здесь!
  renderMap(geojson, project, ctx);
});


