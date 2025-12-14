/**
 * Утилиты для работы с JWT токенами
 */

export interface JWTPayload {
  user_id?: number;
  email?: string | null;
  phone?: string | null;
  phone_verified?: boolean;
  is_seller?: boolean;
  type?: string;
  exp?: number;
  [key: string]: any;
}

/**
 * Декодирует JWT токен без проверки подписи
 * @param token - JWT токен
 * @returns Декодированный payload или null если токен невалидный
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    // JWT состоит из трех частей, разделенных точками: header.payload.signature
    const parts = token.split('.');
    
    if (parts.length !== 3) {
      console.error('❌ Невалидный формат JWT токена');
      return null;
    }

    // Декодируем payload (вторая часть)
    const payload = parts[1];
    
    // Base64 декодирование (JWT использует base64url, но стандартный base64 тоже работает)
    // Заменяем URL-safe символы обратно
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    
    // Добавляем padding если нужно
    const paddedBase64 = base64 + '='.repeat((4 - base64.length % 4) % 4);
    
    // Декодируем
    const decoded = atob(paddedBase64);
    
    // Парсим JSON
    const parsed = JSON.parse(decoded);
    
    return parsed as JWTPayload;
  } catch (error) {
    console.error('❌ Ошибка декодирования JWT токена:', error);
    return null;
  }
}

/**
 * Проверяет, истек ли токен
 * @param token - JWT токен
 * @returns true если токен истек, false если действителен
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJWT(token);
  
  if (!payload || !payload.exp) {
    return true; // Если нет exp, считаем токен истекшим
  }
  
  // exp в JWT - это Unix timestamp в секундах
  const expirationTime = payload.exp * 1000; // Конвертируем в миллисекунды
  const currentTime = Date.now();
  
  return currentTime >= expirationTime;
}

/**
 * Получает поле phone_verified из токена
 * @param token - JWT токен
 * @returns true если телефон верифицирован, false если нет, null если поле отсутствует
 */
export function getPhoneVerified(token: string): boolean | null {
  const payload = decodeJWT(token);
  
  if (!payload) {
    return null;
  }
  
  return payload.phone_verified ?? null;
}










