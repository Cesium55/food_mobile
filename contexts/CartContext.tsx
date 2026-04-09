import { CartGroup, CartItem } from '@/hooks/useCart';
import { Offer } from '@/hooks/useOffers';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

interface CartItemStorage {
  offerId: number;
  status: 'active' | 'inactive';
  quantity: number;
}

const CART_STORAGE_KEY = '@cart_items';
const SELECTED_ITEMS_STORAGE_KEY = '@cart_selected_items';
const ORDER_CACHE_KEY = '@cached_order';

interface CachedOrder {
  purchaseId: number;
  reservedItems: CartItem[];
  selectedItemIds?: number[];
}

interface CartContextType {
  cartItems: CartItem[];
  isLoading: boolean;
  selectedItems: Set<number>;
  getCartByShops: () => CartGroup[];
  getTotalAmount: () => number;
  getTotalAmountSelected: () => number;
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
  refreshCart: (options?: { showLoading?: boolean; reset?: boolean }) => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const normalizeCartItem = (item: Partial<CartItemStorage> & { offerId?: number; quantity?: number }): CartItem | null => {
  if (typeof item.offerId !== 'number' || item.offerId <= 0) return null;
  const quantity = typeof item.quantity === 'number' && item.quantity > 0 ? Math.floor(item.quantity) : 1;
  const status = item.status === 'inactive' ? 'inactive' : 'active';

  return {
    id: item.offerId,
    offerId: item.offerId,
    status,
    quantity,
  };
};

const saveCartToStorage = async (items: CartItem[]): Promise<void> => {
  if (!items.length) {
    await AsyncStorage.removeItem(CART_STORAGE_KEY);
    return;
  }

  const data: CartItemStorage[] = items.map(item => ({
    offerId: item.offerId,
    status: item.status,
    quantity: item.quantity,
  }));

  await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(data));
};

