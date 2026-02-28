import { API_ENDPOINTS } from '@/constants/api';
import { getApiUrl } from '@/constants/env';
import { authFetch } from '@/utils/authFetch';

// Типы для запроса создания заказа
export interface CreateOrderRequest {
  offers: Array<{
    offer_id: number;
    quantity: number;
  }>;
}

// Типы для ответа сервера
export interface PurchaseOffer {
  offer_id: number;
  quantity: number;
  cost_at_purchase: string; // decimal формат
  offer: {
    id: number;
    product_id: number;
    shop_id: number;
    expires_date: string | null;
    original_cost: string; // decimal формат
    current_cost: string; // decimal формат
    count: number;
    reserved_count: number;
    product?: {
      id: number;
      name: string;
      description?: string;
      article?: string | null;
      code?: string | null;
    };
  };
}

export interface Purchase {
  id: number;
  user_id: number;
  status: string;
  total_cost: string; // decimal формат
  created_at: string;
  updated_at: string;
  purchase_offers: PurchaseOffer[];
  ttl: number; // Время бронирования в секундах
}

export type SellerPurchaseStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type SellerPurchaseFulfillmentStatus = 'fulfilled' | 'not_fulfilled' | 'unprocessed' | null;

export interface SellerPurchaseOffer {
  offer_id: number;
  quantity: number;
  cost_at_purchase: string;
  fulfillment_status: SellerPurchaseFulfillmentStatus;
  fulfilled_quantity: number | null;
  fulfilled_by_seller_id: number | null;
  unfulfilled_reason: string | null;
  offer?: {
    id?: number;
    product_id?: number;
    shop_id?: number;
    expires_date?: string | null;
    original_cost?: string;
    current_cost?: string;
    count?: number;
    reserved_count?: number;
    product?: {
      id?: number;
      name?: string;
      description?: string;
      article?: string | null;
      code?: string | null;
    };
  } | null;
}

export interface SellerPurchase {
  id: number;
  user_id: number;
  status: SellerPurchaseStatus;
  total_cost: string;
  created_at: string;
  updated_at: string;
  purchase_offers: SellerPurchaseOffer[];
  offer_results?: OfferResult[];
  ttl: number;
}

