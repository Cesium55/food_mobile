import { useState } from 'react';

export interface Shop {
  id: number;
  sellerId: number;
  shortName: string;
  fullName: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
  workingHours?: string;
}

export const useShops = () => {
  const [shops] = useState<Shop[]>([
    // Продавец 1: ООО "Продукты и напитки"
    {
      id: 1,
      sellerId: 1,
      shortName: 'Продукты',
      fullName: 'Продукты и напитки на Ленина',
      address: 'ул. Ленина, 45',
      latitude: 55.755819,
      longitude: 37.617644,
      phone: '+7 (495) 123-45-67',
      workingHours: '08:00 - 22:00',
    },
    // Продавец 7: Хлебопекарня
    {
      id: 2,
      sellerId: 7,
      shortName: 'Хлебопекарня',
      fullName: 'Хлебопекарня №1 на Мира',
      address: 'пр. Мира, 12',
      latitude: 55.781908,
      longitude: 37.632771,
      phone: '+7 (495) 234-56-78',
      workingHours: '07:00 - 21:00',
    },
    {
      id: 6,
      sellerId: 7,
      shortName: 'Хлебопекарня',
      fullName: 'Хлебопекарня №1 на Арбате',
      address: 'ул. Арбат, 28',
      latitude: 55.751244,
      longitude: 37.593522,
      phone: '+7 (495) 234-56-79',
      workingHours: '07:00 - 21:00',
    },
    // Продавец 5: Мясная лавка
    {
      id: 3,
      sellerId: 5,
      shortName: 'Мясная лавка',
      fullName: 'Мясная лавка на Пушкина',
      address: 'ул. Пушкина, 23',
      latitude: 55.764393,
      longitude: 37.625212,
      phone: '+7 (495) 345-67-89',
      workingHours: '09:00 - 20:00',
    },
    // Продавец 9: Молочка
    {
      id: 4,
      sellerId: 9,
      shortName: 'Молочка',
      fullName: 'Молочные продукты на Гагарина',
      address: 'ул. Гагарина, 8',
      latitude: 55.742399,
      longitude: 37.609218,
      phone: '+7 (495) 456-78-90',
      workingHours: '08:00 - 21:00',
    },
    {
      id: 7,
      sellerId: 9,
      shortName: 'Молочка',
      fullName: 'Молочные продукты на Тверской',
      address: 'ул. Тверская, 15',
      latitude: 55.764167,
      longitude: 37.609722,
      phone: '+7 (495) 456-78-91',
      workingHours: '08:00 - 21:00',
    },
    // Продавец 3: Овощи
    {
      id: 5,
      sellerId: 3,
      shortName: 'Овощи',
      fullName: 'Свежие овощи на Садовой',
      address: 'ул. Садовая, 42',
      latitude: 55.758031,
      longitude: 37.612267,
      phone: '+7 (495) 567-89-01',
      workingHours: '07:00 - 23:00',
    },
    // Продавец 2: ИП Иванов
    {
      id: 8,
      sellerId: 2,
      shortName: 'ИП Иванов',
      fullName: 'Продуктовый магазин ИП Иванова',
      address: 'ул. Кутузовская, 5',
      latitude: 55.740556,
      longitude: 37.535833,
      phone: '+7 (495) 678-90-12',
      workingHours: '09:00 - 21:00',
    },
    // Продавец 4: ИП Петров
    {
      id: 9,
      sellerId: 4,
      shortName: 'ИП Петров',
      fullName: 'Магазин у дома ИП Петрова',
      address: 'ул. Чехова, 17',
      latitude: 55.766944,
      longitude: 37.641944,
      phone: '+7 (495) 789-01-23',
      workingHours: '08:00 - 22:00',
    },
    // Продавец 6: ИП Сидорова
    {
      id: 10,
      sellerId: 6,
      shortName: 'ИП Сидорова',
      fullName: 'Продукты от Сидоровой',
      address: 'ул. Маяковского, 31',
      latitude: 55.773889,
      longitude: 37.615278,
      phone: '+7 (495) 890-12-34',
      workingHours: '10:00 - 20:00',
    },
    // Продавец 8: ИП Кузнецов
    {
      id: 11,
      sellerId: 8,
      shortName: 'ИП Кузнецов',
      fullName: 'Гастроном Кузнецова',
      address: 'пр. Вернадского, 88',
      latitude: 55.677778,
      longitude: 37.505556,
      phone: '+7 (495) 901-23-45',
      workingHours: '09:00 - 21:00',
    },
    {
      id: 12,
      sellerId: 8,
      shortName: 'ИП Кузнецов',
      fullName: 'Гастроном Кузнецова на Преображенке',
      address: 'ул. Преображенская, 12',
      latitude: 55.795833,
      longitude: 37.716667,
      phone: '+7 (495) 901-23-46',
      workingHours: '09:00 - 21:00',
    },
    // Продавец 10: ИП Морозов
    {
      id: 13,
      sellerId: 10,
      shortName: 'ИП Морозов',
      fullName: 'Продукты от Морозова',
      address: 'ул. Таганская, 25',
      latitude: 55.740278,
      longitude: 37.653611,
      phone: '+7 (495) 012-34-56',
      workingHours: '08:00 - 20:00',
    },
    // Дополнительные магазины для активных продавцов
    {
      id: 14,
      sellerId: 1,
      shortName: 'Продукты',
      fullName: 'Продукты и напитки на Кузнецком',
      address: 'Кузнецкий мост, 7',
      latitude: 55.760833,
      longitude: 37.624722,
      phone: '+7 (495) 123-45-68',
      workingHours: '08:00 - 22:00',
    },
    {
      id: 15,
      sellerId: 3,
      shortName: 'Овощи',
      fullName: 'Свежие овощи на Смоленской',
      address: 'ул. Смоленская, 8',
      latitude: 55.747500,
      longitude: 37.582500,
      phone: '+7 (495) 567-89-02',
      workingHours: '07:00 - 23:00',
    },
    {
      id: 16,
      sellerId: 5,
      shortName: 'Мясная лавка',
      fullName: 'Мясная лавка на Сретенке',
      address: 'ул. Сретенка, 11',
      latitude: 55.770833,
      longitude: 37.634167,
      phone: '+7 (495) 345-67-90',
      workingHours: '09:00 - 20:00',
    },
  ]);

  const getShopById = (id: number): Shop | undefined => {
    return shops.find((shop) => shop.id === id);
  };

  const getShopsBySeller = (sellerId: number): Shop[] => {
    return shops.filter((shop) => shop.sellerId === sellerId);
  };

  return {
    shops,
    getShopById,
    getShopsBySeller,
  };
};

