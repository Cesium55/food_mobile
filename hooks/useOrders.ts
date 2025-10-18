import { useState } from 'react';

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
  const [orders] = useState<Order[]>([
    // Текущие заказы
    {
      id: 101,
      date: new Date(),
      status: 'reserved',
      items: [
        {
          id: 1,
          productName: 'Молоко пастеризованное 3.2%',
          quantity: 1,
          price: 69.90,
          shopName: 'Продукты',
        },
        {
          id: 2,
          productName: 'Хлеб Бородинский',
          quantity: 2,
          price: 45.00,
          shopName: 'Хлебопекарня',
        },
      ],
      totalAmount: 159.90,
      discount: 20.10,
      paymentMethod: 'card',
      shops: ['Продукты', 'Хлебопекарня'],
      timeLeft: 3, // 3 минуты осталось
    },
    {
      id: 102,
      date: new Date('2025-10-13T09:15:00'),
      status: 'paid',
      items: [
        {
          id: 3,
          productName: 'Йогурт натуральный',
          quantity: 3,
          price: 95.00,
          shopName: 'Молочка',
        },
        {
          id: 4,
          productName: 'Сыр Российский',
          quantity: 1,
          price: 550.00,
          shopName: 'Молочка',
        },
      ],
      totalAmount: 835.00,
      discount: 115.00,
      paymentMethod: 'online',
      shops: ['Молочка'],
    },
    // Завершенные заказы
    {
      id: 1,
      date: new Date('2025-10-12T14:30:00'),
      status: 'completed',
      items: [
        {
          id: 1,
          productName: 'Молоко пастеризованное 3.2%',
          quantity: 2,
          price: 69.90,
          shopName: 'Продукты',
        },
        {
          id: 2,
          productName: 'Хлеб Бородинский',
          quantity: 1,
          price: 45.00,
          shopName: 'Хлебопекарня',
        },
        {
          id: 3,
          productName: 'Кефир 2.5%',
          quantity: 1,
          price: 59.00,
          shopName: 'Продукты',
        },
      ],
      totalAmount: 243.80,
      discount: 35.20,
      paymentMethod: 'card',
      shops: ['Продукты', 'Хлебопекарня'],
    },
    {
      id: 2,
      date: new Date('2025-10-10T10:15:00'),
      status: 'completed',
      items: [
        {
          id: 4,
          productName: 'Куриная грудка охлажденная',
          quantity: 1,
          price: 380.00,
          shopName: 'Мясная лавка',
        },
        {
          id: 5,
          productName: 'Помидоры черри',
          quantity: 2,
          price: 135.00,
          shopName: 'Овощи',
        },
      ],
      totalAmount: 650.00,
      discount: 100.00,
      paymentMethod: 'cash',
      shops: ['Мясная лавка', 'Овощи'],
    },
    {
      id: 3,
      date: new Date('2025-10-08T16:45:00'),
      status: 'cancelled',
      items: [
        {
          id: 6,
          productName: 'Сыр Российский',
          quantity: 1,
          price: 550.00,
          shopName: 'Молочка',
        },
      ],
      totalAmount: 550.00,
      discount: 100.00,
      paymentMethod: 'card',
      shops: ['Молочка'],
    },
    {
      id: 4,
      date: new Date('2025-10-05T12:20:00'),
      status: 'completed',
      items: [
        {
          id: 7,
          productName: 'Батон нарезной',
          quantity: 3,
          price: 42.00,
          shopName: 'Хлебопекарня',
        },
        {
          id: 8,
          productName: 'Йогурт натуральный',
          quantity: 4,
          price: 95.00,
          shopName: 'Молочка',
        },
        {
          id: 9,
          productName: 'Масло сливочное 82.5%',
          quantity: 1,
          price: 240.00,
          shopName: 'Продукты',
        },
      ],
      totalAmount: 746.00,
      discount: 154.00,
      paymentMethod: 'online',
      shops: ['Хлебопекарня', 'Молочка', 'Продукты'],
    },
    {
      id: 5,
      date: new Date('2025-10-03T09:30:00'),
      status: 'completed',
      items: [
        {
          id: 10,
          productName: 'Яблоки Голден',
          quantity: 2,
          price: 89.00,
          shopName: 'Овощи',
        },
        {
          id: 11,
          productName: 'Огурцы свежие',
          quantity: 1,
          price: 69.00,
          shopName: 'Овощи',
        },
      ],
      totalAmount: 247.00,
      discount: 53.00,
      paymentMethod: 'card',
      shops: ['Овощи'],
    },
  ]);

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
    return orders.filter(order => 
      order.status === 'reserved' || order.status === 'paid'
    );
  };

  return {
    orders,
    getOrderById,
    getOrdersByStatus,
    getTotalSpent,
    getTotalSaved,
    getCurrentOrders,
  };
};

