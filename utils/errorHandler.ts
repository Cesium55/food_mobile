/**
 * Утилиты для обработки ошибок API
 */

export interface FieldError {
  field: string;
  message: string;
}

export interface ApiError {
  message: string;
  fieldErrors?: FieldError[];
  code?: number;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
}

/**
 * Обрабатывает ответ API и возвращает структурированные данные
 */
export const processAuthResponse = (response: any): {
  success: boolean;
  data?: AuthResponse;
  error?: ApiError;
} => {
  const status = response.status;
  
  // Успешный ответ (200-299)
  if (status >= 200 && status < 300) {
    const data = response.data;
    
    // Проверяем разные возможные структуры ответа
    if (data && data.access_token && data.refresh_token) {
      return {
        success: true,
        data: {
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        },
      };
    }
    
    // Проверяем, может быть токены в data.data
    if (data && data.data && data.data.access_token && data.data.refresh_token) {
      return {
        success: true,
        data: {
          access_token: data.data.access_token,
          refresh_token: data.data.refresh_token,
        },
      };
    }
    
    // Проверяем, может быть токены в корне ответа
    if (data && data.token && data.refreshToken) {
      return {
        success: true,
        data: {
          access_token: data.token,
          refresh_token: data.refreshToken,
        },
      };
    }
    
    // Проверяем, может быть токены в других полях
    if (data && data.accessToken && data.refreshToken) {
      return {
        success: true,
        data: {
          access_token: data.accessToken,
          refresh_token: data.refreshToken,
        },
      };
    }
    
    // Проверяем, может быть токены в других полях
    if (data && data.access_token && data.refreshToken) {
      return {
        success: true,
        data: {
          access_token: data.access_token,
          refresh_token: data.refreshToken,
        },
      };
    }
    
    // Проверяем, может быть токены в других полях
    if (data && data.token && data.refresh_token) {
      return {
        success: true,
        data: {
          access_token: data.token,
          refresh_token: data.refresh_token,
        },
      };
    }
    
    // Если ничего не найдено
    return {
      success: false,
      error: {
        message: `Неверный формат ответа сервера. Ожидались access_token и refresh_token, получено: ${JSON.stringify(data)}`,
        code: status,
      },
    };
  }
  
  // Ошибка 400 - пользователь уже существует (для регистрации)
  if (status === 400) {
    return {
      success: false,
      error: {
        message: 'Пользователь с таким email уже существует',
        code: status,
      },
    };
  }
  
  // Ошибка 401 - неверный email/пароль (для логина)
  if (status === 401) {
    return {
      success: false,
      error: {
        message: 'Неверный email или пароль',
        code: status,
      },
    };
  }
  
  // Ошибка 422 - ошибки валидации FastAPI
  if (status === 422) {
    const data = response.data;
    const fieldErrors: FieldError[] = [];
    
    if (data && data.detail && Array.isArray(data.detail)) {
      data.detail.forEach((error: any) => {
        if (error.loc && error.loc.length > 1) {
          const field = error.loc[1]; // Поле из FastAPI ошибки
          fieldErrors.push({
            field: field,
            message: error.msg || 'Ошибка валидации',
          });
        }
      });
    }
    
    return {
      success: false,
      error: {
        message: 'Ошибки валидации данных',
        fieldErrors: fieldErrors,
        code: status,
      },
    };
  }
  
  // Все остальные ошибки
  return {
    success: false,
    error: {
      message: response.data?.message || response.statusText || 'Неизвестная ошибка',
      code: status,
    },
  };
};

/**
 * Получает ошибку для конкретного поля
 */
export const getFieldError = (fieldErrors: FieldError[] | undefined, fieldName: string): string | null => {
  if (!fieldErrors) return null;
  
  const fieldError = fieldErrors.find(error => error.field === fieldName);
  return fieldError ? fieldError.message : null;
};

/**
 * Получает общую ошибку (не связанную с полями)
 */
export const getGeneralError = (fieldErrors: FieldError[] | undefined): string | null => {
  if (!fieldErrors || fieldErrors.length === 0) return null;
  
  // Если есть ошибки полей, показываем общее сообщение
  return 'Проверьте правильность заполнения полей';
};
