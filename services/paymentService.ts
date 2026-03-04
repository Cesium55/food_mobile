import { API_ENDPOINTS } from '@/constants/api';
import { getApiUrl } from '@/constants/env';
import { authFetch } from '@/utils/authFetch';

// Типы для платежей
export type PaymentStatus = 'pending' | 'waiting_for_capture' | 'succeeded' | 'canceled';

export interface Payment {
  id: number;
  purchase_id: number;
  status: PaymentStatus;
  amount: number;
  created_at: string;
  updated_at: string;
  yookassa_payment_id?: string;
}

export interface PaymentWithConfirmation extends Payment {
  confirmation_url?: string;
}

export interface SellerSystemBalance {
  seller_id: number;
  system_balance: string;
  issued_goods_balance: string;
  issued_goods_older_than_week_balance: string;
  currency: string;
}

export interface RefundByOfferResultItemRequest {
  purchase_offer_result_id: number;
  quantity: number;
}

export interface RefundByOfferResultsRequest {
  items: RefundByOfferResultItemRequest[];
  reason: string;
}

export interface RefundByOfferResultsResponse {
  refund: {
    id: number;
    payment_id: number;
    amount: string;
    currency: string;
    reason: string | null;
    yookassa_refund_id: string | null;
    created_at: string;
    updated_at: string;
  };
  purchase_id: number;
  seller_id: number;
  items: {
    purchase_offer_result_id: number;
    refunded_quantity: number;
    total_refunded_quantity: number;
    refundable_quantity_left: number;
  }[];
}

/**
 * Получает платеж по purchase_id
 * Платеж создается автоматически при создании заказа
 * @param purchaseId - ID заказа (Purchase)
 * @returns Promise с данными платежа
 */
export async function getPaymentByPurchaseId(purchaseId: number): Promise<PaymentWithConfirmation> {
  const response = await authFetch(
    getApiUrl(API_ENDPOINTS.PAYMENTS.BY_PURCHASE_ID(purchaseId)),
    {
      method: 'GET',
      requireAuth: true,
    }
  );

  if (response.status === 404) {
    throw new Error('Платеж не найден');
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ошибка получения платежа: ${response.status} ${errorText}`);
  }

  const responseData = await response.json();
  const rawData = responseData.data || responseData;

  const payment: PaymentWithConfirmation = {
    id: rawData.id,
    purchase_id: rawData.purchase_id,
    status: rawData.status,
    amount: rawData.amount,
    created_at: rawData.created_at,
    updated_at: rawData.updated_at,
    yookassa_payment_id: rawData.yookassa_payment_id,
    confirmation_url: rawData.confirmation_url,
  };

  return payment;
}

/**
 * Получает информацию о платеже
 * @param paymentId - ID платежа
 * @returns Promise с данными платежа
 */
export async function getPayment(paymentId: number): Promise<Payment> {
  const response = await authFetch(
    getApiUrl(API_ENDPOINTS.PAYMENTS.BY_ID(paymentId)),
    {
      method: 'GET',
      requireAuth: true,
    }
  );

  if (response.status === 404) {
    throw new Error('Платеж не найден');
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ошибка получения платежа: ${response.status} ${errorText}`);
  }

  const responseData = await response.json();
  const rawData = responseData.data || responseData;

  const payment: Payment = {
    id: rawData.id,
    purchase_id: rawData.purchase_id,
    status: rawData.status,
    amount: rawData.amount,
    created_at: rawData.created_at,
    updated_at: rawData.updated_at,
    yookassa_payment_id: rawData.yookassa_payment_id,
  };

  return payment;
}

/**
 * Вручную проверяет статус платежа в YooKassa и обновляет локально
 * @param paymentId - ID платежа
 * @returns Promise с обновленными данными платежа
 */
