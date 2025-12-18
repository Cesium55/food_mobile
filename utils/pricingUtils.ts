import { Offer } from '@/hooks/useOffers';

/**
 * Вычисляет цену на основе стратегии ценообразования и времени до истечения срока годности
 * @param offer - Оффер с информацией о стратегии и сроке годности
 * @returns Рассчитанная цена (строка decimal) или null если стратегия отсутствует или срок истек
 */
export function calculateDynamicPrice(offer: Offer): string | null {
  // Если нет динамического ценообразования или нет стратегии, возвращаем текущую цену
  if (!offer.isDynamicPricing || !offer.pricingStrategy) {
    console.log('calculateDynamicPrice: No strategy', {
      offerId: offer.id,
      isDynamicPricing: offer.isDynamicPricing,
      hasStrategy: !!offer.pricingStrategy,
      pricingStrategyId: offer.pricingStrategyId,
    });
    return offer.currentCost;
  }

  // Проверяем, что есть шаги стратегии
  if (!offer.pricingStrategy.steps || offer.pricingStrategy.steps.length === 0) {
    console.warn('calculateDynamicPrice: No steps in strategy', {
      offerId: offer.id,
      strategyId: offer.pricingStrategy.id,
      strategyName: offer.pricingStrategy.name,
    });
    // Если нет шагов, возвращаем оригинальную цену
    return offer.originalCost;
  }
  
  // Парсим originalCost как число для расчетов
  const originalCostNum = parseFloat(offer.originalCost);

  // Вычисляем сколько секунд осталось до истечения срока годности
  const now = new Date();
  let expiryDate: Date;
  
  try {
    // Парсим дату, учитывая что она может быть в формате ISO или просто дата без времени
    const dateString = offer.expiresDate;
    
    // Если дата в формате "YYYY-MM-DD", добавляем время конца дня в UTC
    if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      // Добавляем время конца дня (23:59:59) в локальном времени
      expiryDate = new Date(dateString + 'T23:59:59');
    } else {
      expiryDate = new Date(dateString);
    }
    
    // Проверяем валидность даты
    if (isNaN(expiryDate.getTime())) {
      console.warn('Invalid expiresDate:', offer.expiresDate, 'Parsed as:', expiryDate);
      return offer.originalCost;
    }
  } catch (error) {
    console.warn('Error parsing expiresDate:', offer.expiresDate, error);
    return offer.originalCost;
  }

  const timeRemainingSeconds = Math.floor((expiryDate.getTime() - now.getTime()) / 1000);
  
  // Отладочная информация
  if (timeRemainingSeconds < 0 && timeRemainingSeconds > -3600) {
    console.log('Price calculation debug:', {
      offerId: offer.id,
      expiresDate: offer.expiresDate,
      expiryDateParsed: expiryDate.toISOString(),
      now: now.toISOString(),
      timeRemainingSeconds,
      hoursRemaining: (timeRemainingSeconds / 3600).toFixed(2),
    });
  }

  // Если срок истек (более чем на 1 минуту), возвращаем null
  // Даем небольшой запас в 60 секунд на случай небольших расхождений времени
  if (timeRemainingSeconds < -60) {
    console.warn('Offer expired:', {
      offerId: offer.id,
      expiresDate: offer.expiresDate,
      expiryDate: expiryDate.toISOString(),
      now: now.toISOString(),
      timeRemainingSeconds,
    });
    return null;
  }

  // Находим подходящий шаг стратегии
  // Шаги должны быть отсортированы по убыванию time_remaining_seconds
  const sortedSteps = [...offer.pricingStrategy.steps].sort(
    (a, b) => b.time_remaining_seconds - a.time_remaining_seconds
  );

  // Находим первый шаг, где time_remaining_seconds <= текущего времени
  // Это означает, что мы находимся в этом временном интервале
  const applicableStep = sortedSteps.find(
    step => timeRemainingSeconds >= step.time_remaining_seconds
  );

  // Отладочная информация о шагах
  console.log('calculateDynamicPrice: Steps info', {
    offerId: offer.id,
    timeRemainingSeconds,
    hoursRemaining: (timeRemainingSeconds / 3600).toFixed(2),
    steps: sortedSteps.map(s => ({
      time_remaining_seconds: s.time_remaining_seconds,
      hours: (s.time_remaining_seconds / 3600).toFixed(2),
      discount_percent: s.discount_percent,
      matches: timeRemainingSeconds >= s.time_remaining_seconds,
    })),
    applicableStep: applicableStep ? {
      time_remaining_seconds: applicableStep.time_remaining_seconds,
      discount_percent: applicableStep.discount_percent,
    } : null,
  });

  // Если подходящий шаг найден, применяем скидку
  if (applicableStep) {
    const discountPercent = applicableStep.discount_percent;
    const calculatedPrice = originalCostNum * (1 - discountPercent / 100);
    const calculatedPriceStr = Math.max(0, calculatedPrice).toFixed(2);
    console.log('calculateDynamicPrice: Calculated price', {
      offerId: offer.id,
      originalCost: offer.originalCost,
      discountPercent,
      calculatedPrice: calculatedPriceStr,
    });
    return calculatedPriceStr; // Возвращаем строку decimal
  }

  // Если нет подходящего шага (время меньше минимального шага), 
  // возвращаем цену с максимальной скидкой (последний шаг в отсортированном списке)
  // Это означает, что до истечения осталось очень мало времени, применяем максимальную скидку
  if (sortedSteps.length > 0 && timeRemainingSeconds > 0) {
    const maxDiscountStep = sortedSteps[sortedSteps.length - 1];
    const discountPercent = maxDiscountStep.discount_percent;
    const calculatedPrice = originalCostNum * (1 - discountPercent / 100);
    const calculatedPriceStr = Math.max(0, calculatedPrice).toFixed(2);
    console.log('calculateDynamicPrice: Using max discount', {
      offerId: offer.id,
      originalCost: offer.originalCost,
      discountPercent,
      calculatedPrice: calculatedPriceStr,
    });
    return calculatedPriceStr;
  }

  // Если время истекло или нет шагов, возвращаем оригинальную цену
  console.log('calculateDynamicPrice: Returning original cost', {
    offerId: offer.id,
    originalCost: offer.originalCost,
    timeRemainingSeconds,
  });
  return offer.originalCost;
}

