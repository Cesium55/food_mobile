/**
 * Утилиты для работы с координатами и дистанциями
 */

/**
 * Вычисляет расстояние между двумя точками по формуле гаверсинуса (в километрах)
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Радиус Земли в километрах
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

/**
 * Преобразует градусы в радианы
 */
function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Вычисляет границы квадрата вокруг точки для фильтрации по радиусу
 * @param latitude Широта центральной точки
 * @param longitude Долгота центральной точки
 * @param radiusKm Радиус в километрах
 * @returns Объект с границами квадрата
 */
export function getBoundingBox(
  latitude: number,
  longitude: number,
  radiusKm: number
): {
  minLatitude: number;
  maxLatitude: number;
  minLongitude: number;
  maxLongitude: number;
} {
  // Примерно 1 градус широты = 111 км
  // Для долготы зависит от широты: 1 градус долготы = 111 км * cos(широта)
  const latDelta = radiusKm / 111;
  const lonDelta = radiusKm / (111 * Math.cos(toRad(latitude)));

  return {
    minLatitude: latitude - latDelta,
    maxLatitude: latitude + latDelta,
    minLongitude: longitude - lonDelta,
    maxLongitude: longitude + lonDelta,
  };
}

/**
 * Форматирует дистанцию для отображения
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} м`;
  }
  return `${distanceKm.toFixed(1)} км`;
}
