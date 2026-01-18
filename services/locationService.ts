/**
 * Сервис для работы с местоположением пользователя
 */

import { API_ENDPOINTS } from '@/constants/api';
import { getApiUrl } from '@/constants/env';
import { authFetch } from '@/utils/authFetch';
import { getLastLocation, saveLastLocation } from '@/utils/storage';
import * as Location from 'expo-location';

/**
 * Получает текущее местоположение пользователя с таймаутом
 */
export async function getCurrentLocation(timeout: number = 5000): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return null;
    }

    // Используем Promise.race для таймаута
    const locationPromise = Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced, // Используем баланс между точностью и скоростью
    });

    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => {
        resolve(null);
      }, timeout);
    });

    const result = await Promise.race([locationPromise, timeoutPromise]);
    
    if (result && 'coords' in result) {
      const location = {
        latitude: result.coords.latitude,
        longitude: result.coords.longitude,
      };
      return location;
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Получает местоположение: сначала из кэша, затем пытается получить текущее
 */
export async function getLocationWithCache(): Promise<{ 
  location: { latitude: number; longitude: number } | null;
  isFromCache: boolean;
}> {
  // Сначала пытаемся получить из кэша
  const cachedLocation = await getLastLocation();
  
  if (cachedLocation) {
    // Запускаем обновление местоположения в фоне (не ждем)
    getCurrentLocation(5000).then(newLocation => {
      if (newLocation) {
        saveLastLocation(newLocation.latitude, newLocation.longitude);
      }
    });
    
    return { location: cachedLocation, isFromCache: true };
  }
  
  // Если кэша нет, получаем текущее местоположение
  const currentLocation = await getCurrentLocation(5000);
  
  if (currentLocation) {
    await saveLastLocation(currentLocation.latitude, currentLocation.longitude);
    return { location: currentLocation, isFromCache: false };
  }
  
  return { location: null, isFromCache: false };
}

/**
 * Отправляет местоположение на сервер
 */
export async function sendLocationToServer(
  latitude: number,
  longitude: number
): Promise<boolean> {
  try {
    const response = await authFetch(getApiUrl(API_ENDPOINTS.AUTH.LAST_LOCATION), {
      method: 'PUT',
      requireAuth: true,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        latitude,
        longitude,
      }),
    });

    if (response.ok) {
      // Сохраняем в кэш после успешной отправки
      await saveLastLocation(latitude, longitude);
      return true;
    }

    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Обновляет местоположение: получает текущее, отправляет на сервер и кэширует
 */
export async function updateLocation(): Promise<boolean> {
  const location = await getCurrentLocation();
  
  if (!location) {
    // Если не удалось получить текущее местоположение, пробуем отправить последнее сохраненное
    const cachedLocation = await getLastLocation();
    if (cachedLocation) {
      return await sendLocationToServer(cachedLocation.latitude, cachedLocation.longitude);
    }
    return false;
  }

  return await sendLocationToServer(location.latitude, location.longitude);
}

/**
 * Инициализирует обновление местоположения при запуске приложения
 * Вызывается только для аутентифицированных пользователей
 */
export async function initializeLocationUpdate(): Promise<void> {
  // Проверяем, есть ли токены (пользователь аутентифицирован)
  const { hasTokens } = await import('@/utils/storage');
  const isAuthenticated = await hasTokens();
  
  if (!isAuthenticated) {
    return;
  }

  // Обновляем местоположение
  await updateLocation();
}
