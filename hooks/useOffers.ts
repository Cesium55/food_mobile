import { API_ENDPOINTS } from '@/constants/api';
import { getApiUrl } from '@/constants/env';
import { usePricingStrategies } from '@/hooks/usePricingStrategies';
import { authFetch } from '@/utils/authFetch';
import { calculateDynamicPrice } from '@/utils/pricingUtils';
import { useCallback, useState } from 'react';

// Интерфейс изображения товара
export interface ProductImage {
  id: number;
  path: string;
  order: number;
}

// Интерфейс шага стратегии ценообразования
export interface PricingStrategyStep {
  id: number;
  strategy_id: number;
  time_remaining_seconds: number;
  discount_percent: number;
}

// Интерфейс стратегии ценообразования
export interface PricingStrategy {
  id: number;
  name: string;
  steps: PricingStrategyStep[];
}

// Интерфейс оффера с сервера
export interface OfferApi {
  id: number;
  product_id: number;
  shop_id: number;
  expires_date: string;
  original_cost: number;
  current_cost: number | null;
  count: number;
  description?: string;
  pricing_strategy_id?: number | null;
  pricing_strategy?: PricingStrategy;
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
  currentCost: number | null;
  discount: number; // Вычисляемое поле (процент скидки)
  count: number;
  description?: string;
  pricingStrategyId?: number | null;
  pricingStrategy?: PricingStrategy;
  isDynamicPricing: boolean; // Вычисляемое поле - есть ли динамическое ценообразование
}

