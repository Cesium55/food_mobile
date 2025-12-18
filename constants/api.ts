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
    VERIFY_PHONE: '/auth/verify-phone',
    RESEND_VERIFICATION_CODE: '/auth/resend-verification-code',
    RESET_PASSWORD: '/auth/reset-password',
    FIREBASE_TOKEN: '/auth/firebase-token',
    LAST_LOCATION: '/auth/last-location',
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
    UPLOAD_IMAGE: (productId: number) => `/products/${productId}/images`,
    UPLOAD_IMAGES_BATCH: (productId: number) => `/products/${productId}/images/batch`,
    DELETE_IMAGE: (imageId: number) => `/products/images/${imageId}`,
  },
  
  // Продавцы
  SELLERS: {
    BASE: '/sellers',
    POPULAR: '/sellers/popular',
    NEARBY: '/sellers/nearby',
    BY_CATEGORY: '/sellers/category',
    UPLOAD_IMAGE: (sellerId: number) => `/sellers/${sellerId}/images`,
    UPLOAD_IMAGES_BATCH: (sellerId: number) => `/sellers/${sellerId}/images/batch`,
    DELETE_IMAGE: (imageId: number) => `/sellers/images/${imageId}`,
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
  
  // Покупки (Purchases)
  PURCHASES: {
    BASE: '/purchases',
    CREATE_WITH_PARTIAL_SUCCESS: '/purchases/with-partial-success',
    CURRENT_PENDING: '/purchases/current-pending',
    LIST: '/purchases',
    TOKEN: (purchaseId: number) => `/purchases/${purchaseId}/token`,
    VERIFY_TOKEN: '/purchases/verify-token',
    FULFILL: (purchaseId: number) => `/purchases/${purchaseId}/fulfill`,
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
    BASE: '/product-categories',
    TREE: '/product-categories/tree',
  },
  
  // Поиск
  SEARCH: {
    BASE: '/search',
    SUGGESTIONS: '/search/suggestions',
    HISTORY: '/search/history',
  },
  
  // Торговые точки
  SHOP_POINTS: {
    BASE: '/shop-points',
    CREATE_BY_ADDRESS: '/shop-points/by-address',
  },
  
  // Предложения (офферы)
  OFFERS: {
    BASE: '/offers',
    WITH_PRODUCTS: '/offers/with-products',
    PRICING_STRATEGIES: '/offers/pricing-strategies',
    PRICING_STRATEGY_BY_ID: (id: number) => `/offers/pricing-strategies/${id}`,
    UPDATE: (id: number) => `/offers/${id}`,
  },
  
  // Платежи
  PAYMENTS: {
    BASE: '/payments',
    BY_ID: (id: number) => `/payments/${id}`,
    BY_PURCHASE_ID: (purchaseId: number) => `/payments/purchase/${purchaseId}`,
    CHECK: (id: number) => `/payments/${id}/check`,
    CANCEL: (id: number) => `/payments/${id}/cancel`,
    STATUS: (id: number) => `/payments/${id}/status`,
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
