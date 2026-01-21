/**
 * Сервис для автоматической авторизации
 */

import { API_ENDPOINTS, HTTP_METHODS, HTTP_STATUS } from '@/constants/api';
import { env } from '@/constants/env';
import { clearTokens, getTokens, saveTokens } from '@/utils/storage';

export interface UserProfile {
  id: number;
  email?: string | null;
  phone?: string | null;
  phone_verified?: boolean;
  is_seller?: boolean;
}

export interface AuthCheckResult {
  success: boolean;
  needsLogin: boolean;
  userData?: UserProfile;
  error?: string;
  errorType?: 'network' | 'auth' | 'unknown';
}

class AuthService {
  private baseUrl = env.API_BASE_URL;
  private timeout = env.API_TIMEOUT;
  
  // Кеширование данных пользователя
  private userCache: UserProfile | null = null;
  private lastAuthCheck: number = 0;
  private cacheTimeout: number = 5 * 60 * 1000; // 5 минут

  constructor() {
    // AuthService инициализирован
  }

  /**
   * Проверяет, действителен ли кеш
   */
  private isCacheValid(): boolean {
    return this.userCache !== null && 
           (Date.now() - this.lastAuthCheck) < this.cacheTimeout;
  }

  /**
   * Очищает кеш пользователя
   */
  private clearUserCache(): void {
    this.userCache = null;
    this.lastAuthCheck = 0;
  }

  /**
   * Публичный метод для очистки кеша (используется при выходе)
   */
  public clearCache(): void {
    this.clearUserCache();
  }

  /**
   * Получает данные пользователя из кеша или API
   */
  async getUserProfile(): Promise<UserProfile | null> {
    // Если кеш действителен, возвращаем его
    if (this.isCacheValid()) {
      return this.userCache;
    }

    // Проверяем авторизацию и обновляем кеш
    const authResult = await this.checkAuth();
    if (authResult.success && authResult.userData) {
      this.userCache = authResult.userData;
      this.lastAuthCheck = Date.now();
      return authResult.userData;
    }

    // Если это сетевая ошибка, не очищаем кеш
    if (authResult.errorType === 'network') {
      return this.userCache; // Возвращаем старый кеш если есть
    }

    return null;
  }

