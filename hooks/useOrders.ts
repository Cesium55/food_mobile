import { useState, useEffect, useCallback } from 'react';
import { getCurrentPendingPurchase, CreateOrderResponse } from '@/services/orderService';
import { useOffers } from '@/hooks/useOffers';
import { useShops } from '@/hooks/useShops';

export interface OrderItem {
  id: number;
  productName: string;
  quantity: number;
  price: number;
  shopName: string;
}

export interface Order {
  id: number;
  date: Date;
  status: 'completed' | 'cancelled' | 'processing' | 'reserved' | 'paid';
  items: OrderItem[];
  totalAmount: number;
  discount: number;
  paymentMethod: 'card' | 'cash' | 'online';
  shops: string[]; // Список магазинов
  timeLeft?: number; // Оставшееся время в минутах (для забронированных)
}

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentPending, setCurrentPending] = useState<CreateOrderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const { getOfferById } = useOffers();
  const { getShopById } = useShops();

  // Преобразуем CreateOrderResponse в Order
  const convertToOrder = useCallback((orderData: CreateOrderResponse): Order => {
    const purchase = orderData.purchase;
    const items: OrderItem[] = [];
    const shopsSet = new Set<string>();

    // Проходим по purchase_offers для формирования items
    purchase.purchase_offers.forEach((po, index) => {
      const offer = getOfferById(po.offer_id);
      const shop = getShopById(po.offer.shop_id);
      const shopName = shop?.shortName || shop?.name || offer?.shopShortName || `Магазин #${po.offer.shop_id}`;
      
      shopsSet.add(shopName);
      
      items.push({
        id: index + 1,
        productName: offer?.productName || `Товар #${po.offer.product_id}`,
        quantity: po.quantity,
        price: po.cost_at_purchase,
        shopName,
      });
    });

    // Вычисляем скидку
    const originalTotal = purchase.purchase_offers.reduce((sum, po) => {
      return sum + (po.offer.original_cost * po.quantity);
    }, 0);
    const discount = originalTotal - purchase.total_cost;

    // Определяем статус
    let status: Order['status'] = 'reserved';
    if (purchase.status === 'paid') {
      status = 'paid';
    } else if (purchase.status === 'pending') {
      status = 'reserved';
    }

    return {
      id: purchase.id,
      date: new Date(purchase.created_at),
      status,
      items,
      totalAmount: purchase.total_cost,
      discount,
      paymentMethod: 'card', // По умолчанию, можно будет получить из API позже
      shops: Array.from(shopsSet),
      timeLeft: purchase.ttl ? Math.ceil(purchase.ttl / 60) : undefined, // Конвертируем секунды в минуты
    };
  }, [getOfferById, getShopById]);

  // Загружаем текущий pending заказ
  const loadCurrentPending = useCallback(async () => {
    try {
      setLoading(true);
      const pending = await getCurrentPendingPurchase();
      setCurrentPending(pending);
    } catch (error) {
      console.error('Ошибка загрузки текущего заказа:', error);
      setCurrentPending(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCurrentPending();
  }, [loadCurrentPending]);

  const getOrderById = (id: number): Order | undefined => {
    return orders.find(order => order.id === id);
  };

  const getOrdersByStatus = (status: Order['status']): Order[] => {
    return orders.filter(order => order.status === status);
  };

  const getTotalSpent = (): number => {
    return orders
      .filter(order => order.status === 'completed')
      .reduce((sum, order) => sum + order.totalAmount, 0);
  };

  const getTotalSaved = (): number => {
    return orders
      .filter(order => order.status === 'completed')
      .reduce((sum, order) => sum + order.discount, 0);
  };

  const getCurrentOrders = (): Order[] => {
    const current: Order[] = [];
    
    // Добавляем текущий pending заказ, если он есть
    if (currentPending) {
      current.push(convertToOrder(currentPending));
    }
    
    // Добавляем другие текущие заказы (reserved, paid)
    const otherCurrent = orders.filter(order => 
      order.status === 'reserved' || order.status === 'paid'
    );
    
    return [...current, ...otherCurrent];
  };

  return {
    orders,
    loading,
    getOrderById,
    getOrdersByStatus,
    getTotalSpent,
    getTotalSaved,
    getCurrentOrders,
    refetchCurrentPending: loadCurrentPending,
  };
};