export const useOffers = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { getStrategyById } = usePricingStrategies();

  // Преобразование данных с сервера в локальный формат
  const transformOffer = useCallback((apiOffer: OfferApi): Offer => {
    // Определяем, используется ли динамическое ценообразование
    const isDynamicPricing = !!apiOffer.pricing_strategy_id;
    
    console.log('transformOffer:', {
      offerId: apiOffer.id,
      isDynamicPricing,
      pricing_strategy_id: apiOffer.pricing_strategy_id,
      hasPricingStrategy: !!apiOffer.pricing_strategy,
      pricingStrategySteps: apiOffer.pricing_strategy?.steps?.length || 0,
      current_cost: apiOffer.current_cost,
      original_cost: apiOffer.original_cost,
    });
    
    // Если используется динамическое ценообразование и есть стратегия, но current_cost = null, рассчитываем цену
    let finalCurrentCost = apiOffer.current_cost;
    
    // Создаем временный объект Offer для использования calculateDynamicPrice
    // (используем только если нужно рассчитать цену)
    if (isDynamicPricing && apiOffer.pricing_strategy && apiOffer.current_cost === null) {
      const tempOffer: Offer = {
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
        currentCost: null,
        discount: 0,
        count: apiOffer.count,
        description: apiOffer.description,
        pricingStrategyId: apiOffer.pricing_strategy_id ?? null,
        pricingStrategy: apiOffer.pricing_strategy,
        isDynamicPricing: true,
      };
      
      // Используем единую функцию расчета цены
      const calculatedPrice = calculateDynamicPrice(tempOffer);
      finalCurrentCost = calculatedPrice;
    } else if (finalCurrentCost === null && !isDynamicPricing) {
      // Если цена null и нет динамического ценообразования, используем оригинальную цену
      finalCurrentCost = apiOffer.original_cost;
    }

    // Вычисляем процент скидки
    const discount = apiOffer.original_cost > 0 && finalCurrentCost !== null
      ? Math.round(((apiOffer.original_cost - finalCurrentCost) / apiOffer.original_cost) * 100)
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
      currentCost: finalCurrentCost,
      discount,
      count: apiOffer.count,
      description: apiOffer.description,
      pricingStrategyId: apiOffer.pricing_strategy_id ?? null,
      pricingStrategy: apiOffer.pricing_strategy,
      isDynamicPricing,
    };
  }, []);

  // Функция для загрузки офферов с сервера
  const fetchOffers = useCallback(async (filters?: {
    minLatitude?: number;
    maxLatitude?: number;
    minLongitude?: number;
    maxLongitude?: number;
  }) => {
    try {
      setLoading(true);
      setError(null);
      
      // Формируем URL с параметрами фильтрации
      const params = new URLSearchParams();
      
      if (filters?.minLatitude !== undefined) {
        params.append('min_latitude', filters.minLatitude.toString());
      }
      if (filters?.maxLatitude !== undefined) {
        params.append('max_latitude', filters.maxLatitude.toString());
      }
      if (filters?.minLongitude !== undefined) {
        params.append('min_longitude', filters.minLongitude.toString());
      }
      if (filters?.maxLongitude !== undefined) {
        params.append('max_longitude', filters.maxLongitude.toString());
      }
      
      // Добавляем фильтр по сроку годности только если есть фильтры по координатам
      // (для главной страницы фильтруем просроченные, для checkout без фильтров - не фильтруем)
      if (params.toString()) {
        // Если есть фильтры по координатам, добавляем фильтр по дате
        const now = new Date();
        const minExpiresDate = now.toISOString();
        params.append('min_expires_date', minExpiresDate);
      }
      
      // Всегда используем /offers/with-products для получения данных с продуктами
      // Добавляем параметры фильтрации если есть
      let url = getApiUrl(API_ENDPOINTS.OFFERS.WITH_PRODUCTS);
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await authFetch(url, {
        method: 'GET',
        requireAuth: true,
      });

      if (response.ok) {
        const data = await response.json();
        const offersData = data.data || data;
        
        if (Array.isArray(offersData)) {
          // Сначала трансформируем офферы
          let transformedOffers = offersData.map(transformOffer);
          
          // Загружаем стратегии для офферов, у которых они отсутствуют
          const offersNeedingStrategy = transformedOffers.filter(
            offer => offer.isDynamicPricing && offer.pricingStrategyId && !offer.pricingStrategy
          );
          
          // Загружаем стратегии для офферов, у которых они отсутствуют
          // Делаем это в отдельном шаге, чтобы не блокировать основной рендер
          if (offersNeedingStrategy.length > 0) {
            console.log(`Loading ${offersNeedingStrategy.length} missing strategies...`);
            
            // Сначала устанавливаем офферы без стратегий (чтобы не блокировать UI)
            setOffers(transformedOffers);
            
            // Затем загружаем стратегии асинхронно и обновляем офферы
            Promise.all(
              offersNeedingStrategy.map(async (offer) => {
                if (offer.pricingStrategyId) {
                  try {
                    const strategy = await getStrategyById(offer.pricingStrategyId);
                    console.log(`Loaded strategy ${offer.pricingStrategyId} for offer ${offer.id}:`, strategy);
                    return { offerId: offer.id, strategy };
                  } catch (err) {
                    console.warn(`Failed to load strategy ${offer.pricingStrategyId} for offer ${offer.id}:`, err);
                    return { offerId: offer.id, strategy: null };
                  }
                }
                return { offerId: offer.id, strategy: null };
              })
            ).then(strategyResults => {
              // Обновляем офферы со стратегиями только один раз
              setOffers(prevOffers => {
                // Проверяем, изменились ли офферы (защита от race condition)
                const hasChanges = strategyResults.some(result => {
                  const offer = prevOffers.find(o => o.id === result.offerId);
                  return offer && !offer.pricingStrategy && result.strategy;
                });
                
                if (!hasChanges) {
                  return prevOffers; // Нет изменений, не обновляем
                }
                
                return prevOffers.map(offer => {
                  const strategyResult = strategyResults.find(r => r.offerId === offer.id);
                  if (strategyResult && strategyResult.strategy && !offer.pricingStrategy) {
                    const updatedOffer = {
                      ...offer,
                      pricingStrategy: strategyResult.strategy,
                    };
                    // Пересчитываем цену с учетом загруженной стратегии
                    if (updatedOffer.currentCost === null) {
                      const calculatedPrice = calculateDynamicPrice(updatedOffer);
                      updatedOffer.currentCost = calculatedPrice;
                      // Пересчитываем скидку
                      if (calculatedPrice !== null && updatedOffer.originalCost > 0) {
                        updatedOffer.discount = Math.round(
                          ((updatedOffer.originalCost - calculatedPrice) / updatedOffer.originalCost) * 100
                        );
                      }
                    }
                    return updatedOffer;
                  }
                  return offer;
                });
              });
            });
          } else {
            // Если стратегии не нужны, просто устанавливаем офферы
            setOffers(transformedOffers);
          }
        } else {
          setError('Неверный формат данных офферов');
          setOffers([]);
        }
      } else if (response.status === 404) {
        setError('Офферы не найдены');
        setOffers([]);
      } else {
        const errorText = await response.text();
        setError('Ошибка загрузки офферов');
        setOffers([]);
      }
    } catch (err) {
      setError('Ошибка подключения к серверу');
      setOffers([]);
    } finally {
      setLoading(false);
    }
  }, [transformOffer, getStrategyById]);

  // Не загружаем автоматически - загружаем только когда явно вызывается fetchOffers или fetchOffersWithLocation

  // Функция для загрузки офферов с фильтрацией по координатам
  const fetchOffersWithLocation = useCallback(async (filters: {
    minLatitude: number;
    maxLatitude: number;
    minLongitude: number;
    maxLongitude: number;
  }) => {
    await fetchOffers(filters);
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
  // Можно передать skipExpiredFilter=true, чтобы загрузить все offers включая просроченные
  const refetch = useCallback(async (skipExpiredFilter?: boolean) => {
    if (skipExpiredFilter) {
      // Загружаем без фильтров (для checkout, где нужны все offers)
      await fetchOffers();
    } else {
      // Загружаем с фильтрами по умолчанию
      await fetchOffers();
    }
  }, [fetchOffers]);

  // Функция для создания нового оффера
  const createOffer = useCallback(async (offerData: {
    product_id: number;
    shop_id: number;
    expires_date: string;
    original_cost?: number;
    current_cost?: number | null;
    pricing_strategy_id?: number | null;
    count: number;
    description?: string;
  }): Promise<Offer | null> => {
    try {
      const url = getApiUrl(API_ENDPOINTS.OFFERS.BASE);
      const requestBody = JSON.stringify(offerData);

      const response = await authFetch(url, {
        method: 'POST',
        requireAuth: true,
        headers: {
          'Content-Type': 'application/json',
        },
        body: requestBody,
      });

      if (response.ok) {
        const data = await response.json();
        const createdOfferData = data.data || data;
        const newOffer = transformOffer(createdOfferData as OfferApi);
        
        // Обновляем локальный список офферов
        setOffers(prev => [...prev, newOffer]);
        
        return newOffer;
      } else {
        const errorText = await response.text();
        throw new Error(errorText || 'Ошибка создания оффера');
      }
    } catch (err) {
      throw err;
    }
  }, [transformOffer]);

  // Функция для обновления оффера
  const updateOffer = useCallback(async (
    offerId: number,
    offerData: {
      pricing_strategy_id?: number | null;
      current_cost?: number | null;
      original_cost?: number;
      count?: number;
      expires_date?: string;
      description?: string;
    }
  ): Promise<Offer | null> => {
    try {
      const url = getApiUrl(API_ENDPOINTS.OFFERS.UPDATE(offerId));
      const requestBody = JSON.stringify(offerData);

      const response = await authFetch(url, {
        method: 'PUT',
        requireAuth: true,
        headers: {
          'Content-Type': 'application/json',
        },
        body: requestBody,
      });

      if (response.ok) {
        const data = await response.json();
        const updatedOfferData = data.data || data;
        const updatedOffer = transformOffer(updatedOfferData as OfferApi);
        
        // Обновляем локальный список офферов
        setOffers(prev => prev.map(offer => 
          offer.id === offerId ? updatedOffer : offer
        ));
        
        return updatedOffer;
      } else {
        const errorText = await response.text();
        throw new Error(errorText || 'Ошибка обновления оффера');
      }
    } catch (err) {
      throw err;
    }
  }, [transformOffer]);

  return {
    offers,
    loading,
    error,
    refetch,
    fetchOffers,
    fetchOffersWithLocation,
    getOfferById,
    getOffersByShop,
    getOffersBySeller,
    getOffersByCategory,
    createOffer,
    updateOffer,
  };
};
