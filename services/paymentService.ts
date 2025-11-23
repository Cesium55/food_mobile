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


