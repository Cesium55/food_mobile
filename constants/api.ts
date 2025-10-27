/**
 * API endpoints и настройки
 * Централизованное управление всеми API запросами
 */

import { getApiUrl } from './env';

// Базовые endpoints
export const API_ENDPOINTS = {
  // Аутентификация
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    PROFILE: '/auth',
    VERIFY_EMAIL: '/auth/verify-email',
    RESET_PASSWORD: '/auth/reset-password',
  },
  
  // Пользователи
  USERS: {
    BASE: '/users',
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
    CHANGE_PASSWORD: '/users/change-password',
  },
  
  // Продукты
  PRODUCTS: {
    BASE: '/products',
    SEARCH: '/products/search',
    BY_CATEGORY: '/products/category',
    BY_SELLER: '/products/seller',
    POPULAR: '/products/popular',
    RECOMMENDED: '/products/recommended',
  },
  
  // Продавцы
  SELLERS: {
    BASE: '/sellers',
    POPULAR: '/sellers/popular',
    NEARBY: '/sellers/nearby',
    BY_CATEGORY: '/sellers/category',
  },
  
  // Заказы
  ORDERS: {
    BASE: '/orders',
    CURRENT: '/orders/current',
    HISTORY: '/orders/history',
    CREATE: '/orders',
    UPDATE: '/orders',
    CANCEL: '/orders/cancel',
  },
  
  // Корзина
  CART: {
    BASE: '/cart',
    ADD_ITEM: '/cart/add',
    REMOVE_ITEM: '/cart/remove',
    UPDATE_ITEM: '/cart/update',
    CLEAR: '/cart/clear',
  },
  
  // Категории
  CATEGORIES: {
    BASE: '/categories',
    TREE: '/categories/tree',
  },
  
  // Поиск
  SEARCH: {
    BASE: '/search',
    SUGGESTIONS: '/search/suggestions',
    HISTORY: '/search/history',
  },
} as const;

// Функция для получения полного URL endpoint'а
export const getEndpointUrl = (endpoint: string): string => {
  return getApiUrl(endpoint);
};

// Функция для создания URL с параметрами
export const createUrlWithParams = (endpoint: string, params: Record<string, string | number>): string => {
  const url = new URL(getApiUrl(endpoint));
  
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, String(value));
  });
  
  return url.toString();
};

// Функция для создания URL с query параметрами
export const createQueryUrl = (endpoint: string, query: Record<string, any>): string => {
  const url = new URL(getApiUrl(endpoint));
  
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, String(value));
    }
  });
  
  return url.toString();
};

// HTTP методы
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
} as const;

// Статусы ответов
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Типы контента
export const CONTENT_TYPES = {
  JSON: 'application/json',
  FORM_DATA: 'multipart/form-data',
  URL_ENCODED: 'application/x-www-form-urlencoded',
} as const;
