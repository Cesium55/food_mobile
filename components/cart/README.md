# Cart Components

Компоненты корзины с расширяемой системой статусов товаров.

## Структура

```
components/cart/
├── CartItem.tsx       - Отдельный товар в корзине
├── CartSummary.tsx    - Сводка корзины (сумма, кол-во товаров)
├── EmptyCart.tsx      - Пустая корзина
├── ShopGroup.tsx      - Группа товаров по магазину
├── types.ts           - Типы и валидаторы статусов
└── index.ts           - Экспорт всех компонентов
```

## Расширяемая система статусов товаров

### Как это работает

Система основана на **валидаторах** (`ItemStatusValidator`) - функциях, которые проверяют состояние товара и возвращают `ItemStatus`:

```typescript
interface ItemStatus {
  isInactive: boolean;        // Товар неактивен (серый + кнопка удаления)
  inactiveReason?: string;    // Причина неактивности
  statusColor?: string;       // Цвет для визуализации
}
```

### Встроенные валидаторы

#### `expiredItemValidator`
Проверяет просроченные товары (срок годности < текущей даты).

```typescript
import { expiredItemValidator } from '@/components/cart/types';
```

#### `lowStockValidator`
Шаблон для проверки остатков на складе (можно реализовать позже).

### Создание своего валидатора

```typescript
import { ItemStatusValidator, CartItem } from '@/components/cart/types';

// Пример: товары, которых нет в наличии
export const outOfStockValidator: ItemStatusValidator = (item: CartItem) => {
  // Проверяем наличие (нужно добавить поле в CartItem)
  if (item.stock === 0) {
    return {
      isInactive: true,
      inactiveReason: 'Товара нет в наличии',
    };
  }
  return { isInactive: false };
};

// Пример: товары со слишком большой скидкой (подозрительные)
export const suspiciousDiscountValidator: ItemStatusValidator = (item: CartItem) => {
  if (item.discount > 80) {
    return {
      isInactive: true,
      inactiveReason: 'Товар снят с продажи',
    };
  }
  return { isInactive: false };
};
```

### Использование валидаторов

В `cart.tsx` добавьте свои валидаторы в массив:

```typescript
const statusValidators = [
  expiredItemValidator,
  outOfStockValidator,        // ваш валидатор
  suspiciousDiscountValidator, // еще один
];
```

Валидаторы проверяются **по порядку**. Первый найденный неактивный статус будет применен к товару.

## Визуальное представление неактивных товаров

- ✅ Серый фон и уменьшенная прозрачность
- ✅ Серая иконка товара
- ✅ Серый текст
- ✅ Предупреждение с причиной неактивности
- ✅ Кнопка "🗑️ Удалить" вместо кнопок количества

## Примеры использования

### Базовое использование
```typescript
import { ShopGroup } from '@/components/cart';
import { expiredItemValidator } from '@/components/cart/types';

<ShopGroup
  group={cartGroup}
  statusValidators={[expiredItemValidator]}
  onIncrease={increaseQuantity}
  onDecrease={decreaseQuantity}
  onRemove={removeItem}
/>
```

### С несколькими валидаторами
```typescript
const statusValidators = [
  expiredItemValidator,
  outOfStockValidator,
  suspiciousDiscountValidator,
];

{cartByShops.map((group) => (
  <ShopGroup
    key={group.shopId}
    group={group}
    statusValidators={statusValidators}
    onIncrease={increaseQuantity}
    onDecrease={decreaseQuantity}
    onRemove={removeItem}
  />
))}
```

### Комбинированная проверка
Если нужно проверить ВСЕ валидаторы и объединить результаты:

```typescript
import { combineValidators } from '@/components/cart/types';

const status = combineValidators(item, [
  expiredItemValidator,
  outOfStockValidator,
]);
```

## Добавление новых полей в CartItem

Если вам нужны дополнительные данные для валидаторов, добавьте их в `CartItem`:

```typescript
// hooks/useCart.ts
export interface CartItem {
  id: number;
  offerId: number;
  productName: string;
  shopId: number;
  shopName: string;
  originalCost: number;
  currentCost: number;
  discount: number;
  quantity: number;
  expiresDate: Date;
  stock?: number;        // Новое поле: остаток на складе
  isAvailable?: boolean; // Новое поле: доступность
}
```

Теперь эти поля будут доступны в валидаторах.

