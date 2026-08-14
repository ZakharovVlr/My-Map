//Infinity / -Infinity — специальные числовые значения JS ("бесконечность"). 
// Мы стартуем minLng с заведомо огромного числа, чтобы любое реальное значение 
// координаты оказалось меньше него при первом сравнении — так гарантированно 
// найдётся настоящий минимум.
export function getBounds(geojson) {
    let minLng = Infinity;
    let maxLng = -Infinity;
    let minLat = Infinity;
    let maxLat = -Infinity;

    // здесь будет перебор всех точек
    geojson.features.forEach(feature => {
        const rings = feature.geometry.coordinates; // Это массив колец полигона

        rings.forEach(ring => {       // Перебираем каждое кольцо
            ring.forEach(point => {   // Перебираем каждую точку [lng, lat]
                // Извлекаем конкретные числа из массива [число_lng, число_lat]
                let lng = point[0];
                let lat = point[1];
//это и есть сам механизм поиска границ — на каждой точке мы спрашиваем 
// "это новый рекорд минимума или максимума?" и обновляем, если да.
                if (lng < minLng){
                    minLng = lng;
                }

                if (lng > maxLng) {
                    maxLng = lng;
                }

                if (lat < minLat) {
                    minLat = lat;
                }

                if (lat > maxLat) {
                    maxLat = lat;
                }
            });
        });
    });

    return { minLng, maxLng, minLat, maxLat };
    //В конце возвращаем объект с четырьмя найденными границами.
}

export function createProjection(bounds, canvasWidth, canvasHeight) {
    const { minLng, maxLng, minLat, maxLat } = bounds;

    // 1. Сначала считаем географические центры (перенесли их наверх)
    let geoCenterX = (minLng + maxLng) / 2;
    let geoCenterY = (minLat + maxLat) / 2;

    // !2. Считаем косинус широты для этого центра без этого карта кажется приплюснутой но это только под нашу широту 55
    const latRad = (geoCenterY * Math.PI) / 180;
    const cosLat = Math.cos(latRad);

    // 3. Находим размах в градусах
    let differLng = maxLng - minLng;
    let differLat = maxLat - minLat;

    // 4. Считаем масштабы (в potentialScaleX добавили cosLat!)
    let potentialScaleX = canvasWidth / (differLng * cosLat);
    let potentialScaleY = canvasHeight / differLat;

    // 5. Выбираем финальный масштаб и центры канваса (остается без изменений)
    let scale = (Math.min(potentialScaleX, potentialScaleY)) * 0.9;

    let canvasCenterX = canvasWidth / 2;
    let canvasCenterY = canvasHeight / 2;

    return function project(lng, lat) {
        // Здесь используем cosLat, чтобы сжать долготу при переводе в пиксели!
        const x = canvasCenterX + (lng - geoCenterX) * scale * cosLat;
        const y = canvasCenterY - (lat - geoCenterY) * scale;
        return { x, y };
    };
}

export function renderMap(geojson, project, ctx) {
    // 1. Рисуем фон земли ОДИН раз для всей карты
    ctx.fillStyle = '#f2efe9';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    // 2. Начинаем перебор домов
    geojson.features.forEach(feature => {
        //накопители для поиска центра домов:
        let sumX = 0;
        let sumY = 0;
        let pointCount = 0;
        if (feature.geometry.type === 'Polygon') {
            const rings = feature.geometry.coordinates;

            // ОДИН цикл для перебора колец полигона
            rings.forEach(ring => {
                ctx.beginPath(); // Начинаем рисовать конкретное кольцо здания

                ring.forEach((point, index) => {
                    const { x, y } = project(point[0], point[1]);
                    if (index === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);

                    //Накопление координат домов прибавляй полученные пиксели к суммам и увеличивай счетчик
                    sumX += x;
                    sumY += y;
                    pointCount++;
                }); // Здесь закончился цикл по точкам

                // Закрываем и красим это кольцо
                ctx.closePath();
                ctx.fillStyle = '#d4c3b3';
                ctx.strokeStyle = '#85552c';
                ctx.lineWidth = 2;
                ctx.fill();
                ctx.stroke();
            }); // Конец цикла по кольцам

            //добавь логику вывода номеров домов
            const houseNumber = feature.properties['addr:housenumber'];
            if (houseNumber && pointCount > 0) {
                //вычисляем центр дома
                const centerX = sumX / pointCount;
                const centerY = sumY / pointCount;

                ctx.font = '11px sans-serif';       // Размер и семейство шрифта
                ctx.fillStyle = '#6e6d6d';          // Цвет текста (серый, не слишком яркий)
                ctx.textAlign = 'center';           // Центрирование по горизонтали
                ctx.textBaseline = 'middle';        // Центрирование по вертикали
                ctx.fillText(houseNumber, centerX, centerY);
            }
        }
    }); // Конец цикла по фичам
}
