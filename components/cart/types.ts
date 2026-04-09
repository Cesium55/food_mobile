import { CartItem } from "@/hooks/useCart";

/**
 * Статус товара в корзине
 */
export interface ItemStatus {
  /** Флаг неактивности товара (будет серым и доступен для удаления) */
  isInactive: boolean;
  /** Причина неактивности для отображения пользователю */
  inactiveReason?: string;
  /** Цвет для отображения (если не указан, используется серый для неактивных) */
  statusColor?: string;
}

/**
 * Функция-валидатор для проверки статуса товара
 */
export type ItemStatusValidator = (item: CartItem) => ItemStatus;

/**
 * Проверка на просроченность товара
 */
export const expiredItemValidator: ItemStatusValidator = (item: CartItem): ItemStatus => {
  if (item.status === 'inactive') {
    return {
      isInactive: true,
      inactiveReason: 'Продукт недоступен',
    };
  }
  
  return { isInactive: false };
};

/**
 * Пример: Проверка на низкий остаток срока годности (можно добавить позже)
 */
export const lowStockValidator: ItemStatusValidator = (item: CartItem): ItemStatus => {
  // Здесь можно добавить логику проверки остатков на складе
  // Пример расширения функционала
  return { isInactive: false };
};

/**
 * Комбинированная проверка всех валидаторов
 * Возвращает первый неактивный статус или активный статус
 */
export const combineValidators = (
  item: CartItem,
  validators: ItemStatusValidator[]
): ItemStatus => {
  for (const validator of validators) {
    const status = validator(item);
    if (status.isInactive) {
      return status;
    }
  }
  return { isInactive: false };
};
