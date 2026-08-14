import './style.css'
import { getBounds, createProjection, renderMap } from './core/Projection.js'
import { loadMapData } from './data/loadMapData.js';

// 1. Сразу настраиваем холст
document.querySelector('#app').innerHTML = `<canvas id="mapCanvas"></canvas>`;
const canvas = document.getElementById('mapCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

//!
const finalUrl = import.meta.env.BASE_URL + 'data/lopatino.geojson';


loadMapData(finalUrl).then(geojson => {
  console.log(geojson);

  const bounds = getBounds(geojson);
  const project = createProjection(bounds, canvas.width, canvas.height);

  renderMap(geojson, project, ctx);
});