const loadCartFromStorage = async (): Promise<CartItem[]> => {
  try {
    const raw = await AsyncStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      await AsyncStorage.removeItem(CART_STORAGE_KEY);
      return [];
    }

    return parsed
      .map((item: any) => normalizeCartItem(item))
      .filter((item: CartItem | null): item is CartItem => item !== null);
  } catch {
    return [];
  }
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  const loadSelectedItems = useCallback(async (): Promise<Set<number>> => {
    try {
      const raw = await AsyncStorage.getItem(SELECTED_ITEMS_STORAGE_KEY);
      if (!raw) return new Set();
      const ids = JSON.parse(raw);
      if (!Array.isArray(ids)) return new Set();
      return new Set(ids.filter((id: unknown) => typeof id === 'number'));
    } catch {
      return new Set();
    }
  }, []);

  const refreshCart = useCallback(async (options?: { showLoading?: boolean; reset?: boolean }) => {
    const showLoading = options?.showLoading ?? false;
    const reset = options?.reset ?? false;

    if (showLoading) setIsLoading(true);
    if (reset) {
      setCartItems([]);
      setSelectedItems(new Set());
    }

    const loadedItems = await loadCartFromStorage();
    const loadedSelected = await loadSelectedItems();

    setCartItems(loadedItems);
    setSelectedItems(new Set(loadedItems.map(item => item.offerId).filter(id => loadedSelected.has(id))));

    if (showLoading) setIsLoading(false);
  }, [loadSelectedItems]);

  useEffect(() => {
    refreshCart({ showLoading: true });
  }, [refreshCart]);

  useEffect(() => {
    if (!isLoading) {
      saveCartToStorage(cartItems).catch(() => undefined);
    }
  }, [cartItems, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      AsyncStorage.setItem(SELECTED_ITEMS_STORAGE_KEY, JSON.stringify(Array.from(selectedItems))).catch(() => undefined);
    }
  }, [selectedItems, isLoading]);

  const getCartByShops = (): CartGroup[] => {
    return [{
      shopId: 0,
      shopName: 'Корзина',
      shopAddress: '',
      items: cartItems,
      total: 0,
    }];
  };

  const getTotalAmount = (): number => 0;
  const getTotalAmountSelected = (): number => 0;
  const getTotalItems = (): number => cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const getShopsCount = (): number => 0;

  const addToCart = (offer: Offer) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.offerId === offer.id);
      if (existing) {
        const max = Number.isFinite(offer.count) ? offer.count : undefined;
        const nextQuantity = max !== undefined ? Math.min(existing.quantity + 1, max) : existing.quantity + 1;
        return prev.map(item => item.offerId === offer.id ? { ...item, quantity: nextQuantity } : item);
      }

      const next: CartItem = {
        id: offer.id,
        offerId: offer.id,
        status: 'active',
        quantity: 1,
      };
      return [...prev, next];
    });

    setSelectedItems(prev => {
      const next = new Set(prev);
      next.add(offer.id);
      return next;
    });
  };

  const increaseQuantity = (itemId: number, maxQuantity?: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.offerId !== itemId) return item;
      const nextQuantity = maxQuantity !== undefined ? Math.min(item.quantity + 1, maxQuantity) : item.quantity + 1;
      return { ...item, quantity: nextQuantity };
    }));
  };

  const decreaseQuantity = (itemId: number) => {
    setCartItems(prev =>
      prev
        .map(item => item.offerId === itemId ? { ...item, quantity: Math.max(0, item.quantity - 1) } : item)
        .filter(item => item.quantity > 0)
    );
    setSelectedItems(prev => {
      const next = new Set(prev);
      const item = cartItems.find(ci => ci.offerId === itemId);
      if (item && item.quantity <= 1) next.delete(itemId);
      return next;
    });
  };

  const removeItem = (itemId: number) => {
    setCartItems(prev => prev.filter(item => item.offerId !== itemId));
    setSelectedItems(prev => {
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });
  };

  const clearCart = async () => {
    setCartItems([]);
    setSelectedItems(new Set());
    await AsyncStorage.removeItem(CART_STORAGE_KEY);
    await AsyncStorage.removeItem(SELECTED_ITEMS_STORAGE_KEY);
  };

  const toggleItemSelection = (itemId: number) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const selectAllItems = () => setSelectedItems(new Set(cartItems.map(item => item.offerId)));
  const deselectAllItems = () => setSelectedItems(new Set());

  const cacheOrder = useCallback(async (purchaseId: number, items: CartItem[]) => {
    const selectedIds = Array.from(selectedItems).filter(id => items.some(item => item.offerId === id));
    const cacheData: CachedOrder = {
      purchaseId,
      reservedItems: items,
      selectedItemIds: selectedIds,
    };

    await AsyncStorage.setItem(ORDER_CACHE_KEY, JSON.stringify(cacheData));

    const removedIds = new Set(items.map(item => item.offerId));
    setCartItems(prev => prev.filter(item => !removedIds.has(item.offerId)));
    setSelectedItems(prev => {
      const next = new Set(prev);
      removedIds.forEach(id => next.delete(id));
      return next;
    });
  }, [selectedItems]);

  const getCachedOrder = useCallback(async (): Promise<CachedOrder | null> => {
    try {
      const raw = await AsyncStorage.getItem(ORDER_CACHE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as CachedOrder;
    } catch {
      return null;
    }
  }, []);

  const clearCachedOrder = useCallback(async () => {
    await AsyncStorage.removeItem(ORDER_CACHE_KEY);
  }, []);

  const restoreItemsFromOrder = useCallback(async (items: CartItem[]) => {
    if (!items.length) return;
    setCartItems(prev => {
      const existing = new Set(prev.map(item => item.offerId));
      const nextItems = items
        .map(item => normalizeCartItem(item))
        .filter((item): item is CartItem => item !== null)
        .filter(item => !existing.has(item.offerId));
      return [...prev, ...nextItems];
    });
  }, []);

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
    refreshCart,
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
