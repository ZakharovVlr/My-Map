/**
 * Загружает GeoJSON-файл по указанному адресу и возвращает распарсенные данные
 * 
 * //@param {string} url — url это параметр функции (единственный, который у неё есть), 
 * тип — string (строка), потому что мы передаём туда путь вроде /data/lopatino.geojson.
 * //@returns {Promise<Object>} — тип возвращаемого значения. Раз функция помечена как async, 
 * она всегда возвращает Promise (обёртку вокруг будущего результата, даже если мы пишем 
 * return geojson; — под капотом это превращается в Promise, который в итоге "развернётся" 
 * в geojson, когда кто-то сделает await loadMapData(...)). Object внутри < > означает "а 
 * внутри этого Promise в итоге будет обычный JS-объект".
 *
 * @param {string} url - путь к geojson-файлу (например, '/data/lopatino.geojson')
 * @returns {Promise<Object>} объект GeoJSON (FeatureCollection) с загруженными данными
 */

export async function loadMapData(url) {
    const response = await fetch(url); // ждём ответ сервера
    const geojson = await response.json();                   // ждём, пока тело ответа распарсится в JSON
    return geojson;
}