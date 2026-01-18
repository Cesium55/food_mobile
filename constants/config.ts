/**
 * Главный файл конфигурации приложения
 * Объединяет все настройки из разных модулей
 */

import { API_ENDPOINTS, getEndpointUrl } from './api';
import { env } from './env';
import { currentEnv } from './environments';

// Основной интерфейс конфигурации
export interface AppConfig {
  // API настройки
  apiBaseUrl: string;
  apiTimeout: number;
  
  // Настройки аутентификации
  authTokenKey: string;
  refreshTokenKey: string;
  
  // Настройки приложения
  appName: string;
  appVersion: string;
  
  // Настройки логирования
  enableLogging: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  
  // Настройки кеширования
  cacheTimeout: number;
  
  // Настройки UI
  enableAnimations: boolean;
  animationDuration: number;
  
  // Настройки окружения
  environment: string;
  isDevelopment: boolean;
  isProduction: boolean;
  
  // S3 настройки
  s3BucketPrefix: string;
  
  // API endpoints
  endpoints: typeof API_ENDPOINTS;
}

// Создаем конфигурацию, объединяя настройки из разных источников
export const config: AppConfig = {
  // API настройки
  apiBaseUrl: currentEnv.apiBaseUrl,
  apiTimeout: currentEnv.apiTimeout,
  
  // Настройки аутентификации
  authTokenKey: env.AUTH_TOKEN_KEY || 'auth_token',
  refreshTokenKey: env.REFRESH_TOKEN_KEY || 'refresh_token',
  
  // Настройки приложения
  appName: env.APP_NAME || 'Food Link',
  appVersion: env.APP_VERSION || '1.0.0',
  
  // Настройки логирования
  enableLogging: currentEnv.enableLogging,
  logLevel: currentEnv.logLevel,
  
  // Настройки кеширования
  cacheTimeout: env.CACHE_TIMEOUT,
  
  // Настройки UI
  enableAnimations: env.ENABLE_ANIMATIONS,
  animationDuration: env.ANIMATION_DURATION,
  
  // Настройки окружения
  environment: currentEnv.name,
  isDevelopment: currentEnv.name === 'Development',
  isProduction: currentEnv.name === 'Production',
  
  // S3 настройки
  s3BucketPrefix: env.S3_BUCKET_PREFIX || '',
  
  // API endpoints
  endpoints: API_ENDPOINTS,
};

// Экспортируем функции для удобства
export const getConfig = (): AppConfig => config;
export const getApiUrl = (endpoint: string = ''): string => getEndpointUrl(endpoint);
export const log = (level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any) => {
  if (!config.enableLogging) return;
  
  const levels = ['debug', 'info', 'warn', 'error'];
  const currentLevelIndex = levels.indexOf(config.logLevel);
  const messageLevelIndex = levels.indexOf(level);
  
  if (messageLevelIndex >= currentLevelIndex) {
    console[level](`[${config.appName}] ${message}`, data || '');
  }
};

// Экспортируем все настройки для удобства
export * from './api';
export { env, log as envLog, getApiUrl as getEnvApiUrl } from './env';
export { currentEnv, isDevelopment as isEnvDevelopment, isProduction as isEnvProduction, isStaging as isEnvStaging } from './environments';