export interface SellerPurchasesPagination {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface SellerPurchasesResponse {
  items: SellerPurchase[];
  pagination: SellerPurchasesPagination;
}

export interface GetSellerPurchasesParams {
  page?: number;
  page_size?: number;
  status?: SellerPurchaseStatus;
  fulfillment_status?: Exclude<SellerPurchaseFulfillmentStatus, null>;
  min_created_at?: string;
  max_created_at?: string;
  min_updated_at?: string;
  max_updated_at?: string;
}

export interface OfferResult {
  offer_id: number;
  status: 'success' | 'not_found' | 'insufficient_quantity' | 'expired';
  requested_quantity: number;
  processed_quantity?: number;
  available_quantity?: number;
  message: string;
}

export interface CreateOrderResponse {
  purchase: Purchase;
  offer_results: OfferResult[];
  total_processed: number;
  total_failed: number;
}

/**
 * Получает текущий pending платеж
 * @returns Promise с данными текущего pending платежа или null, если его нет
 */
export async function getCurrentPendingPurchase(): Promise<CreateOrderResponse | null> {
  try {
    const response = await authFetch(getApiUrl(API_ENDPOINTS.PURCHASES.CURRENT_PENDING), {
      method: 'GET',
      requireAuth: true,
    });

    if (response.status === 404) {
      // Нет текущего pending платежа
      return null;
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ошибка получения текущего платежа: ${response.status} ${errorText}`);
    }

    const responseData = await response.json();
    
    // Извлекаем данные из обертки {data: {}}
    const rawData = responseData.data || responseData;
    
    // Проверяем наличие обязательных полей
    // Поддерживаем обе структуры: с вложенным purchase и без (для обратной совместимости)
    const purchaseData = rawData.purchase || rawData;
    
    if (!purchaseData || !purchaseData.id) {
      return null;
    }
    
    // Преобразуем структуру ответа в формат CreateOrderResponse (такая же обработка как в createOrderFromCart)
    const purchase: Purchase = {
      id: purchaseData.id,
      user_id: purchaseData.user_id,
      status: purchaseData.status,
      total_cost: purchaseData.total_cost,
      created_at: purchaseData.created_at,
      updated_at: purchaseData.updated_at,
      purchase_offers: purchaseData.purchase_offers || [],
      ttl: purchaseData.ttl || 300,
    };
    
    const data: CreateOrderResponse = {
      purchase,
      offer_results: rawData.offer_results || [],
      total_processed: rawData.total_processed || (rawData.offer_results?.length || 0),
      total_failed: rawData.total_failed || 0,
    };
    
    return data;
  } catch (error) {
    return null;
  }
}

/**
 * Создает заказ из корзины
 * @param offers - Массив оферов с количеством
 * @returns Promise с данными созданного заказа
 * @throws Error с кодом 409, если уже есть pending платеж
 */
export async function createOrderFromCart(
  offers: Array<{ offer_id: number; quantity: number }>
): Promise<CreateOrderResponse> {
  const requestBody: CreateOrderRequest = { offers };

  const response = await authFetch(getApiUrl(API_ENDPOINTS.PURCHASES.CREATE_WITH_PARTIAL_SUCCESS), {
    method: 'POST',
    requireAuth: true,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (response.status === 409) {
    // Уже есть pending платеж
    const error = new Error('Уже есть неоплаченный заказ');
    (error as any).status = 409;
    throw error;
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ошибка создания заказа: ${response.status} ${errorText}`);
  }

  const responseData = await response.json();
  
  // Извлекаем данные из обертки {data: {}}
  const rawData = responseData.data || responseData;
  
  // Проверяем наличие обязательных полей
  // Поддерживаем обе структуры: с вложенным purchase и без (для обратной совместимости)
  const purchaseData = rawData.purchase || rawData;
  
  if (!purchaseData || !purchaseData.id) {
    throw new Error('Неверный формат ответа от сервера');
  }
  
  // Преобразуем структуру ответа в формат CreateOrderResponse (такая же обработка как в getCurrentPendingPurchase)
  const purchase: Purchase = {
    id: purchaseData.id,
    user_id: purchaseData.user_id,
    status: purchaseData.status,
    total_cost: purchaseData.total_cost,
    created_at: purchaseData.created_at,
    updated_at: purchaseData.updated_at,
    purchase_offers: purchaseData.purchase_offers || [],
    ttl: purchaseData.ttl || 300,
  };
  
  const data: CreateOrderResponse = {
    purchase,
    offer_results: rawData.offer_results || [],
    total_processed: rawData.total_processed || (rawData.offer_results?.length || 0),
    total_failed: rawData.total_failed || 0,
  };
  
  return data;
}

/**
 * Обновляет статус покупки
 * @param purchaseId - ID покупки для обновления
 * @param status - Новый статус покупки
 * @returns Promise с обновленными данными покупки
 * @throws Error если обновление не удалось
 */
export async function updatePurchaseStatus(
  purchaseId: number,
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
): Promise<Purchase> {
  const response = await authFetch(
    getApiUrl(`${API_ENDPOINTS.PURCHASES.BASE}/${purchaseId}`),
    {
      method: 'PATCH',
      requireAuth: true,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    }
  );

  if (response.status === 404) {
    throw new Error('Покупка не найдена');
  }

  if (response.status === 403) {
    throw new Error('Нет доступа к этой покупке');
  }

  if (response.status === 400) {
    const errorText = await response.text();
    throw new Error(`Неверный статус: ${errorText}`);
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ошибка обновления статуса покупки: ${response.status} ${errorText}`);
  }

  const responseData = await response.json();
  const rawData = responseData.data || responseData;
  
  const purchase: Purchase = {
    id: rawData.id,
    user_id: rawData.user_id,
    status: rawData.status,
    total_cost: rawData.total_cost,
    created_at: rawData.created_at,
    updated_at: rawData.updated_at,
    purchase_offers: rawData.purchase_offers || [],
    ttl: rawData.ttl || 300,
  };

  return purchase;
}

/**
 * Получает покупку по ID
 * @param purchaseId - ID покупки
 * @returns Promise с данными покупки
 */
export async function getPurchaseById(purchaseId: number): Promise<Purchase> {
  try {
    const response = await authFetch(
      getApiUrl(`${API_ENDPOINTS.PURCHASES.BASE}/${purchaseId}`),
      {
        method: 'GET',
        requireAuth: true,
      }
    );

    if (response.status === 404) {
      throw new Error('Покупка не найдена');
    }

    if (response.status === 403) {
      throw new Error('Нет доступа к этой покупке');
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ошибка получения покупки: ${response.status} ${errorText}`);
    }

