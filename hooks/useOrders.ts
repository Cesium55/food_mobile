import { useOffers } from '@/hooks/useOffers';
import { useShops } from '@/hooks/useShops';
import { CreateOrderResponse, getCurrentPendingPurchase, getPurchasesByStatus, getPurchasesHistory } from '@/services/orderService';
import { useCallback, useEffect, useState } from 'react';

export interface OrderItem {
  id: number;
  productName: string;
  quantity: number;
  price: string; // decimal формат
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
  const [paidOrders, setPaidOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
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
      return sum + (parseFloat(po.offer.original_cost) * po.quantity);
    }, 0);
    const totalCost = parseFloat(purchase.total_cost);
    const discount = originalTotal - totalCost;

    // Определяем статус на основе статуса покупки
    let status: Order['status'] = 'reserved';
    if (purchase.status === 'completed') {
      status = 'completed';
    } else if (purchase.status === 'confirmed') {
      status = 'paid'; // confirmed означает оплачен и подтвержден
    } else if (purchase.status === 'paid') {
      status = 'paid';
    } else if (purchase.status === 'cancelled') {
      status = 'cancelled';
    } else if (purchase.status === 'pending') {
      status = 'reserved';
    }

    return {
      id: purchase.id,
      date: new Date(purchase.created_at),
      status,
      items,
      totalAmount: totalCost,
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

  // Загружаем историю заказов
  const loadOrdersHistory = useCallback(async () => {
    try {
      setLoading(true);
      const history = await getPurchasesHistory();
      // Используем convertToOrder напрямую, чтобы избежать проблем с зависимостями
      const ordersList = history.map(orderData => {
        const purchase = orderData.purchase;
        const items: OrderItem[] = [];
        const shopsSet = new Set<string>();

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

        const originalTotal = purchase.purchase_offers.reduce((sum, po) => {
          return sum + (parseFloat(po.offer.original_cost) * po.quantity);
        }, 0);
        const totalCost = parseFloat(purchase.total_cost);
        const discount = originalTotal - totalCost;

        // Определяем статус на основе статуса покупки
        let status: Order['status'] = 'reserved';
        if (purchase.status === 'completed') {
          status = 'completed';
        } else if (purchase.status === 'confirmed') {
          status = 'paid'; // confirmed означает оплачен и подтвержден
        } else if (purchase.status === 'paid') {
          status = 'paid';
        } else if (purchase.status === 'cancelled') {
          status = 'cancelled';
        } else if (purchase.status === 'pending') {
          status = 'reserved';
        }

        return {
          id: purchase.id,
          date: new Date(purchase.created_at),
          status,
          items,
          totalAmount: totalCost,
          discount,
          paymentMethod: 'card' as const,
          shops: Array.from(shopsSet),
          timeLeft: purchase.ttl ? Math.ceil(purchase.ttl / 60) : undefined,
        };
      });
      setOrders(ordersList);
    } catch (error) {
      console.error('Ошибка загрузки истории заказов:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [getOfferById, getShopById]);

  // Функция для повторной загрузки заказов - стабильная ссылка
  const refetchOrders = useCallback(async () => {
    await loadOrdersHistory();
  }, [loadOrdersHistory]);

  // Загружаем оплаченные заказы (paid и confirmed)
  const loadPaidOrders = useCallback(async () => {
    try {
      // Загружаем заказы со статусом paid
      const paid = await getPurchasesByStatus('paid');
      // Загружаем заказы со статусом confirmed
      const confirmed = await getPurchasesByStatus('confirmed');
      
      // Объединяем и преобразуем в Order
      const allPaid = [...paid, ...confirmed];
      const ordersList = allPaid.map(orderData => {
        const purchase = orderData.purchase;
        const items: OrderItem[] = [];
        const shopsSet = new Set<string>();

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

        const originalTotal = purchase.purchase_offers.reduce((sum, po) => {
          return sum + (parseFloat(po.offer.original_cost) * po.quantity);
        }, 0);
        const totalCost = parseFloat(purchase.total_cost);
        const discount = originalTotal - totalCost;

        let status: Order['status'] = 'paid';
        if (purchase.status === 'confirmed') {
          status = 'paid'; // confirmed отображаем как paid
        }

        return {
          id: purchase.id,
          date: new Date(purchase.created_at),
          status,
          items,
          totalAmount: totalCost,
          discount,
          paymentMethod: 'card' as const,
          shops: Array.from(shopsSet),
          timeLeft: purchase.ttl ? Math.ceil(purchase.ttl / 60) : undefined,
        };
      });
      
      setPaidOrders(ordersList);
    } catch (error) {
      console.error('Ошибка загрузки оплаченных заказов:', error);
      setPaidOrders([]);
    }
  }, [getOfferById, getShopById]);

  // Загружаем текущий pending заказ и оплаченные заказы при монтировании
  useEffect(() => {
    loadCurrentPending();
    loadPaidOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    const seenIds = new Set<number>();
    
    // Добавляем текущий pending заказ, если он есть
    if (currentPending) {
      const pendingOrder = convertToOrder(currentPending);
      current.push(pendingOrder);
      seenIds.add(pendingOrder.id);
    }
    
    // Добавляем оплаченные заказы (paid и confirmed), которые еще не получены
    // Исключаем completed, так как они уже получены
    // Также исключаем дубликаты с pending заказом
    const unpaidOrders = paidOrders.filter(order => {
      return order.status === 'paid' && !seenIds.has(order.id);
    });
    
    unpaidOrders.forEach(order => seenIds.add(order.id));
    
    return [...current, ...unpaidOrders];
  };

  // Функция для обновления оплаченных заказов - стабильная ссылка
  const refetchPaidOrders = useCallback(async () => {
    try {
      // Загружаем заказы со статусом paid
      const paid = await getPurchasesByStatus('paid');
      // Загружаем заказы со статусом confirmed
      const confirmed = await getPurchasesByStatus('confirmed');
      
      // Объединяем и преобразуем в Order
      const allPaid = [...paid, ...confirmed];
      const ordersList = allPaid.map(orderData => {
        const purchase = orderData.purchase;
        const items: OrderItem[] = [];
        const shopsSet = new Set<string>();

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

        const originalTotal = purchase.purchase_offers.reduce((sum, po) => {
          return sum + (parseFloat(po.offer.original_cost) * po.quantity);
        }, 0);
        const totalCost = parseFloat(purchase.total_cost);
        const discount = originalTotal - totalCost;

        let status: Order['status'] = 'paid';
        if (purchase.status === 'confirmed') {
          status = 'paid'; // confirmed отображаем как paid
        }

        return {
          id: purchase.id,
          date: new Date(purchase.created_at),
          status,
          items,
          totalAmount: totalCost,
          discount,
          paymentMethod: 'card' as const,
          shops: Array.from(shopsSet),
          timeLeft: purchase.ttl ? Math.ceil(purchase.ttl / 60) : undefined,
        };
      });
      
      setPaidOrders(ordersList);
    } catch (error) {
      console.error('Ошибка загрузки оплаченных заказов:', error);
      setPaidOrders([]);
    }
  }, [getOfferById, getShopById]);

  return {
    orders,
    loading,
    getOrderById,
    getOrdersByStatus,
    getTotalSpent,
    getTotalSaved,
    getCurrentOrders,
    refetchCurrentPending: loadCurrentPending,
    refetchPaidOrders,
    refetchOrders,
  };
};

