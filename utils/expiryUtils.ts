/**
 * Утилиты для работы со сроком годности товаров
 */

/**
 * Вычисляет количество дней до истечения срока годности
 * @param expiresDate - Дата истечения срока годности (строка или Date)
 * @returns Количество дней (может быть отрицательным, если срок истек)
 */
export function getDaysUntilExpiry(expiresDate: string | Date): number {
  const now = new Date();
  const expiryDate = typeof expiresDate === 'string' ? new Date(expiresDate) : expiresDate;
  
  // Вычисляем разницу в миллисекундах
  const diffMs = expiryDate.getTime() - now.getTime();
  
  // Конвертируем в дни с округлением вверх (Math.ceil)
  // Это означает, что даже если осталось 1.1 дня, показываем 2 дня
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  return days;
}

/**
 * Вычисляет количество часов до истечения срока годности
 * @param expiresDate - Дата истечения срока годности (строка или Date)
 * @returns Количество часов (может быть отрицательным, если срок истек)
 */
export function getHoursUntilExpiry(expiresDate: string | Date): number {
  const now = new Date();
  const expiryDate = typeof expiresDate === 'string' ? new Date(expiresDate) : expiresDate;
  
  // Вычисляем разницу в миллисекундах
  const diffMs = expiryDate.getTime() - now.getTime();
  
  // Конвертируем в часы с округлением вниз (Math.floor)
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  
  return hours;
}

/**
 * Получает текстовое представление срока годности
 * Показывает дни, если осталось больше 1 дня, иначе показывает время в формате ЧЧ:ММ:СС
 * @param expiresDate - Дата истечения срока годности (строка или Date)
 * @returns Текст с количеством дней или время в формате ЧЧ:ММ:СС
 */
export function getExpiryText(expiresDate: string | Date): string {
  const now = new Date();
  const expiryDate = typeof expiresDate === 'string' ? new Date(expiresDate) : expiresDate;
  
  // Вычисляем разницу в миллисекундах
  const diffMs = expiryDate.getTime() - now.getTime();
  
  // Если срок истек
  if (diffMs <= 0) {
    return 'Просрочен';
  }
  
  // Вычисляем дни
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  if (days > 1) {
    // Показываем дни, если осталось больше 1 дня
    const daysWord = getDaysWord(days);
    return `${days} ${daysWord}`;
  } else {
    // Если осталось меньше суток, показываем время в формате ЧЧ:ММ:СС
    const totalSeconds = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    // Форматируем с ведущими нулями
    const formattedHours = hours.toString().padStart(2, '0');
    const formattedMinutes = minutes.toString().padStart(2, '0');
    const formattedSeconds = seconds.toString().padStart(2, '0');
    
    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
  }
}

/**
 * Получает правильное склонение слова "день"
 * @param days - Количество дней
 * @returns Склоненное слово "день", "дня" или "дней"
 */
export function getDaysWord(days: number): string {
  const absDays = Math.abs(days);
  if (absDays === 1) return 'день';
  if (absDays >= 2 && absDays <= 4) return 'дня';
  return 'дней';
}

/**
 * Получает правильное склонение слова "час"
 * @param hours - Количество часов
 * @returns Склоненное слово "час", "часа" или "часов"
 */
export function getHoursWord(hours: number): string {
  const absHours = Math.abs(hours);
  if (absHours === 1) return 'час';
  if (absHours >= 2 && absHours <= 4) return 'часа';
  return 'часов';
}

/**
 * Получает цветовую схему для срока годности
 * @param daysUntilExpiry - Количество дней до истечения
 * @returns Объект с цветами фона и текста
 */
export function getExpiryColors(daysUntilExpiry: number): { bg: string; text: string } {
  if (daysUntilExpiry < 0) {
    return { bg: '#F5F5F5', text: '#999' }; // Просрочен
  }
  if (daysUntilExpiry >= 7) {
    return { bg: '#E8F5E9', text: '#4CAF50' }; // Зеленый (>7 дней)
  }
  if (daysUntilExpiry >= 3) {
    return { bg: '#FFF3E0', text: '#F57C00' }; // Оранжевый (3-6 дней)
  }
  return { bg: '#FFEBEE', text: '#F44336' }; // Красный (<3 дней)
}