/**
 * Получает текущую цену оффера с учетом динамического ценообразования
 * @param offer - Оффер
 * @returns Текущая цена (строка decimal, рассчитанная или фиксированная)
 */
export function getCurrentPrice(offer: Offer): string | null {
  console.log('getCurrentPrice called', {
    offerId: offer.id,
    isDynamicPricing: offer.isDynamicPricing,
    hasStrategy: !!offer.pricingStrategy,
    pricingStrategyId: offer.pricingStrategyId,
    currentCost: offer.currentCost,
    originalCost: offer.originalCost,
  });

  // Если используется динамическое ценообразование, рассчитываем цену
  if (offer.isDynamicPricing && offer.pricingStrategy) {
    const calculatedPrice = calculateDynamicPrice(offer);
    console.log('getCurrentPrice: Calculated dynamic price', {
      offerId: offer.id,
      calculatedPrice,
    });
    // Если расчет вернул null (товар просрочен), возвращаем null
    // Иначе возвращаем рассчитанную цену
    return calculatedPrice;
  }
  
  // Если динамическое ценообразование включено, но стратегия не загружена,
  // но есть currentCost от сервера, используем его
  if (offer.isDynamicPricing && offer.currentCost !== null) {
    console.log('getCurrentPrice: Using server currentCost', {
      offerId: offer.id,
      currentCost: offer.currentCost,
    });
    return offer.currentCost;
  }
  
  // Если динамическое ценообразование включено, но стратегия не загружена и currentCost null,
  // возвращаем originalCost (не null, чтобы не показывать "просрочен")
  if (offer.isDynamicPricing && offer.currentCost === null) {
    console.warn('getCurrentPrice: Dynamic pricing but no strategy and no currentCost', {
      offerId: offer.id,
      pricingStrategyId: offer.pricingStrategyId,
      originalCost: offer.originalCost,
    });
    return offer.originalCost;
  }
  
  // Для обычных офферов возвращаем currentCost
  // Если currentCost null, но есть originalCost, возвращаем originalCost
  if (offer.currentCost !== null) {
    return offer.currentCost;
  }
  
  // Если currentCost null, возвращаем originalCost как fallback
  return offer.originalCost;
}

/**
 * Проверяет, используется ли динамическое ценообразование
 * @param offer - Оффер
 * @returns true если используется динамическое ценообразование
 */
export function isDynamicPricing(offer: Offer): boolean {
  return offer.isDynamicPricing || false;
}
