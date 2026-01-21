import { CartGroup, CartItem } from '@/hooks/useCart';
import { Offer } from '@/hooks/useOffers';
import { getCurrentPrice } from '@/utils/pricingUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

// Интерфейс для сериализации в AsyncStorage
interface CartItemStorage {
  id: number;
  offerId: number;
  productName: string;
  shopId: number;
  shopName: string;
  sellerId?: number;
  originalCost: string; // decimal формат
  currentCost: string | null; // decimal формат
  discount: number;
  quantity: number;
  expiresDate: string; // ISO string для сериализации
}

const CART_STORAGE_KEY = '@cart_items';
const SELECTED_ITEMS_STORAGE_KEY = '@cart_selected_items'; // Сохранение выбранных товаров
const ORDER_CACHE_KEY = '@cached_order'; // Кэш заказа: { purchaseId, reservedItems: CartItem[] }

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
            sellerId: item.sellerId, // Сохраняем sellerId при загрузке
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

interface CachedOrder {
  purchaseId: number;
  reservedItems: CartItem[];
  selectedItemIds?: number[]; // Сохраняем ID выбранных товаров
}

interface CartContextType {
  cartItems: CartItem[];
  isLoading: boolean;
  selectedItems: Set<number>; // Set of item IDs that are selected
  getCartByShops: () => CartGroup[];
  getTotalAmount: () => number;
  getTotalAmountSelected: () => number; // Сумма только выбранных товаров
  getTotalItems: () => number;
  getShopsCount: () => number;
  addToCart: (offer: Offer) => void;
  increaseQuantity: (itemId: number, maxQuantity?: number) => void;
  decreaseQuantity: (itemId: number) => void;
  removeItem: (itemId: number) => void;
  clearCart: () => Promise<void>;
  toggleItemSelection: (itemId: number) => void;
  selectAllItems: () => void;
  deselectAllItems: () => void;
  cacheOrder: (purchaseId: number, items: CartItem[]) => Promise<void>;
  getCachedOrder: () => Promise<CachedOrder | null>;
  clearCachedOrder: () => Promise<void>;
  restoreItemsFromOrder: (items: CartItem[]) => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Загружаем корзину при инициализации
  useEffect(() => {
    const loadCart = async () => {
      setIsLoading(true);
      console.log('[CartContext] Начало загрузки корзины');
      
      const loadedItems = await loadCartFromStorage();
      console.log('[CartContext] Загружено товаров:', loadedItems.length);
      setCartItems(loadedItems);
      
      // Загружаем сохраненные выбранные товары
      const loadedSelectedItems = await loadSelectedItems();
      
      // Фильтруем выбранные товары - оставляем только те, которые есть в корзине
      const validSelectedItems = new Set<number>();
      loadedItems.forEach(item => {
        if (loadedSelectedItems.has(item.id)) {
          validSelectedItems.add(item.id);
        }
      });
      
      console.log('[CartContext] Восстановлено выбранных товаров:', validSelectedItems.size, 'из', loadedSelectedItems.size);
      setSelectedItems(validSelectedItems);
      
      setIsLoading(false);
      console.log('[CartContext] Загрузка корзины завершена');
    };
    
    loadCart();
  }, []);

  // Сохраняем корзину при каждом изменении
  useEffect(() => {
    if (!isLoading) {
      saveCartToStorage(cartItems);
    }
  }, [cartItems, isLoading]);

  // Сохраняем выбранные товары при каждом изменении
  useEffect(() => {
    if (!isLoading) {
      const saveSelectedItems = async () => {
        try {
          const selectedIds = Array.from(selectedItems);
          await AsyncStorage.setItem(SELECTED_ITEMS_STORAGE_KEY, JSON.stringify(selectedIds));
          console.log('[CartContext] Сохранены выбранные товары:', selectedIds);
        } catch (error) {
          console.error('[CartContext] Ошибка сохранения выбранных товаров:', error);
        }
      };
      saveSelectedItems();
    }
  }, [selectedItems, isLoading]);

