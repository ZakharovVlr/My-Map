import './style.css'
import javascriptLogo from './assets/javascript.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import { setupCounter } from './counter.js'
import { getBounds, createProjection, renderMap } from './core/Projection.js'

import { loadMapData } from './data/loadMapData.js';

loadMapData('/data/lopatino.geojson').then(geojson => {
  console.log(geojson);

  // 1. Сначала считаем границы
  const bounds = getBounds(geojson);
  // 2. Затем создаем функцию проекции
  const project = createProjection(bounds, canvas.width, canvas.height);
  // 3. И только в самом конце, когда всё готово, РИСУЕМ!
  renderMap(geojson, project, ctx);
});

// Добавляем тег в HTML
document.querySelector('#app').innerHTML = `<canvas id="mapCanvas"></canvas>`;

const canvas = document.getElementById('mapCanvas');
const ctx = canvas.getContext('2d');

// Задаем физический размер в пикселях
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

