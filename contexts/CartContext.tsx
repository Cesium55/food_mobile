import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Offer } from '@/hooks/useOffers';
import { CartItem, CartGroup } from '@/hooks/useCart';

// Интерфейс для сериализации в AsyncStorage
interface CartItemStorage {
  id: number;
  offerId: number;
  productName: string;
  shopId: number;
  shopName: string;
  originalCost: number;
  currentCost: number;
  discount: number;
  quantity: number;
  expiresDate: string; // ISO string для сериализации
}

const CART_STORAGE_KEY = '@cart_items';

// Временный маппинг адресов магазинов (можно расширить через API)
const shopAddresses: { [key: number]: string } = {
  1: 'ул. Ленина, 45',
  2: 'пр. Мира, 12',
  3: 'ул. Пушкина, 23',
  4: 'ул. Гагарина, 8',
};

// Функции для работы с AsyncStorage
const saveCartToStorage = async (items: CartItem[]): Promise<void> => {
  try {
    if (!items || items.length === 0) {
      await AsyncStorage.removeItem(CART_STORAGE_KEY);
      return;
    }

    const itemsToStore: CartItemStorage[] = items.map(item => {
      // Проверяем, что expiresDate является валидным Date объектом
      let expiresDateString: string;
      if (item.expiresDate instanceof Date && !isNaN(item.expiresDate.getTime())) {
        expiresDateString = item.expiresDate.toISOString();
      } else if (typeof item.expiresDate === 'string') {
        expiresDateString = item.expiresDate;
      } else {
        expiresDateString = new Date().toISOString();
      }

      return {
        ...item,
        expiresDate: expiresDateString,
      };
    });
    
    await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(itemsToStore));
  } catch {
    // Ошибка сохранения корзины
  }
};

const loadCartFromStorage = async (): Promise<CartItem[]> => {
  try {
    const storedData = await AsyncStorage.getItem(CART_STORAGE_KEY);
    if (!storedData) {
      return [];
    }
    
    const itemsFromStorage: CartItemStorage[] = JSON.parse(storedData);
    
    if (!Array.isArray(itemsFromStorage)) {
      await AsyncStorage.removeItem(CART_STORAGE_KEY);
      return [];
    }
    
    const items: CartItem[] = itemsFromStorage
      .map(item => {
        try {
          // Проверяем, что expiresDate существует
          if (!item.expiresDate) {
            return {
              ...item,
              expiresDate: new Date(),
            };
          }
          
          // Конвертируем в Date объект
          const date = item.expiresDate instanceof Date 
            ? item.expiresDate 
            : new Date(item.expiresDate);
          
          if (isNaN(date.getTime())) {
            return {
              ...item,
              expiresDate: new Date(),
            };
          }
          
          return {
            ...item,
            expiresDate: date,
          };
        } catch {
          return {
            ...item,
            expiresDate: new Date(),
          };
        }
      })
      .filter((item): item is CartItem => item !== null);
    
    return items;
  } catch {
    try {
      await AsyncStorage.removeItem(CART_STORAGE_KEY);
    } catch {
      // Ошибка при очистке поврежденных данных
    }
    return [];
  }
};

interface CartContextType {
  cartItems: CartItem[];
  isLoading: boolean;
  getCartByShops: () => CartGroup[];
  getTotalAmount: () => number;
  getTotalItems: () => number;
  getShopsCount: () => number;
  addToCart: (offer: Offer) => void;
  increaseQuantity: (itemId: number, maxQuantity?: number) => void;
  decreaseQuantity: (itemId: number) => void;
  removeItem: (itemId: number) => void;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Загружаем корзину при инициализации
  useEffect(() => {
    const loadCart = async () => {
      setIsLoading(true);
      const loadedItems = await loadCartFromStorage();
      setCartItems(loadedItems);
      setIsLoading(false);
    };
    
    loadCart();
  }, []);

  // Сохраняем корзину при каждом изменении
  useEffect(() => {
    if (!isLoading) {
      saveCartToStorage(cartItems);
    }
  }, [cartItems, isLoading]);

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
    setCartItems(prevItems => {
      // Проверяем, есть ли уже такой товар в корзине
      const existingItem = prevItems.find(item => item.offerId === offer.id);
      
      if (existingItem) {
        // Если товар уже есть, увеличиваем количество (но не больше доступного количества)
        const newQuantity = Math.min(existingItem.quantity + 1, offer.count);
        return prevItems.map(item =>
          item.id === existingItem.id
            ? { ...item, quantity: newQuantity }
            : item
        );
      } else {
        // Если товара нет, добавляем новый
        // Безопасно конвертируем expiresDate в Date объект
        let expiresDate: Date;
        if (offer.expiresDate instanceof Date) {
          expiresDate = offer.expiresDate;
        } else if (typeof offer.expiresDate === 'string') {
          expiresDate = new Date(offer.expiresDate);
        } else {
          expiresDate = new Date();
        }
        
        // Проверяем валидность даты
        if (isNaN(expiresDate.getTime())) {
          expiresDate = new Date();
        }
        
        const newItem: CartItem = {
          id: Date.now(), // Генерируем уникальный ID
          offerId: offer.id,
          productName: offer.productName,
          shopId: offer.shopId,
          shopName: offer.shopShortName || 'Магазин',
          originalCost: offer.originalCost,
          currentCost: offer.currentCost,
          discount: offer.discount,
          quantity: 1,
          expiresDate: expiresDate,
        };
        return [...prevItems, newItem];
      }
    });
  };

  // Увеличить количество товара
  const increaseQuantity = (itemId: number, maxQuantity?: number) => {
    setCartItems(prevItems =>
      prevItems.map(item => {
        if (item.id === itemId) {
          const newQuantity = maxQuantity 
            ? Math.min(item.quantity + 1, maxQuantity)
            : item.quantity + 1;
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
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

  // Очистить корзину
  const clearCart = async () => {
    setCartItems([]);
    await AsyncStorage.removeItem(CART_STORAGE_KEY);
  };

  const value: CartContextType = {
    cartItems,
    isLoading,
    getCartByShops,
    getTotalAmount,
    getTotalItems,
    getShopsCount,
    addToCart,
    increaseQuantity,
    decreaseQuantity,
    removeItem,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

