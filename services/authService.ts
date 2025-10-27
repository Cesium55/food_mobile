/**
 * Сервис для работы с аутентификацией
 * Обрабатывает запросы к API для входа и регистрации
 */

import { API_ENDPOINTS, HTTP_METHODS, HTTP_STATUS } from '@/constants/api';
import { config, log } from '@/constants/config';
import { env } from '@/constants/env';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export interface ApiResponse {
  status: number;
  statusText: string;
  data: any;
  headers: Record<string, string>;
  url: string;
  method: string;
}

class AuthService {
  private baseUrl = env.API_BASE_URL;
  private timeout = env.API_TIMEOUT;

  /**
   * Выполняет API запрос
   */
  private async makeRequest(
    endpoint: string, 
    method: string = HTTP_METHODS.POST, 
    body?: any
  ): Promise<ApiResponse> {
    const url = `${this.baseUrl}${endpoint}`;
    
    log('debug', `Отправка ${method} запроса`, { 
      url, 
      body, 
      baseUrl: this.baseUrl,
      endpoint,
      configApiBaseUrl: config.apiBaseUrl 
    });
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      // Получаем данные ответа
      let responseData;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }
      
      // Собираем заголовки
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });
      
      const apiResponse: ApiResponse = {
        status: response.status,
        statusText: response.statusText,
        data: responseData,
        headers,
        url: url,
        method: method,
      };
      
      log('debug', 'Получен ответ от API', {
        status: response.status,
        statusText: response.statusText,
        data: responseData,
      });
      
      return apiResponse;
      
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        log('error', 'API запрос превысил таймаут', { url, timeout: this.timeout });
        throw new Error(`Запрос превысил таймаут (${this.timeout}ms)`);
      }
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      log('error', 'Ошибка API запроса', { url, error: errorMessage });
      throw error;
    }
  }

  /**
   * Вход в систему
   */
  async login(email: string, password: string): Promise<ApiResponse> {
    try {
      log('info', 'Попытка входа пользователя', { email });
      
      const response = await this.makeRequest(
        API_ENDPOINTS.AUTH.LOGIN,
        HTTP_METHODS.POST,
        { email, password }
      );
      
      if (response.status === HTTP_STATUS.OK) {
        log('info', 'Пользователь успешно вошел в систему', { email });
      } else {
        log('warn', 'Ошибка входа в систему', { 
          email, 
          status: response.status,
          message: response.data?.message || response.statusText 
        });
      }
      
      return response;
      
    } catch (error) {
      log('error', 'Ошибка при входе в систему', { email, error });
      throw error;
    }
  }

  /**
   * Регистрация пользователя
   */
  async register(email: string, password: string): Promise<ApiResponse> {
    try {
      log('info', 'Попытка регистрации пользователя', { email });
      
      const response = await this.makeRequest(
        API_ENDPOINTS.AUTH.REGISTER,
        HTTP_METHODS.POST,
        { email, password }
      );
      
      if (response.status === HTTP_STATUS.CREATED || response.status === HTTP_STATUS.OK) {
        log('info', 'Пользователь успешно зарегистрирован', { email });
      } else {
        log('warn', 'Ошибка регистрации', { 
          email, 
          status: response.status,
          message: response.data?.message || response.statusText 
        });
      }
      
      return response;
      
    } catch (error) {
      log('error', 'Ошибка при регистрации', { email, error });
      throw error;
    }
  }

  /**
   * Проверка соединения с API
   */
  async checkConnection(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/health', HTTP_METHODS.GET);
      return response.status === HTTP_STATUS.OK;
    } catch (error) {
      log('error', 'Ошибка соединения с API', { error });
      return false;
    }
  }
}

// Экспортируем singleton экземпляр
export const authService = new AuthService();
