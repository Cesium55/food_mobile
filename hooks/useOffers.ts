import { API_ENDPOINTS } from '@/constants/api';
import { getApiUrl } from '@/constants/env';
import { authFetch } from '@/utils/authFetch';
import { useCallback, useEffect, useState } from 'react';

// Интерфейс изображения товара
export interface ProductImage {
  id: number;
  path: string;
  order: number;
}

// Интерфейс оффера с сервера
export interface OfferApi {
  id: number;
  product_id: number;
  shop_id: number;
  expires_date: string;
  original_cost: number;
  current_cost: number;
  count: number;
  description?: string;
  product?: {
    id: number;
    name: string;
    description: string;
    article: string | null;
    code: string | null;
    seller_id: number;
    images: ProductImage[];
    attributes: Array<{
      slug: string;
      name: string;
      value: string;
      id: number;
      product_id: number;
    }>;
    category_ids: number[];
  };
}

// Локальный интерфейс оффера
export interface Offer {
  id: number;
  productId: number;
  productName: string;
  productDescription: string;
  productCategoryIds: number[]; // Массив ID категорий товара
  productImages: ProductImage[]; // Массив изображений товара
  productAttributes?: Array<{
    slug: string;
    name: string;
    value: string;
    id: number;
    product_id: number;
  }>; // Атрибуты товара из API
  shopId: number;
  shopShortName?: string; // Краткое название магазина
  sellerId: number;
  expiresDate: string; // ISO строка даты
  originalCost: number;
  currentCost: number;
  discount: number; // Вычисляемое поле (процент скидки)
  count: number;
  description?: string;
}

export const useOffers = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Преобразование данных с сервера в локальный формат
  const transformOffer = useCallback((apiOffer: OfferApi): Offer => {
    // Вычисляем процент скидки
    const discount = apiOffer.original_cost > 0
      ? Math.round(((apiOffer.original_cost - apiOffer.current_cost) / apiOffer.original_cost) * 100)
      : 0;

    return {
      id: apiOffer.id,
      productId: apiOffer.product_id,
      productName: apiOffer.product?.name || 'Товар',
      productDescription: apiOffer.product?.description || '',
      productCategoryIds: apiOffer.product?.category_ids || [],
      productImages: apiOffer.product?.images || [],
      productAttributes: apiOffer.product?.attributes || [],
      shopId: apiOffer.shop_id,
      sellerId: apiOffer.product?.seller_id || 0,
      expiresDate: apiOffer.expires_date,
      originalCost: apiOffer.original_cost,
      currentCost: apiOffer.current_cost,
      discount,
      count: apiOffer.count,
      description: apiOffer.description,
    };
  }, []);

  // Функция для загрузки офферов с сервера
  const fetchOffers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Загружаем все офферы для текущего продавца (в админке)
      const response = await authFetch(getApiUrl(API_ENDPOINTS.OFFERS.WITH_PRODUCTS), {
        method: 'GET',
        requireAuth: true,
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📦 Получены данные офферов:', data);
        
        // Ожидаем структуру ответа: { data: OfferApi[] }
        const offersData = data.data || data;
        
        if (Array.isArray(offersData)) {
          console.log(`✅ Найдено ${offersData.length} офферов`);
          // Преобразуем данные с сервера в локальный формат
          const transformedOffers = offersData.map(transformOffer);
          console.log('✅ Преобразованные офферы:', transformedOffers);
          setOffers(transformedOffers);
        } else {
          console.error('❌ Неверный формат данных офферов:', offersData);
          setError('Неверный формат данных офферов');
          setOffers([]);
        }
      } else if (response.status === 404) {
        setError('Офферы не найдены');
        setOffers([]);
      } else {
        const errorText = await response.text();
        console.error('❌ Ошибка загрузки офферов:', response.status, errorText);
        setError('Ошибка загрузки офферов');
        setOffers([]);
      }
    } catch (err) {
      console.error('❌ Ошибка подключения к серверу при загрузке офферов:', err);
      setError('Ошибка подключения к серверу');
      setOffers([]);
    } finally {
      setLoading(false);
    }
  }, [transformOffer]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  const getOfferById = (id: number): Offer | undefined => {
    return offers.find((offer) => offer.id === id);
  };

  const getOffersByShop = (shopId: number): Offer[] => {
    return offers.filter((offer) => offer.shopId === shopId);
  };

  const getOffersBySeller = (sellerId: number): Offer[] => {
    return offers.filter((offer) => offer.sellerId === sellerId);
  };

  const getOffersByCategory = (categoryId: number): Offer[] => {
    return offers.filter((offer) => offer.productCategoryIds.includes(categoryId));
  };

  // Функция для повторной загрузки офферов
  const refetch = useCallback(async () => {
    await fetchOffers();
  }, [fetchOffers]);

  // Функция для создания нового оффера
  const createOffer = useCallback(async (offerData: {
    product_id: number;
    shop_id: number;
    expires_date: string;
    original_cost: number;
    current_cost: number;
    count: number;
    description?: string;
  }): Promise<Offer | null> => {
    try {
      const url = getApiUrl(API_ENDPOINTS.OFFERS.BASE);
      const requestBody = JSON.stringify(offerData);
      
      console.log('📤 Создание оффера:', {
        url,
        method: 'POST',
        data: offerData,
      });

      const response = await authFetch(url, {
        method: 'POST',
        requireAuth: true,
        headers: {
          'Content-Type': 'application/json',
        },
        body: requestBody,
      });

      console.log('📥 Ответ сервера:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Данные созданного оффера:', data);
        const createdOfferData = data.data || data;
        const newOffer = transformOffer(createdOfferData as OfferApi);
        console.log('✅ Преобразованный оффер:', newOffer);
        
        // Обновляем локальный список офферов
        setOffers(prev => [...prev, newOffer]);
        
        return newOffer;
      } else {
        const errorText = await response.text();
        console.error('❌ Ошибка создания оффера:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
        });
        throw new Error(errorText || 'Ошибка создания оффера');
      }
    } catch (err) {
      console.error('❌ Ошибка подключения к серверу при создании оффера:', err);
      throw err;
    }
  }, [transformOffer]);

  return {
    offers,
    loading,
    error,
    refetch,
    getOfferById,
    getOffersByShop,
    getOffersBySeller,
    getOffersByCategory,
    createOffer,
  };
};
