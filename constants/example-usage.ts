/**
 * Примеры использования конфигурации
 * Показывает, как использовать настройки в разных частях приложения
 */

import { API_ENDPOINTS, HTTP_METHODS } from './api';
import { config, getApiUrl, log } from './config';

// Пример 1: Использование в API сервисе
export class AuthService {
  private baseUrl = config.apiBaseUrl;
  private timeout = config.apiTimeout;

  async login(login: string, password: string) {
    try {
      log('info', 'Попытка входа пользователя', { login });
      
      const url = getApiUrl(API_ENDPOINTS.AUTH.LOGIN);
      
      const response = await fetch(url, {
        method: HTTP_METHODS.POST,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ login, password }),
      });

      if (response.ok) {
        const data = await response.json();
        log('info', 'Пользователь успешно вошел в систему', { userId: data.userId });
        return data;
      } else {
        log('error', 'Ошибка входа в систему', { status: response.status });
        throw new Error('Ошибка входа в систему');
      }
    } catch (error) {
      log('error', 'Ошибка при входе в систему', error);
      throw error;
    }
  }

  async register(login: string, password: string) {
    try {
      log('info', 'Попытка регистрации пользователя', { login });
      
      const url = getApiUrl(API_ENDPOINTS.AUTH.REGISTER);
      
      const response = await fetch(url, {
        method: HTTP_METHODS.POST,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ login, password }),
      });

      if (response.ok) {
        const data = await response.json();
        log('info', 'Пользователь успешно зарегистрирован', { userId: data.userId });
        return data;
      } else {
        log('error', 'Ошибка регистрации', { status: response.status });
        throw new Error('Ошибка регистрации');
      }
    } catch (error) {
      log('error', 'Ошибка при регистрации', error);
      throw error;
    }
  }
}

// Пример 2: Использование в компоненте
export const useAuth = () => {
  const authService = new AuthService();

  const handleLogin = async (login: string, password: string) => {
    try {
      const result = await authService.login(login, password);
      
      // Сохраняем токен в AsyncStorage
      if (result.token) {
        // Здесь можно использовать config.authTokenKey
        // await AsyncStorage.setItem(config.authTokenKey, result.token);
      }
      
      return result;
    } catch (error) {
      log('error', 'Ошибка в useAuth.handleLogin', error);
      throw error;
    }
  };

  const handleRegister = async (login: string, password: string) => {
    try {
      const result = await authService.register(login, password);
      return result;
    } catch (error) {
      log('error', 'Ошибка в useAuth.handleRegister', error);
      throw error;
    }
  };

  return {
    handleLogin,
    handleRegister,
  };
};

// Пример 3: Использование в утилитах
export const createApiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = getApiUrl(endpoint);
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.apiTimeout);
  
  try {
    log('debug', 'Отправка API запроса', { url, method: options.method || 'GET' });
    
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      log('debug', 'API запрос успешен', { url, status: response.status });
    } else {
      log('warn', 'API запрос завершился с ошибкой', { url, status: response.status });
    }
    
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    log('error', 'Ошибка API запроса', { url, error });
    throw error;
  }
};

// Пример 4: Использование в настройках приложения
export const getAppSettings = () => {
  return {
    name: config.appName,
    version: config.appVersion,
    environment: config.environment,
    apiUrl: config.apiBaseUrl,
    enableLogging: config.enableLogging,
    enableAnimations: config.enableAnimations,
    animationDuration: config.animationDuration,
  };
};

// Пример 5: Условная логика в зависимости от окружения
export const getDebugInfo = () => {
  if (config.isDevelopment) {
    return {
      apiUrl: config.apiBaseUrl,
      timeout: config.apiTimeout,
      logLevel: config.logLevel,
      environment: config.environment,
    };
  }
  
  return null;
};

// Пример 6: Использование в навигации
export const getNavigationConfig = () => {
  return {
    enableAnimations: config.enableAnimations,
    animationDuration: config.animationDuration,
  };
};