  /**
   * Проверяет авторизацию пользователя
   */
  async checkAuth(): Promise<AuthCheckResult> {
    try {
      // Если кеш действителен, используем его
      if (this.isCacheValid() && this.userCache) {
        return {
          success: true,
          needsLogin: false,
          userData: this.userCache,
        };
      }

      // Получаем токены из хранилища
      const tokens = await getTokens();
      
      if (!tokens.accessToken) {
        return {
          success: false,
          needsLogin: true,
          error: 'Токен доступа не найден',
          errorType: 'auth',
        };
      }

      // Проверяем токен доступа
      const authResult = await this.checkAccessToken(tokens.accessToken);
      
      if (authResult.success) {
        // Обновляем кеш при успешной проверке
        if (authResult.userData) {
          this.userCache = authResult.userData;
          this.lastAuthCheck = Date.now();
        }
        return {
          success: true,
          needsLogin: false,
          userData: authResult.userData,
        };
      }

      // Если это сетевая ошибка, сразу возвращаем её без попытки обновить токены
      if (authResult.errorType === 'network') {
        return {
          success: false,
          needsLogin: false,
          error: authResult.error || 'Ошибка сети',
          errorType: 'network',
        };
      }

      // Если токен доступа недействителен, пробуем обновить через refresh токен
      if (!tokens.refreshToken) {
        return {
          success: false,
          needsLogin: true,
          error: 'Refresh токен не найден',
          errorType: 'auth',
        };
      }

      const refreshResult = await this.refreshTokens(tokens.refreshToken);
      
      if (refreshResult.success) {
        // Обновляем кеш при успешном обновлении токенов
        if (refreshResult.userData) {
          this.userCache = refreshResult.userData;
          this.lastAuthCheck = Date.now();
        }
        return {
          success: true,
          needsLogin: false,
          userData: refreshResult.userData,
        };
      }

      // Если не удалось обновить токены, проверяем тип ошибки
      if (refreshResult.errorType === 'network') {
        // Сетевая ошибка - не очищаем токены
        return {
          success: false,
          needsLogin: false,
          error: refreshResult.error || 'Ошибка сети',
          errorType: 'network',
        };
      } else {
        // Ошибка авторизации - очищаем токены
        await clearTokens();
        this.clearUserCache();
        
        return {
          success: false,
          needsLogin: true,
          error: 'Сессия истекла, необходимо войти заново',
          errorType: 'auth',
        };
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      
      // Определяем тип ошибки
      let errorType: 'network' | 'auth' | 'unknown' = 'unknown';
      if (error instanceof Error) {
        if (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('timeout')) {
          errorType = 'network';
        }
      }
      
      return {
        success: false,
        needsLogin: errorType !== 'network',
        error: errorMessage,
        errorType,
      };
    }
  }

  /**
   * Проверяет токен доступа
   */
  private async checkAccessToken(accessToken: string): Promise<{
    success: boolean;
    userData?: UserProfile;
    error?: string;
    errorType?: 'network' | 'auth' | 'unknown';
  }> {
    try {
      const url = `${this.baseUrl}${API_ENDPOINTS.AUTH.PROFILE}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      
      const response = await fetch(url, {
        method: HTTP_METHODS.POST,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (response.status === HTTP_STATUS.OK) {
        const data = await response.json();
        
        // Проверяем структуру ответа - может быть data.data.data или data.data
        let userData = null;
        if (data && data.data && data.data.data && data.data.data.id && (data.data.data.email || data.data.data.phone)) {
          userData = {
            id: data.data.data.id,
            email: data.data.data.email || null,
            phone: data.data.data.phone || null,
            phone_verified: data.data.data.phone_verified || false,
            is_seller: data.data.data.is_seller || false,
          };
        } else if (data && data.data && data.data.id && (data.data.email || data.data.phone)) {
          userData = {
            id: data.data.id,
            email: data.data.email || null,
            phone: data.data.phone || null,
            phone_verified: data.data.phone_verified || false,
            is_seller: data.data.is_seller || false,
          };
        }
        
        if (userData) {
          return {
            success: true,
            userData,
          };
        }
      }

      return { 
        success: false, 
        error: 'Токен доступа недействителен',
        errorType: 'auth'
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      let errorType: 'network' | 'auth' | 'unknown' = 'network';

      return { 
        success: false, 
        error: errorMessage,
        errorType
      };
    }
  }

  /**
   * Обновляет токены через refresh токен
   */
  private async refreshTokens(refreshToken: string): Promise<{
    success: boolean;
    userData?: UserProfile;
    error?: string;
    errorType?: 'network' | 'auth' | 'unknown';
  }> {
    try {
      const url = `${this.baseUrl}${API_ENDPOINTS.AUTH.REFRESH}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      
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
        try {
          const responseData = await response.json();
          
          // Проверяем структуру ответа - токены лежат в data.data
          if (responseData && responseData.data && responseData.data.access_token && responseData.data.refresh_token) {
            await saveTokens(responseData.data.access_token, responseData.data.refresh_token);
            
            // Получаем данные пользователя с новым токеном
            const userData = await this.getUserData(responseData.data.access_token);
            
            // Обновляем кеш если получили данные пользователя
            if (userData) {
              this.userCache = userData;
              this.lastAuthCheck = Date.now();
            }
            
            return {
              success: true,
              userData,
            };
          }
        } catch (parseError) {
          // Ошибка парсинга JSON - считаем это временной проблемой
          return { 
            success: false, 
            error: 'Ошибка парсинга ответа сервера',
            errorType: 'network'
          };
        }
      }

      // Определяем тип ошибки на основе HTTP статуса
      let errorType: 'network' | 'auth' | 'unknown' = 'unknown';
      if (response.status === HTTP_STATUS.UNAUTHORIZED || response.status === HTTP_STATUS.FORBIDDEN) {
        errorType = 'auth';
      } else if (response.status >= 500) {
        // Временные ошибки сервера
        errorType = 'network';
      } else {
        // Другие ошибки (400, 404 и т.д.) - считаем проблемой авторизации
        errorType = 'auth';
      }

      return { 
        success: false, 
        error: 'Не удалось обновить токены',
        errorType
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      let errorType: 'network' | 'auth' | 'unknown' = 'unknown';
      
      if (error instanceof Error) {
        if (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('timeout') || error.message.includes('aborted')) {
          errorType = 'network';
        }
      }
      
      return { 
        success: false, 
        error: errorMessage,
        errorType
      };
    }
  }

  /**
   * Принудительно перезагружает авторизацию (очищает кеш и проверяет заново)
   */
  async forceReloadAuth(): Promise<AuthCheckResult> {
    this.clearUserCache();
    return await this.checkAuth();
  }

  /**
   * Получает данные пользователя с токеном
   */
  private async getUserData(accessToken: string): Promise<UserProfile | undefined> {
    try {
      const url = `${this.baseUrl}${API_ENDPOINTS.AUTH.PROFILE}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      
      const response = await fetch(url, {
        method: HTTP_METHODS.POST,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (response.status === HTTP_STATUS.OK) {
        const data = await response.json();
        
        // Проверяем структуру ответа - может быть data.data.data или data.data
        let userData = null;
        if (data && data.data && data.data.data && data.data.data.id && (data.data.data.email || data.data.data.phone)) {
          userData = {
            id: data.data.data.id,
            email: data.data.data.email || null,
            phone: data.data.data.phone || null,
            phone_verified: data.data.data.phone_verified || false,
            is_seller: data.data.data.is_seller || false,
          };
        } else if (data && data.data && data.data.id && (data.data.email || data.data.phone)) {
          userData = {
            id: data.data.id,
            email: data.data.email || null,
            phone: data.data.phone || null,
            phone_verified: data.data.phone_verified || false,
            is_seller: data.data.is_seller || false,
          };
        }
        
        if (userData) {
          return userData;
        }
      }

      return undefined;
      
    } catch (error) {
      return undefined;
    }
  }
}

// Экспортируем singleton экземпляр
export const authService = new AuthService();