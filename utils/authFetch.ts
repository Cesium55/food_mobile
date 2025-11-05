/**
 * Утилита для выполнения авторизованных API запросов
 * Автоматически добавляет токены и обновляет их при необходимости
 */

import { API_ENDPOINTS, HTTP_METHODS, HTTP_STATUS } from '@/constants/api';
import { env } from '@/constants/env';
import { clearTokens, getTokens, saveTokens } from './storage';

export interface AuthFetchOptions extends RequestInit {
  /**
   * Нужна ли авторизация для этого запроса
   * @default true
   */
  requireAuth?: boolean;

  /**
   * Максимальное количество попыток при ошибке авторизации
   * @default 1
   */
  maxRetries?: number;

  /**
   * Сбрасывать ли токены при критической ошибке авторизации
   * @default true
   */
  clearTokensOnError?: boolean;
}

// Флаг для предотвращения множественных одновременных refresh запросов
let isRefreshing = false;
let refreshPromise: Promise<{ success: boolean; accessToken?: string | null }> | null = null;

/**
 * Получает access токен из хранилища
 */
async function getAccessToken(): Promise<string | null> {
  const { accessToken } = await getTokens();
  return accessToken;
}

/**
 * Получает refresh токен из хранилища
 */
async function getRefreshToken(): Promise<string | null> {
  const { refreshToken } = await getTokens();
  return refreshToken;
}

/**
 * Обновляет токены через refresh токен
 */
async function refreshAccessToken(): Promise<{ success: boolean; accessToken?: string | null }> {
  // Если уже обновляем токены, возвращаем существующий промис
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const refreshToken = await getRefreshToken();

      if (!refreshToken) {
        console.error('❌ Refresh токен не найден');
        await clearTokens();
        return { success: false, accessToken: null };
      }

      const url = `${env.API_BASE_URL}${API_ENDPOINTS.AUTH.REFRESH}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), env.API_TIMEOUT);

      const response = await fetch(url, {
        method: HTTP_METHODS.POST,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: refreshToken,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === HTTP_STATUS.OK) {
        const responseData = await response.json();

        // Стандартная структура ответа: {data: {access_token, refresh_token}}
        if (responseData.data && responseData.data.access_token && responseData.data.refresh_token) {
          await saveTokens(responseData.data.access_token, responseData.data.refresh_token);
          console.log('✅ Токены успешно обновлены');
          return { success: true, accessToken: responseData.data.access_token };
        }
      }

      console.error('❌ Не удалось обновить токены');
      await clearTokens();
      return { success: false, accessToken: null };

    } catch (error) {
      console.error('❌ Ошибка при обновлении токенов:', error);
      await clearTokens();
      return { success: false, accessToken: null };
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Создает заголовки для авторизованного запроса
 */
function createAuthHeaders(
  customHeaders?: HeadersInit,
  accessToken?: string | null
): HeadersInit {
  const headers = new Headers(customHeaders);

  // Устанавливаем базовые заголовки если их нет
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  // Добавляем токен авторизации если он есть
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  return headers;
}

/**
 * Выполняет авторизованный API запрос с автоматическим обновлением токенов
 * 
 * @param url - URL для запроса
 * @param options - Опции запроса (extends RequestInit)
 * @returns Promise<Response>
 * 
 * @example
 * // GET запрос с авторизацией
 * const response = await authFetch('/api/products', { method: 'GET' });
 * const data = await response.json();
 * 
 * @example
 * // POST запрос с телом
 * const response = await authFetch('/api/cart/add', {
 *   method: 'POST',
 *   body: JSON.stringify({ productId: 1, quantity: 2 })
 * });
 * 
 * @example
 * // Запрос без авторизации
 * const response = await authFetch('/api/public/data', {
 *   method: 'GET',
 *   requireAuth: false
 * });
 */
export async function authFetch(
  url: string | URL,
  options: AuthFetchOptions = {}
): Promise<Response> {
  const {
    requireAuth = true,
    maxRetries = 1,
    clearTokensOnError = true,
    headers: customHeaders,
    ...fetchOptions
  } = options;

  let accessToken: string | null = null;
  let retryCount = 0;

  try {
    // Получаем токен если нужна авторизация
    if (requireAuth) {
      accessToken = await getAccessToken();

      if (!accessToken) {
        console.warn('⚠️ Токен доступа не найден, но запрос требует авторизацию');
      }
    }

    // Создаем заголовки
    const headers = createAuthHeaders(customHeaders, accessToken);

    // Создаем контроллер для таймаута
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), env.API_TIMEOUT);

    try {
      // Выполняем запрос
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        signal: controller.signal,
        redirect: 'follow', // Автоматически следовать за редиректами
      });

      clearTimeout(timeoutId);

      // Если запрос успешен, возвращаем ответ
      if (response.ok) {
        return response;
      }

      // Если получили 401 и у нас есть токен, пробуем обновить
      if (response.status === HTTP_STATUS.UNAUTHORIZED && requireAuth && retryCount < maxRetries) {
        console.log('🔄 Получен 401, обновляем токены и повторяем запрос...');

        // Обновляем токены
        const refreshResult = await refreshAccessToken();

        if (refreshResult.success && refreshResult.accessToken) {
          retryCount++;

          // Повторяем запрос с новым токеном
          console.log('🔄 Повторяем запрос с новым токеном');

          const newHeaders = createAuthHeaders(customHeaders, refreshResult.accessToken);
          const newController = new AbortController();
          const newTimeoutId = setTimeout(() => newController.abort(), env.API_TIMEOUT);

          try {
            const retryResponse = await fetch(url, {
              ...fetchOptions,
              headers: newHeaders,
              signal: newController.signal,
              redirect: 'follow', // Автоматически следовать за редиректами
            });

            clearTimeout(newTimeoutId);
            return retryResponse;

          } catch (retryError) {
            clearTimeout(newTimeoutId);
            throw retryError;
          }
        } else {
          // Не удалось обновить токены
          console.error('❌ Не удалось обновить токены');

          if (clearTokensOnError) {
            await clearTokens();
            console.log('🧹 Токены очищены');
          }

          return response; // Возвращаем оригинальный 401 ответ
        }
      }

      // Для других статусов просто возвращаем ответ
      return response;

    } catch (fetchError) {
      clearTimeout(timeoutId);

      // Проверяем, это ошибка авторизации или сетевая ошибка
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        throw new Error('Request timeout');
      }

      throw fetchError;
    }

  } catch (error) {
    console.error('❌ Ошибка в authFetch:', error);
    throw error;
  }
}
