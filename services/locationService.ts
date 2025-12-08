/**
 * Сервис для работы с местоположением пользователя
 */

import { API_ENDPOINTS } from '@/constants/api';
import { getApiUrl } from '@/constants/env';
import { authFetch } from '@/utils/authFetch';
import { getLastLocation, saveLastLocation } from '@/utils/storage';
import * as Location from 'expo-location';

/**
 * Получает текущее местоположение пользователя
 */
export async function getCurrentLocation(): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return null;
    }

    const location = await Location.getCurrentPositionAsync({});
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    console.error('❌ Ошибка получения местоположения:', error);
    return null;
  }
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
    console.error('❌ Ошибка отправки местоположения:', error);
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
