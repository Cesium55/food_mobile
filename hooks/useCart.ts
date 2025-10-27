import { useState } from 'react';
import { Offer } from './useOffers';

export interface CartItem {
  id: number;
  offerId: number; // product_entry.id
  productName: string;
  shopId: number;
  shopName: string;
  originalCost: number; // Цена без скидки
  currentCost: number; // Цена со скидкой
  discount: number; // Процент скидки
  quantity: number;
  expiresDate: Date;
}

export interface CartGroup {
  shopId: number;
  shopName: string;
  shopAddress: string;
  items: CartItem[];
  total: number;
}

const shopAddresses: { [key: number]: string } = {
  1: 'ул. Ленина, 45',
  2: 'пр. Мира, 12',
  3: 'ул. Пушкина, 23',
  4: 'ул. Гагарина, 8',
};

export const useCart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([
    // Магазин 1: Продукты
    {
      id: 1,
      offerId: 1,
      productName: 'Молоко пастеризованное 3.2%',
      shopId: 1,
      shopName: 'Продукты',
      originalCost: 89.90,
      currentCost: 69.90,
      discount: 22,
      quantity: 2,
      expiresDate: new Date('2025-10-25'),
    },
    {
      id: 2,
      offerId: 12,
      productName: 'Кефир 2.5%',
      shopId: 1,
      shopName: 'Продукты',
      originalCost: 75.00,
      currentCost: 59.00,
      discount: 21,
      quantity: 1,
      expiresDate: new Date('2025-10-26'),
    },
    {
      id: 3,
      offerId: 17,
      productName: 'Масло сливочное 82.5%',
      shopId: 1,
      shopName: 'Продукты',
      originalCost: 280.00,
      currentCost: 240.00,
      discount: 14,
      quantity: 1,
      expiresDate: new Date('2025-11-05'),
    },
    
    // Магазин 2: Хлебопекарня
    {
      id: 4,
      offerId: 2,
      productName: 'Хлеб Бородинский',
      shopId: 2,
      shopName: 'Хлебопекарня',
      originalCost: 65.00,
      currentCost: 45.00,
      discount: 31,
      quantity: 2,
      expiresDate: new Date('2025-10-23'),
    },
    {
      id: 5,
      offerId: 13,
      productName: 'Круассан с шоколадом',
      shopId: 2,
      shopName: 'Хлебопекарня',
      originalCost: 85.00,
      currentCost: 55.00,
      discount: 35,
      quantity: 3,
      expiresDate: new Date('2025-10-22'),
    },
    {
      id: 9,
      offerId: 14,
      productName: 'Батон нарезной (просрочен)',
      shopId: 2,
      shopName: 'Хлебопекарня',
      originalCost: 45.00,
      currentCost: 20.00,
      discount: 56,
      quantity: 2,
      expiresDate: new Date('2025-10-20'), // Просрочен вчера
    },
    
    // Магазин 3: Мясная лавка
    {
      id: 6,
      offerId: 3,
      productName: 'Куриная грудка охлажденная',
      shopId: 3,
      shopName: 'Мясная лавка',
      originalCost: 450.00,
      currentCost: 380.00,
      discount: 16,
      quantity: 1,
      expiresDate: new Date('2025-10-24'),
    },
    
    // Магазин 4: Молочка
    {
      id: 7,
      offerId: 4,
      productName: 'Йогурт натуральный',
      shopId: 4,
      shopName: 'Молочка',
      originalCost: 120.00,
      currentCost: 95.00,
      discount: 21,
      quantity: 4,
      expiresDate: new Date('2025-10-28'),
    },
    {
      id: 8,
      offerId: 6,
      productName: 'Сыр Российский',
      shopId: 4,
      shopName: 'Молочка',
      originalCost: 650.00,
      currentCost: 550.00,
      discount: 15,
      quantity: 1,
      expiresDate: new Date('2025-11-01'),
    },
  ]);

  // Группировка товаров по магазинам
  const getCartByShops = (): CartGroup[] => {
    const grouped = cartItems.reduce((acc, item) => {
      if (!acc[item.shopId]) {
        acc[item.shopId] = {
          shopId: item.shopId,
          shopName: item.shopName,
          shopAddress: shopAddresses[item.shopId] || 'Адрес не указан',
          items: [],
          total: 0,
        };
      }
      acc[item.shopId].items.push(item);
      acc[item.shopId].total += item.currentCost * item.quantity;
      return acc;
    }, {} as { [key: number]: CartGroup });

    return Object.values(grouped);
  };

  // Добавить товар в корзину
  const addToCart = (offer: Offer) => {
    const newItem: CartItem = {
      id: Date.now(), // Генерируем уникальный ID
      offerId: offer.id,
      productName: offer.productName,
      shopId: offer.shopId,
      shopName: offer.shopShortName,
      originalCost: offer.originalCost,
      currentCost: offer.currentCost,
      discount: offer.discount,
      quantity: 1,
      expiresDate: offer.expiresDate,
    };
    setCartItems(prevItems => [...prevItems, newItem]);
  };

  // Увеличить количество товара
  const increaseQuantity = (itemId: number) => {
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  // Уменьшить количество товара
  const decreaseQuantity = (itemId: number) => {
    setCartItems(prevItems =>
      prevItems
        .map(item =>
          item.id === itemId ? { ...item, quantity: Math.max(0, item.quantity - 1) } : item
        )
        .filter(item => item.quantity > 0) // Удаляем товары с количеством 0
    );
  };

  // Удалить товар из корзины
  const removeItem = (itemId: number) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));
  };

  // Общая сумма корзины
  const getTotalAmount = (): number => {
    return cartItems.reduce((sum, item) => sum + item.currentCost * item.quantity, 0);
  };

  // Общее количество товаров
  const getTotalItems = (): number => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  };

  // Количество магазинов
  const getShopsCount = (): number => {
    const uniqueShops = new Set(cartItems.map(item => item.shopId));
    return uniqueShops.size;
  };

  return {
    cartItems,
    getCartByShops,
    getTotalAmount,
    getTotalItems,
    getShopsCount,
    addToCart,
    increaseQuantity,
    decreaseQuantity,
    removeItem,
  };
};

