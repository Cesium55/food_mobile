/**
 * Управление переменными окружения
 * Берет данные напрямую из app.json через expo-constants
 */

import Constants from 'expo-constants';

// Функция для получения переменной из app.json
const getAppConfigVar = (key: string, defaultValue?: string): string | undefined => {
  const value = Constants.expoConfig?.extra?.env?.[key];
  if (value !== undefined && value !== '') {
    console.log(`✅ Found app.json ${key}:`, value);
    return value;
  }
  
  console.log(`⚠️ Using default for ${key}:`, defaultValue);
  return defaultValue;
};

// Функция для получения boolean переменной
const getBooleanAppConfigVar = (key: string, defaultValue: boolean = false): boolean => {
  const value = getAppConfigVar(key);
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true';
};

// Функция для получения number переменной
const getNumberAppConfigVar = (key: string, defaultValue: number): number => {
  const value = getAppConfigVar(key);
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

// Экспортируем переменные из app.json
export const env = {
  // API настройки
  API_BASE_URL: getAppConfigVar('API_BASE_URL', 'http://localhost:3000/api'),
  API_TIMEOUT: getNumberAppConfigVar('API_TIMEOUT', 10000),
  
  // Настройки аутентификации
  AUTH_TOKEN_KEY: getAppConfigVar('AUTH_TOKEN_KEY', 'auth_token'),
  REFRESH_TOKEN_KEY: getAppConfigVar('REFRESH_TOKEN_KEY', 'refresh_token'),
  
  // Настройки приложения
  APP_NAME: getAppConfigVar('APP_NAME', 'Food Link'),
  APP_VERSION: getAppConfigVar('APP_VERSION', '1.0.0'),
  
  // Настройки логирования
  ENABLE_LOGGING: getBooleanAppConfigVar('ENABLE_LOGGING', __DEV__),
  LOG_LEVEL: getAppConfigVar('LOG_LEVEL', __DEV__ ? 'debug' : 'error') as 'debug' | 'info' | 'warn' | 'error',
  
  // Настройки кеширования
  CACHE_TIMEOUT: getNumberAppConfigVar('CACHE_TIMEOUT', 300000),
  
  // Настройки UI
  ENABLE_ANIMATIONS: getBooleanAppConfigVar('ENABLE_ANIMATIONS', true),
  ANIMATION_DURATION: getNumberAppConfigVar('ANIMATION_DURATION', 300),
  
  // Окружение
  NODE_ENV: getAppConfigVar('NODE_ENV', __DEV__ ? 'development' : 'production'),
  
  // S3 настройки
  S3_BUCKET_PREFIX: getAppConfigVar('S3_BUCKET_PREFIX', ''),
  
  // Дополнительные настройки
  IS_DEV: __DEV__,
  IS_PROD: !__DEV__,
};

// Функция для проверки окружения
export const isDevelopment = (): boolean => env.NODE_ENV === 'development';
export const isStaging = (): boolean => env.NODE_ENV === 'staging';
export const isProduction = (): boolean => env.NODE_ENV === 'production';

// Функция для получения полного API URL
export const getApiUrl = (endpoint: string = ''): string => {
  const baseUrl = env.API_BASE_URL || 'http://localhost:3000/api';
  const cleanBaseUrl = baseUrl.endsWith('/') 
    ? baseUrl.slice(0, -1) 
    : baseUrl;
  
  const cleanEndpoint = endpoint.startsWith('/') 
    ? endpoint 
    : `/${endpoint}`;
    
  return `${cleanBaseUrl}${cleanEndpoint}`;
};

// Функция для логирования с учетом настроек
export const log = (level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any) => {
  if (!env.ENABLE_LOGGING) return;
  
  const levels = ['debug', 'info', 'warn', 'error'];
  const currentLevelIndex = levels.indexOf(env.LOG_LEVEL);
  const messageLevelIndex = levels.indexOf(level);
  
  if (messageLevelIndex >= currentLevelIndex) {
    console[level](`[${env.APP_NAME}] ${message}`, data || '');
  }
};

// Отладочная информация
console.log('🔧 App Config Debug Info:', {
  '1. app.json API_BASE_URL': Constants.expoConfig?.extra?.env?.API_BASE_URL,
  '2. Final result (env.API_BASE_URL)': env.API_BASE_URL,
  '3. All app.json env keys': Object.keys(Constants.expoConfig?.extra?.env || {}),
});
