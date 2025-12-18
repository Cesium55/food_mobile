# Pricing Strategies API

Документация по API для работы со стратегиями динамического ценообразования.

## Получение стратегий

### GET `/offers/pricing-strategies`

Получить список всех стратегий ценообразования с их шагами.

**Ответ:**
```json
[
  {
    "id": 1,
    "name": "Последняя неделя",
    "steps": [
      {
        "id": 1,
        "strategy_id": 1,
        "time_remaining_seconds": 604800,
        "discount_percent": 30.0
      },
      {
        "id": 2,
        "strategy_id": 1,
        "time_remaining_seconds": 518400,
        "discount_percent": 40.0
      }
      // ... остальные шаги
    ]
  }
]
```

### GET `/offers/pricing-strategies/{strategy_id}`

Получить конкретную стратегию по ID с её шагами.

**Параметры:**
- `strategy_id` (path, int) - ID стратегии

**Ответ:**
```json
{
  "id": 1,
  "name": "Последняя неделя",
  "steps": [
    {
      "id": 1,
      "strategy_id": 1,
      "time_remaining_seconds": 604800,
      "discount_percent": 30.0
    }
    // ... остальные шаги
  ]
}
```

**Ошибки:**
- `404` - Стратегия не найдена

## Работа с офферами

### Создание оффера со стратегией

### POST `/offers`

Создать новый оффер с возможностью указания стратегии ценообразования.

**Тело запроса:**
```json
{
  "product_id": 1,
  "shop_id": 1,
  "pricing_strategy_id": 1,
  "original_cost": 100.0,
  "current_cost": null,
  "count": 10,
  "expires_date": "2024-12-31T23:59:59Z"
}
```

**Валидация:**
- Нельзя одновременно указать `pricing_strategy_id` и `current_cost`
- Если указана стратегия, `current_cost` должен быть `null` (цена будет рассчитываться динамически)
- Если указана фиксированная цена, `pricing_strategy_id` должен быть `null`

**Поля:**
- `product_id` (required, int) - ID продукта
- `shop_id` (required, int) - ID точки продажи
- `pricing_strategy_id` (optional, int) - ID стратегии ценообразования
- `original_cost` (optional, float) - Исходная стоимость
- `current_cost` (optional, float) - Текущая стоимость (нельзя указывать вместе со стратегией)
- `count` (optional, int) - Количество товара
- `expires_date` (optional, datetime) - Дата истечения срока годности

**Ошибки:**
- `400` - Валидационная ошибка (конфликт стратегии и цены, неверные данные)
- `404` - Продукт, точка продажи или стратегия не найдены

### Обновление оффера

### PUT `/offers/{offer_id}`

Обновить оффер, включая изменение или отключение стратегии ценообразования.

**Тело запроса (установка стратегии):**
```json
{
  "pricing_strategy_id": 2
}
```

**Тело запроса (отключение стратегии):**
```json
{
  "pricing_strategy_id": null
}
```

**Тело запроса (установка фиксированной цены):**
```json
{
  "current_cost": 80.0,
  "pricing_strategy_id": null
}
```

**Валидация:**
- Нельзя одновременно указать `pricing_strategy_id` и `current_cost`
- Можно обновить только указанные поля (остальные останутся без изменений)

**Поля:**
- `pricing_strategy_id` (optional, int | null) - ID стратегии или `null` для отключения
- `current_cost` (optional, float) - Текущая стоимость
- `original_cost` (optional, float) - Исходная стоимость
- `count` (optional, int) - Количество товара
- `expires_date` (optional, datetime) - Дата истечения срока годности

**Ошибки:**
- `400` - Валидационная ошибка (конфликт стратегии и цены)
- `404` - Оффер или стратегия не найдены

## Структура данных

### PricingStrategy

```json
{
  "id": 1,
  "name": "Последняя неделя",
  "steps": [
    {
      "id": 1,
      "strategy_id": 1,
      "time_remaining_seconds": 604800,
      "discount_percent": 30.0
    }
  ]
}
```

### PricingStrategyStep

```json
{
  "id": 1,
  "strategy_id": 1,
  "time_remaining_seconds": 604800,
  "discount_percent": 30.0
}
```

**Поля:**
- `id` (int) - Уникальный идентификатор шага
- `strategy_id` (int) - ID стратегии
- `time_remaining_seconds` (int) - Время до истечения срока в секундах
- `discount_percent` (float) - Процент скидки (0-100)

## Примеры использования

### Пример 1: Создание оффера с динамическим ценообразованием

```bash
POST /offers
{
  "product_id": 1,
  "shop_id": 1,
  "pricing_strategy_id": 1,
  "original_cost": 100.0,
  "count": 10,
  "expires_date": "2024-12-31T23:59:59Z"
}
```

Цена будет автоматически рассчитываться на основе стратегии и времени до истечения срока.

### Пример 2: Переключение с фиксированной цены на стратегию

```bash
PUT /offers/1
{
  "pricing_strategy_id": 1,
  "current_cost": null
}
```

### Пример 3: Отключение стратегии и установка фиксированной цены

```bash
PUT /offers/1
{
  "pricing_strategy_id": null,
  "current_cost": 80.0
}
```

## Примечания

- Стратегии применяются автоматически на основе времени до истечения срока (`expires_date`)
- Шаги стратегии должны быть отсортированы по `time_remaining_seconds` (от большего к меньшему)
- Если `pricing_strategy_id` равен `null`, динамическое ценообразование отключено
- При использовании стратегии поле `current_cost` должно быть `null` - цена рассчитывается динамически
