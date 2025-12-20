/**
 * Сервис для верификации телефона
 * Использует authFetch для авторизованных запросов
 */

import { API_ENDPOINTS, HTTP_METHODS, HTTP_STATUS } from '@/constants/api';
import { getApiUrl } from '@/constants/env';
import { log } from '@/constants/config';
import { authFetch } from '@/utils/authFetch';
import { saveTokens } from '@/utils/storage';
import { processAuthResponse } from '@/utils/errorHandler';

export interface VerifyPhoneResponse {
  success: boolean;
  access_token?: string;
  refresh_token?: string;
  message?: string;
  error?: string;
}

/**
 * Верифицирует телефон по коду подтверждения
 * @param code - 6-значный код подтверждения
 * @returns Promise с результатом верификации и новыми токенами
 */
export async function verifyPhone(code: string): Promise<VerifyPhoneResponse> {
  try {
    log('info', 'Попытка верификации телефона', { code });
    
    const url = getApiUrl(API_ENDPOINTS.AUTH.VERIFY_PHONE);
    
    const response = await authFetch(url, {
      method: HTTP_METHODS.POST,
      requireAuth: true,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    const responseData = await response.json();

    if (response.ok) {
      // Обрабатываем ответ и сохраняем новые токены
      const result = processAuthResponse({
        status: response.status,
        statusText: response.statusText,
        data: responseData,
        headers: {},
        url: url,
        method: HTTP_METHODS.POST,
      });

      if (result.success && result.data) {
        // Сохраняем новые токены с обновленным статусом phone_verified
        await saveTokens(result.data.access_token, result.data.refresh_token);
        log('info', 'Телефон успешно верифицирован, токены обновлены');
        
        return {
          success: true,
          access_token: result.data.access_token,
          refresh_token: result.data.refresh_token,
          message: responseData.message || 'Телефон успешно верифицирован',
        };
      }

      return {
        success: false,
        error: 'Не удалось обработать ответ сервера',
      };
    }

    // Обрабатываем ошибку
    const errorMessage = responseData.message || responseData.error || 'Ошибка верификации телефона';
    log('warn', 'Ошибка верификации телефона', { 
      status: response.status,
      message: errorMessage 
    });

    return {
      success: false,
      error: errorMessage,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
    log('error', 'Ошибка при верификации телефона', { error: errorMessage });
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Запрашивает повторную отправку кода верификации
 * @returns Promise с результатом запроса
 */
export async function resendVerificationCode(): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    log('info', 'Запрос на повторную отправку кода верификации');
    
    const url = getApiUrl(API_ENDPOINTS.AUTH.RESEND_VERIFICATION_CODE);
    
    const response = await authFetch(url, {
      method: HTTP_METHODS.POST,
      requireAuth: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const responseData = await response.json();

    if (response.ok) {
      log('info', 'Код верификации успешно отправлен повторно');
      
      return {
        success: true,
        message: responseData.message || 'Код верификации отправлен повторно',
      };
    }

    // Обрабатываем ошибку
    const errorMessage = responseData.message || responseData.error || 'Ошибка повторной отправки кода';
    log('warn', 'Ошибка повторной отправки кода', { 
      status: response.status,
      message: errorMessage 
    });

    return {
      success: false,
      error: errorMessage,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
    log('error', 'Ошибка при повторной отправке кода', { error: errorMessage });
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}