    const responseData = await response.json();
    const rawData = responseData.data || responseData;
    
    const purchase: Purchase = {
      id: rawData.id,
      user_id: rawData.user_id,
      status: rawData.status,
      total_cost: rawData.total_cost,
      created_at: rawData.created_at,
      updated_at: rawData.updated_at,
      purchase_offers: rawData.purchase_offers || [],
      ttl: rawData.ttl || 0,
    };

    return purchase;
  } catch (error) {
    throw error;
  }
}

/**
 * Получает список покупок пользователя с фильтром по статусу
 * @param status - Фильтр по статусу (опционально)
 * @returns Promise с массивом покупок
 */
export async function getPurchasesByStatus(status?: string): Promise<CreateOrderResponse[]> {
  try {
    let url = getApiUrl(API_ENDPOINTS.PURCHASES.LIST);
    if (status) {
      url += `?status=${encodeURIComponent(status)}`;
    }
    
    const response = await authFetch(url, {
      method: 'GET',
      requireAuth: true,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ошибка получения истории заказов: ${response.status} ${errorText}`);
    }

    const responseData = await response.json();
    const rawData = responseData.data || responseData;
    
    // Если это массив, обрабатываем каждый элемент
    if (Array.isArray(rawData)) {
      return rawData.map((item: any) => {
        const purchaseData = item.purchase || item;
        const purchase: Purchase = {
          id: purchaseData.id,
          user_id: purchaseData.user_id,
          status: purchaseData.status,
          total_cost: purchaseData.total_cost,
          created_at: purchaseData.created_at,
          updated_at: purchaseData.updated_at,
          purchase_offers: purchaseData.purchase_offers || [],
          ttl: purchaseData.ttl || 300,
        };
        
        return {
          purchase,
          offer_results: item.offer_results || [],
          total_processed: item.total_processed || (item.offer_results?.length || 0),
          total_failed: item.total_failed || 0,
        };
      });
    }
    
    return [];
  } catch (error) {
    throw error;
  }
}

/**
 * Получает список всех покупок пользователя (история заказов)
 * @returns Promise с массивом покупок
 */
export async function getPurchasesHistory(): Promise<CreateOrderResponse[]> {
  return getPurchasesByStatus();
}

/**
 * Получает покупки текущего авторизованного продавца
 * @param params - Параметры пагинации и фильтрации
 * @returns Promise с покупками и метаданными пагинации
 */
export async function getSellerPurchases(
  params: GetSellerPurchasesParams = {}
): Promise<SellerPurchasesResponse> {
  const query = new URLSearchParams();

  if (params.page !== undefined) query.append('page', String(params.page));
  if (params.page_size !== undefined) query.append('page_size', String(params.page_size));
  if (params.status !== undefined) query.append('status', params.status);
  if (params.fulfillment_status !== undefined) {
    query.append('fulfillment_status', params.fulfillment_status);
  }
  if (params.min_created_at) query.append('min_created_at', params.min_created_at);
  if (params.max_created_at) query.append('max_created_at', params.max_created_at);
  if (params.min_updated_at) query.append('min_updated_at', params.min_updated_at);
  if (params.max_updated_at) query.append('max_updated_at', params.max_updated_at);

  const endpoint = API_ENDPOINTS.PURCHASES.SELLER_LIST;
  const url = query.toString() ? `${getApiUrl(endpoint)}?${query.toString()}` : getApiUrl(endpoint);

  const response = await authFetch(url, {
    method: 'GET',
    requireAuth: true,
  });

  if (response.status === 401 || response.status === 403) {
    throw new Error('Нет доступа к покупкам продавца');
  }

  if (response.status === 400) {
    const errorText = await response.text();
    throw new Error(`Неверные параметры фильтрации: ${errorText}`);
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ошибка загрузки покупок продавца: ${response.status} ${errorText}`);
  }

  const responseData = await response.json();
  const rawItems = Array.isArray(responseData.data) ? responseData.data : [];
  const rawPagination = responseData.pagination || {};

  const items: SellerPurchase[] = rawItems.map((item: any) => ({
    id: item.id,
    user_id: item.user_id,
    status: item.status,
    total_cost: item.total_cost,
    created_at: item.created_at,
    updated_at: item.updated_at,
    purchase_offers: Array.isArray(item.purchase_offers) ? item.purchase_offers : [],
    offer_results: Array.isArray(item.offer_results) ? item.offer_results : [],
    ttl: item.ttl ?? 0,
  }));

  return {
    items,
    pagination: {
      page: rawPagination.page ?? params.page ?? 1,
      page_size: rawPagination.page_size ?? params.page_size ?? 20,
      total_items: rawPagination.total_items ?? items.length,
      total_pages: rawPagination.total_pages ?? 1,
      has_next: Boolean(rawPagination.has_next),
      has_previous: Boolean(rawPagination.has_previous),
    },
  };
}

// Типы для верификации токена и выдачи заказа
export interface VerifyTokenItem {
  purchase_offer_id: number;
  offer_id: number;
  quantity: number;
  fulfilled_quantity: number;
  fulfillment_status: string;
  product_name: string;
  shop_point_id: number;
  cost_at_purchase: string; // decimal формат
}

export interface VerifyTokenResponse {
  purchase_id: number;
  status: string;
  items: VerifyTokenItem[];
  total_cost: string; // decimal формат
}

export interface FulfillItemRequest {
  purchase_offer_id: number;
  offer_id: number;
  status: 'fulfilled' | 'partially_fulfilled' | 'unfulfilled';
  fulfilled_quantity: number;
  unfulfilled_reason?: string;
}

export interface FulfilledItem {
  purchase_offer_id: number;
  offer_id: number;
  status: 'fulfilled' | 'partially_fulfilled' | 'unfulfilled';
  fulfilled_quantity: number;
  unfulfilled_reason?: string;
}

export interface FulfillPurchaseRequest {
  items: FulfillItemRequest[];
}

export interface FulfillPurchaseResponse {
  fulfilled_items: FulfilledItem[];
}

/**
 * Проверяет токен QR-кода и возвращает данные заказа для выдачи
 * @param token - Токен из QR-кода
 * @returns Promise с данными заказа для выдачи
 * @throws Error если токен невалиден или заказ не найден
 */
export async function verifyToken(token: string): Promise<VerifyTokenResponse> {
  const response = await authFetch(
    getApiUrl(API_ENDPOINTS.PURCHASES.VERIFY_TOKEN),
    {
      method: 'POST',
      requireAuth: true,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    }
  );

  if (response.status === 404) {
    throw new Error('Заказ не найден');
  }

  if (response.status === 400) {
    const errorText = await response.text();
    throw new Error(`Неверный токен: ${errorText}`);
  }

  if (response.status === 403) {
    throw new Error('Нет доступа к этому заказу');
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ошибка проверки токена: ${response.status} ${errorText}`);
  }

  const responseData = await response.json();
  const rawData = responseData.data || responseData;

  return {
    purchase_id: rawData.purchase_id || rawData.purchaseId,
    status: rawData.status,
    items: rawData.items || [],
    total_cost: rawData.total_cost || rawData.totalCost || '0.00',
  };
}

/**
 * Подтверждает выдачу товаров заказа
 * @param purchaseId - ID заказа
 * @param data - Данные о выдаче товаров
 * @returns Promise с результатом выдачи
 * @throws Error если выдача не удалась
 */
export async function fulfillPurchase(
  purchaseId: number,
  data: FulfillPurchaseRequest
): Promise<FulfillPurchaseResponse> {
  const response = await authFetch(
    getApiUrl(API_ENDPOINTS.PURCHASES.FULFILL(purchaseId)),
    {
      method: 'POST',
      requireAuth: true,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }
  );

  if (response.status === 404) {
    throw new Error('Заказ не найден');
  }

  if (response.status === 403) {
    throw new Error('Нет доступа к этому заказу');
  }

  if (response.status === 400) {
    const errorText = await response.text();
    throw new Error(`Неверные данные выдачи: ${errorText}`);
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ошибка выдачи заказа: ${response.status} ${errorText}`);
  }

  const responseData = await response.json();
  const rawData = responseData.data || responseData;

  return {
    fulfilled_items: rawData.fulfilled_items || rawData.fulfilledItems || [],
  };
}
