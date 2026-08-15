import './style.css'
import { getBounds, createProjection, renderMap } from './core/Projection.js'
import { loadMapData } from './data/loadMapData.js';
import { Camera } from './core/Camera.js';


// 1. Сразу настраиваем холст
document.querySelector('#app').innerHTML = `<canvas id="mapCanvas"></canvas>`;
const canvas = document.getElementById('mapCanvas');
const ctx = canvas.getContext('2d');
//создай живой объект камеры из нашего класса Camera.js 
const camera = new Camera();
let isDragging = false;
let lastX = 0;
let lastY = 0;


// Функция, которая рассчитывает размер холста с учетом футера
function resizeCanvas() {
  const footer = document.querySelector('.site-footer');
  const footerHeight = footer ? footer.offsetHeight : 0;

  // 1. Получаем коэффициент плотности пикселей экрана (обычно 2 для Retina)
  const ratio = window.devicePixelRatio || 1;

  // 2. Умножаем реальный размер окна на этот коэффициент
  canvas.width = window.innerWidth * ratio;
  canvas.height = window.innerHeight * ratio;
}

// Запускаем расчет размеров в первый раз
resizeCanvas();

const finalUrl = import.meta.env.BASE_URL + 'data/lopatino.geojson';
//объяви переменную для хранения данных
let mapData = null;
// 2. Загружаем данные и рендерим
loadMapData(finalUrl).then(geojson => {
  console.log(geojson);
  mapData = geojson; // Сохранили данные глобально
  updateAndRender(); // Вызвали отрисовку
  const bounds = getBounds(geojson);
  // Передаем ТЕКУЩИЕ размеры canvas, которые мы только что рассчитали в resizeCanvas
  const project = createProjection(bounds, window.innerWidth, window.innerHeight, camera);

  renderMap(geojson, project, ctx);
});

function updateAndRender() {
  if (!mapData) return; // Защита: если данные еще не скачались, ничего не делаем

  const bounds = getBounds(mapData);
  const project = createProjection(bounds, canvas.width, canvas.height, camera);
  renderMap(mapData, project, ctx);
}

canvas.addEventListener('wheel', (event) => {
  // Отменяем стандартную прокрутку страницы браузера, чтобы сайт не дёргался
  event.preventDefault();

  // 1. Вызываем метод зума у нашей камеры, передавая туда event.deltaY
  camera.handleZoom(event.deltaY);

  // 2. Вызываем перерисовку карты с новым зумом!
  updateAndRender();
}, { passive: false }); // passive: false нужен, чтобы работал preventDefault()

canvas.addEventListener('mousedown', (event) => {
  isDragging = true;
  // Запоминаем стартовую позицию курсора на экране
  lastX = event.clientX;
  lastY = event.clientY;
});

canvas.addEventListener('mousemove', (event) => {
  // Если кнопка не зажата — выходим и ничего не делаем
  if (!isDragging) return;

  // Считаем разницу (дельта пикселей) между текущим и прошлым шагом
  const dx = event.clientX - lastX;
  const dy = event.clientY - lastY;

  // Передаем эти дельты в метод нашей камеры
  camera.move(dx, dy);

  // ОБЯЗАТЕЛЬНО обновляем прошлую позицию на текущую
  lastX = event.clientX;
  lastY = event.clientY;

  // Вызываем перерисовку карты с новыми координатами камеры!
  updateAndRender();
});

// Отключаем режим тащения, если кнопку отпустили
canvas.addEventListener('mouseup', () => {
  isDragging = false;
});

// И обязательно отключаем, если мышь случайно улетела за пределы карты
canvas.addEventListener('mouseleave', () => {
  isDragging = false;
});

