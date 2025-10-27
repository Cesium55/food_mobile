/**
 * Настройки для разных окружений
 * Содержит специфичные конфигурации для dev, staging, production
 */

import { env } from './env';

// Интерфейс для настроек окружения
export interface EnvironmentConfig {
  name: string;
  apiBaseUrl: string;
  apiTimeout: number;
  enableLogging: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  enableAnalytics: boolean;
  enableCrashReporting: boolean;
  enablePerformanceMonitoring: boolean;
  enableDebugMenu: boolean;
  enableHotReload: boolean;
  enableFlipper: boolean;
  enableReduxDevTools: boolean;
  mockApi: boolean;
  mockDelay: number;
}

// Конфигурации для разных окружений
export const environments: Record<string, EnvironmentConfig> = {
  development: {
    name: 'Development',
    apiBaseUrl: env.API_BASE_URL,
    apiTimeout: 10000,
    enableLogging: true,
    logLevel: 'debug',
    enableAnalytics: false,
    enableCrashReporting: false,
    enablePerformanceMonitoring: false,
    enableDebugMenu: true,
    enableHotReload: true,
    enableFlipper: true,
    enableReduxDevTools: true,
    mockApi: true,
    mockDelay: 500,
  },
  
  staging: {
    name: 'Staging',
    apiBaseUrl: env.API_BASE_URL,
    apiTimeout: 15000,
    enableLogging: true,
    logLevel: 'info',
    enableAnalytics: true,
    enableCrashReporting: true,
    enablePerformanceMonitoring: true,
    enableDebugMenu: false,
    enableHotReload: false,
    enableFlipper: false,
    enableReduxDevTools: false,
    mockApi: false,
    mockDelay: 0,
  },
  
  production: {
    name: 'Production',
    apiBaseUrl: env.API_BASE_URL,
    apiTimeout: 20000,
    enableLogging: false,
    logLevel: 'error',
    enableAnalytics: true,
    enableCrashReporting: true,
    enablePerformanceMonitoring: true,
    enableDebugMenu: false,
    enableHotReload: false,
    enableFlipper: false,
    enableReduxDevTools: false,
    mockApi: false,
    mockDelay: 0,
  },
};

// Получаем текущую конфигурацию окружения
export const getCurrentEnvironment = (): EnvironmentConfig => {
  const envName = env.NODE_ENV || 'development';
  return environments[envName] || environments.development;
};

// Экспортируем текущую конфигурацию
export const currentEnv = getCurrentEnvironment();

// Функции для проверки окружения
export const isDevelopment = (): boolean => currentEnv.name === 'Development';
export const isStaging = (): boolean => currentEnv.name === 'Staging';
export const isProduction = (): boolean => currentEnv.name === 'Production';

// Функции для проверки возможностей
export const canUseDebugMenu = (): boolean => currentEnv.enableDebugMenu;
export const canUseHotReload = (): boolean => currentEnv.enableHotReload;
export const canUseFlipper = (): boolean => currentEnv.enableFlipper;
export const canUseReduxDevTools = (): boolean => currentEnv.enableReduxDevTools;
export const shouldMockApi = (): boolean => currentEnv.mockApi;

// Функция для получения API URL с учетом окружения
export const getApiUrl = (endpoint: string = ''): string => {
  const baseUrl = currentEnv.apiBaseUrl.endsWith('/') 
    ? currentEnv.apiBaseUrl.slice(0, -1) 
    : currentEnv.apiBaseUrl;
  
  const cleanEndpoint = endpoint.startsWith('/') 
    ? endpoint 
    : `/${endpoint}`;
    
  return `${baseUrl}${cleanEndpoint}`;
};

// Функция для логирования с учетом настроек окружения
export const log = (level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any) => {
  if (!currentEnv.enableLogging) return;
  
  const levels = ['debug', 'info', 'warn', 'error'];
  const currentLevelIndex = levels.indexOf(currentEnv.logLevel);
  const messageLevelIndex = levels.indexOf(level);
  
  if (messageLevelIndex >= currentLevelIndex) {
    console[level](`[${currentEnv.name}] ${message}`, data || '');
  }
};