export async function checkPaymentStatus(paymentId: number): Promise<Payment> {
  const response = await authFetch(
    getApiUrl(API_ENDPOINTS.PAYMENTS.CHECK(paymentId)),
    {
      method: 'POST',
      requireAuth: true,
    }
  );

  if (response.status === 404) {
    throw new Error('Платеж не найден');
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ошибка проверки статуса платежа: ${response.status} ${errorText}`);
  }

  const responseData = await response.json();
  const rawData = responseData.data || responseData;

  const payment: Payment = {
    id: rawData.id,
    purchase_id: rawData.purchase_id,
    status: rawData.status,
    amount: rawData.amount,
    created_at: rawData.created_at,
    updated_at: rawData.updated_at,
    yookassa_payment_id: rawData.yookassa_payment_id,
  };

  return payment;
}

/**
 * Отменяет платеж
 * @param paymentId - ID платежа
 * @returns Promise с обновленными данными платежа
 */
export async function cancelPayment(paymentId: number): Promise<Payment> {
  const response = await authFetch(
    getApiUrl(API_ENDPOINTS.PAYMENTS.CANCEL(paymentId)),
    {
      method: 'POST',
      requireAuth: true,
    }
  );

  if (response.status === 404) {
    throw new Error('Платеж не найден');
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ошибка отмены платежа: ${response.status} ${errorText}`);
  }

  const responseData = await response.json();
  const rawData = responseData.data || responseData;

  const payment: Payment = {
    id: rawData.id,
    purchase_id: rawData.purchase_id,
    status: rawData.status,
    amount: rawData.amount,
    created_at: rawData.created_at,
    updated_at: rawData.updated_at,
    yookassa_payment_id: rawData.yookassa_payment_id,
  };

  return payment;
}

/**
 * Получает только статус платежа (без авторизации, для polling)
 * @param paymentId - ID платежа
 * @returns Promise со статусом платежа
 */
export async function getPaymentStatus(paymentId: number): Promise<PaymentStatus> {
  const response = await fetch(
    getApiUrl(API_ENDPOINTS.PAYMENTS.STATUS(paymentId)),
    {
      method: 'GET',
    }
  );

  if (response.status === 404) {
    throw new Error('Платеж не найден');
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ошибка получения статуса платежа: ${response.status} ${errorText}`);
  }

  const responseData = await response.json();
  const rawData = responseData.data || responseData;

  return rawData.status;
}

/**
 * Получает токен для заказа после оплаты
 * @param purchaseId - ID заказа (Purchase)
 * @returns Promise с токеном
 */
export async function getPurchaseToken(purchaseId: number): Promise<string> {
  const response = await authFetch(
    getApiUrl(API_ENDPOINTS.PURCHASES.TOKEN(purchaseId)),
    {
      method: 'POST',
      requireAuth: true,
    }
  );

  if (response.status === 404) {
    throw new Error('Заказ не найден');
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ошибка получения токена: ${response.status} ${errorText}`);
  }

  const responseData = await response.json();
  const token = responseData.data?.token || responseData.token;

  if (!token) {
    throw new Error('Токен не найден в ответе сервера');
  }

  return token;
}

/**
 * Делает частичный/полный возврат по результатам выдачи
 */
export async function refundByOfferResults(
  data: RefundByOfferResultsRequest
): Promise<RefundByOfferResultsResponse> {
  const response = await authFetch(
    getApiUrl(API_ENDPOINTS.PAYMENTS.REFUNDS_BY_OFFER_RESULTS),
    {
      method: 'POST',
      requireAuth: true,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }
  );

  if (response.status === 400) {
    const errorText = await response.text();
    throw new Error(`Неверные данные для возврата: ${errorText}`);
  }

  if (response.status === 403) {
    throw new Error('Нет доступа к выполнению возврата');
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ошибка выполнения возврата: ${response.status} ${errorText}`);
  }

  const responseData = await response.json();
  return responseData.data || responseData;
}

/**
 * Получает системный баланс текущего продавца
 */
export async function getSellerSystemBalance(): Promise<SellerSystemBalance> {
  const response = await authFetch(
    getApiUrl(API_ENDPOINTS.SELLERS.SYSTEM_BALANCE),
    {
      method: 'GET',
      requireAuth: true,
    }
  );

  if (response.status === 403) {
    throw new Error('Нет доступа к балансу продавца');
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ошибка загрузки баланса: ${response.status} ${errorText}`);
  }

  const responseData = await response.json();
  return responseData.data || responseData;
}
