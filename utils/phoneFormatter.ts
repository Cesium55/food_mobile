/**
 * Утилиты для форматирования телефонных номеров
 */

/**
 * Форматирует номер телефона в формат +7 (999) 123-45-67
 * @param phone - номер телефона (только цифры или с символами форматирования)
 * @returns отформатированный номер телефона
 */
export function formatPhoneNumber(phone: string): string {
  // Убираем все нецифровые символы, кроме +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Если номер начинается с 8, заменяем на +7
  let digits = cleaned.startsWith('8') ? cleaned.replace(/^8/, '7') : cleaned;
  
  // Если номер начинается с 7, добавляем +
  if (digits.startsWith('7') && !digits.startsWith('+7')) {
    digits = '+' + digits;
  } else if (!digits.startsWith('+') && digits.length > 0) {
    // Если номер не начинается с + и не с 7/8, добавляем +7
    digits = '+7' + digits;
  }
  
  // Убираем + для обработки
  const numbers = digits.replace(/[^\d]/g, '');
  
  // Если номер пустой, возвращаем пустую строку
  if (numbers.length === 0) {
    return '';
  }
  
  // Если номер начинается с 7, форматируем как российский
  if (numbers.startsWith('7')) {
    const rest = numbers.slice(1);
    
    if (rest.length === 0) {
      return '+7';
    } else if (rest.length <= 3) {
      return `+7 (${rest}`;
    } else if (rest.length <= 6) {
      return `+7 (${rest.slice(0, 3)}) ${rest.slice(3)}`;
    } else if (rest.length <= 8) {
      return `+7 (${rest.slice(0, 3)}) ${rest.slice(3, 6)}-${rest.slice(6)}`;
    } else {
      return `+7 (${rest.slice(0, 3)}) ${rest.slice(3, 6)}-${rest.slice(6, 8)}-${rest.slice(8, 10)}`;
    }
  }
  
  // Для других случаев возвращаем как есть (с + если был)
  return digits;
}

/**
 * Очищает номер телефона от форматирования, оставляя только цифры
 * @param phone - отформатированный номер телефона
 * @returns номер телефона только с цифрами
 */
export function cleanPhoneNumber(phone: string): string {
  // Убираем все нецифровые символы
  let cleaned = phone.replace(/[^\d]/g, '');
  
  // Если номер начинается с 8, заменяем на 7
  if (cleaned.startsWith('8')) {
    cleaned = '7' + cleaned.slice(1);
  }
  
  return cleaned;
}



