//Infinity / -Infinity — специальные числовые значения JS ("бесконечность"). 
// Мы стартуем minLng с заведомо огромного числа, чтобы любое реальное значение 
// координаты оказалось меньше него при первом сравнении — так гарантированно 
// найдётся настоящий минимум.
export function getBounds(geojson) {
    let minLng = Infinity;
    let maxLng = -Infinity;
    let minLat = Infinity;
    let maxLat = -Infinity;

    // вспомогательная функция — единственное место, где происходит сравнение
    function updateBounds(lng, lat) {
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
    }
    //Раньше у нас были только здания (Polygon) — простая структура данных, getBounds работала прямолинейно. Теперь, когда ты расширил GeoJSON (добавил дороги, точки, парки через Overpass) — в данных появились разные типы геометрии (Point, LineString, Polygon), и у каждого своя структура вложенности координат. getBounds должна уметь корректно обработать любой из них, иначе она ломается на первом же объекте другого типа
    geojson.features.forEach(feature => {
        const geometry = feature.geometry;

        switch (geometry.type) {
            case 'Point':
                let lng = geometry.coordinates[0];
                let lat = geometry.coordinates[1];
                // здесь просто один вызов
                updateBounds(lng, lat);
                break;
            case 'LineString':
                const points = feature.geometry.coordinates;
                // здесь .forEach с одним вызовом внутри
                points.forEach((point, index) => {
                    updateBounds(point[0], point[1]);
                });
                break;
            case 'Polygon':
                const rings = feature.geometry.coordinates;
                // здесь два вложенных .forEach, но внутри — тот же один вызов
                rings.forEach(ring => {
                    ring.forEach((point, index) => {
                        updateBounds(point[0], point[1]);
                    });
                });
                break;
        } 
    });

    return { minLng, maxLng, minLat, maxLat };
}

export function createProjection(bounds, canvasWidth, canvasHeight, camera) {
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
        //Сейчас у тебя расстояние от центра по оси X считается так
        const x = canvasCenterX + ((lng - geoCenterX) * scale * cosLat) * camera.zoom + camera.x; //Если мы хотим, чтобы оно увеличивалось или уменьшалось при зуме, мы должны весь этот кусок дополнительно умножить на camera.zoom
        //Сейчас у тебя расстояние от центра по оси Y считается так
        const y = canvasCenterY - ((lat - geoCenterY) * scale) * camera.zoom + camera.y;
        return { x, y };
    };
}

export function renderMap(geojson, project, ctx) {
    // 1. Рисуем фон земли ОДИН раз для всей карты
    ctx.fillStyle = '#f2efe9';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    // 2. Начинаем перебор (нам нужно было научить функцию работать не только с домами "polygon" но и с другими обектами)
    geojson.features.forEach(feature => {
        const geometry = feature.geometry;
        let sumX = 0;
        let sumY = 0;
        let pointCount = 0;
        switch (geometry.type) {
            case 'Point':
                // тут одна точка: geometry.coordinates — это просто [lng, lat]
                //мы переходим в geojson и находим эти [lng, lat]
                let lng = geometry.coordinates[0];
                let lat = geometry.coordinates[1];
                //Получи { x, y } через project(lng, lat).
                const { x, y } = project(lng, lat);
                //Начинаем рисовать
                ctx.beginPath();
                //ctx.arc(x, y, radius, startAngle, endAngle)
                ctx.arc(x, y, 2, 0, Math.PI * 2);
                //цвет для точки
                ctx.fillStyle = '#ff0000';
                ctx.fill();
                break;

            case 'LineString':
                // тут просто массив точек: geometry.coordinates — [[lng, lat], [lng, lat], ...]
                const points = feature.geometry.coordinates;
                ctx.beginPath(); // Начинаем рисовать (рисуем до цикла чтобы рисовался один раз а не каждый раз заново стирая предыдущий)
                points.forEach((point, index) => {
                    const { x, y } = project(point[0], point[1]);
                    if (index === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);

                    //Накопление координат домов прибавляй полученные пиксели к суммам и увеличивай счетчик
                    sumX += x;
                    sumY += y;
                    pointCount++;
                }); // Здесь закончился цикл по точкам
                // то же самое что и с ctx.beginPath();
                //здесь мы рисуем дорогу значит нам нужна только линия
                ctx.strokeStyle = '#85552c';
                ctx.lineWidth = 1;
                ctx.stroke();
                break;

            case 'Polygon':
                // тут то, что ты уже писал раньше — массив колец //накопители для поиска центра домов:
                
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
                        ctx.lineWidth = 1;
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
                break;
        }
    });
       
}