  // Загружаем выбранные товары при инициализации
  const loadSelectedItems = async (): Promise<Set<number>> => {
    try {
      const storedData = await AsyncStorage.getItem(SELECTED_ITEMS_STORAGE_KEY);
      if (!storedData) {
        console.log('[CartContext] Нет сохраненных выбранных товаров');
        return new Set();
      }
      
      const selectedIds: number[] = JSON.parse(storedData);
      if (!Array.isArray(selectedIds)) {
        console.log('[CartContext] Некорректные данные выбранных товаров');
        return new Set();
      }
      
      console.log('[CartContext] Загружены выбранные товары:', selectedIds);
      return new Set(selectedIds);
    } catch (error) {
      console.error('[CartContext] Ошибка загрузки выбранных товаров:', error);
      return new Set();
    }
  };

  // НЕ выбираем товары автоматически - только пользователь может управлять галочками

  // Группировка товаров по магазинам
  const getCartByShops = (): CartGroup[] => {
    const grouped = cartItems.reduce((acc, item) => {
      if (!acc[item.shopId]) {
        acc[item.shopId] = {
          shopId: item.shopId,
          shopName: item.shopName,
          shopAddress: shopAddresses[item.shopId] || '', // Пустая строка, адрес будет получен в компоненте
          items: [],
          total: 0,
        };
      }
      acc[item.shopId].items.push(item);
      const itemCost = item.currentCost ? parseFloat(item.currentCost) : 0;
      acc[item.shopId].total += itemCost * item.quantity;
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
        const updatedItems = prevItems.map(item =>
          item.id === existingItem.id
            ? { ...item, quantity: newQuantity }
            : item
        );
        
        // Автоматически выбираем товар при добавлении
        setSelectedItems(prev => {
          const newSet = new Set(prev);
          newSet.add(existingItem.id);
          return newSet;
        });
        
        return updatedItems;
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
        
        // Рассчитываем текущую цену с учетом динамического ценообразования
        const calculatedPrice = getCurrentPrice(offer);
        const finalPrice = calculatedPrice ?? offer.originalCost;
        
        const originalCostNum = parseFloat(offer.originalCost);
        const finalPriceNum = parseFloat(finalPrice);
        const finalDiscount = originalCostNum > 0 && finalPriceNum < originalCostNum
          ? Math.round(((originalCostNum - finalPriceNum) / originalCostNum) * 100)
          : 0;

        const newItemId = Date.now(); // Генерируем уникальный ID
        const newItem: CartItem = {
          id: newItemId,
          offerId: offer.id,
          productName: offer.productName,
          shopId: offer.shopId,
          shopName: offer.shopShortName || 'Магазин',
          sellerId: offer.sellerId,
          originalCost: offer.originalCost,
          currentCost: finalPrice,
          discount: finalDiscount,
          quantity: 1,
          expiresDate: expiresDate,
        };
        
        // Автоматически выбираем новый товар при добавлении
        setSelectedItems(prev => {
          const newSet = new Set(prev);
          newSet.add(newItemId);
          return newSet;
        });
        
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
    return cartItems.reduce((sum, item) => {
      const itemCost = item.currentCost ? parseFloat(item.currentCost) : 0;
      return sum + itemCost * item.quantity;
    }, 0);
  };

  // Сумма только выбранных товаров
  const getTotalAmountSelected = (): number => {
    return cartItems.reduce((sum, item) => {
      if (!selectedItems.has(item.id)) return sum;
      const itemCost = item.currentCost ? parseFloat(item.currentCost) : 0;
      return sum + itemCost * item.quantity;
    }, 0);
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
    console.log('[CartContext] Очистка корзины');
    setCartItems([]);
    setSelectedItems(new Set());
    await AsyncStorage.removeItem(CART_STORAGE_KEY);
    await AsyncStorage.removeItem(SELECTED_ITEMS_STORAGE_KEY);
  };

  // Переключить выбор товара
  const toggleItemSelection = (itemId: number) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // Выбрать все товары
  const selectAllItems = () => {
    setSelectedItems(new Set(cartItems.map(item => item.id)));
  };

  // Снять выбор со всех товаров
  const deselectAllItems = () => {
    setSelectedItems(new Set());
  };

  // Кэшировать заказ (изъять товары из корзины)
  const cacheOrder = async (purchaseId: number, items: CartItem[]) => {
    try {
      // Сохраняем состояние выбора ДО удаления товаров
      const selectedIds = Array.from(selectedItems).filter(id => 
        items.some(item => item.id === id)
      );
      
      const cacheData: CachedOrder = {
        purchaseId,
        reservedItems: items,
        selectedItemIds: selectedIds, // Сохраняем ID выбранных товаров
      };
      await AsyncStorage.setItem(ORDER_CACHE_KEY, JSON.stringify(cacheData));
      
      // Удаляем изъятые товары из корзины
      const itemIds = new Set(items.map(item => item.id));
      setCartItems(prev => prev.filter(item => !itemIds.has(item.id)));
      setSelectedItems(prev => {
        const newSet = new Set(prev);
        items.forEach(item => newSet.delete(item.id));
        return newSet;
      });
    } catch (error) {
      console.error('Ошибка кэширования заказа:', error);
    }
  };

  // Получить кэшированный заказ
  const getCachedOrder = async (): Promise<CachedOrder | null> => {
    try {
      const cachedData = await AsyncStorage.getItem(ORDER_CACHE_KEY);
      if (!cachedData) return null;
      return JSON.parse(cachedData) as CachedOrder;
    } catch (error) {
      console.error('Ошибка получения кэшированного заказа:', error);
      return null;
    }
  };

  // Очистить кэш заказа
  const clearCachedOrder = async () => {
    try {
      await AsyncStorage.removeItem(ORDER_CACHE_KEY);
    } catch (error) {
      console.error('Ошибка очистки кэша заказа:', error);
    }
  };

  // Восстановить товары из заказа в корзину
  const restoreItemsFromOrder = async (items: CartItem[]) => {
    if (!items || items.length === 0) return;
    
    // Получаем кэш заказа чтобы восстановить состояние выбора
    let selectedItemIds: number[] = [];
    try {
      const cachedData = await AsyncStorage.getItem(ORDER_CACHE_KEY);
      if (cachedData) {
        const cachedOrder: CachedOrder = JSON.parse(cachedData);
        selectedItemIds = cachedOrder.selectedItemIds || [];
      }
    } catch (error) {
      // Игнорируем ошибку
    }
    
    setCartItems(prev => {
      // Объединяем существующие товары с восстановленными, избегая дубликатов по offerId
      const existingOfferIds = new Set(prev.map(item => `${item.offerId}-${item.shopId}`));
      
      // Сохраняем маппинг старых ID к новым для сохранения состояния выбора
      const idMapping = new Map<number, number>();
      
      const newItems = items
        .filter(item => !existingOfferIds.has(`${item.offerId}-${item.shopId}`))
        .map(item => {
          // Убеждаемся, что expiresDate является Date объектом
          let expiresDate: Date;
          if (item.expiresDate instanceof Date && !isNaN(item.expiresDate.getTime())) {
            expiresDate = item.expiresDate;
          } else if (typeof item.expiresDate === 'string') {
            expiresDate = new Date(item.expiresDate);
            if (isNaN(expiresDate.getTime())) {
              expiresDate = new Date();
            }
          } else {
            expiresDate = new Date();
          }
          
          const oldId = item.id;
          const newId = Date.now() + Math.random(); // Генерируем новый ID для восстановленных товаров
          idMapping.set(oldId, newId);
          
          return {
            ...item,
            id: newId,
            expiresDate, // Используем нормализованный Date объект
          };
        });
      
      const restored = [...prev, ...newItems];
      
      // Восстанавливаем состояние выбора из кэша заказа
      setSelectedItems(prevSelected => {
        const newSelected = new Set(prevSelected);
        // Восстанавливаем выбор для товаров которые были выбраны
        items.forEach(item => {
          if (selectedItemIds.includes(item.id)) {
            const newId = idMapping.get(item.id);
            if (newId) {
              newSelected.add(newId);
            }
          }
        });
        return newSelected;
      });
      
      return restored;
    });
  };

  const value: CartContextType = {
    cartItems,
    isLoading,
    selectedItems,
    getCartByShops,
    getTotalAmount,
    getTotalAmountSelected,
    getTotalItems,
    getShopsCount,
    addToCart,
    increaseQuantity,
    decreaseQuantity,
    removeItem,
    clearCart,
    toggleItemSelection,
    selectAllItems,
    deselectAllItems,
    cacheOrder,
    getCachedOrder,
    clearCachedOrder,
    restoreItemsFromOrder,
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

