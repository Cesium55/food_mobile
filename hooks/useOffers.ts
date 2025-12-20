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
  original_cost: string; // decimal формат
  current_cost: string | null; // decimal формат
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
  originalCost: string; // decimal формат
  currentCost: string | null; // decimal формат
  discount: number; // Вычисляемое поле (процент скидки)
  count: number;
  description?: string;
  pricingStrategyId?: number | null;
  pricingStrategy?: PricingStrategy;
  isDynamicPricing: boolean; // Вычисляемое поле - есть ли динамическое ценообразование
  productWeight?: string; // Вес товара
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
    const originalCostNum = parseFloat(apiOffer.original_cost);
    const finalCurrentCostNum = finalCurrentCost !== null ? parseFloat(finalCurrentCost) : null;
    const discount = originalCostNum > 0 && finalCurrentCostNum !== null
      ? Math.round(((originalCostNum - finalCurrentCostNum) / originalCostNum) * 100)
      : 0;

    // Извлекаем вес из атрибутов
    const weightAttr = apiOffer.product?.attributes?.find(attr => 
      attr.slug === 'weight' || attr.name.toLowerCase().includes('вес')
    );
    const productWeight = weightAttr?.value;

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
      productWeight,
    };
  }, []);

  // Функция для загрузки офферов с сервера
  const fetchOffers = useCallback(async (filters?: {
    minLatitude?: number;
    maxLatitude?: number;
    minLongitude?: number;
    maxLongitude?: number;
    skipDefaultFilters?: boolean; // Новый параметр для пропуска дефолтных фильтров
    sellerId?: number; // Новый параметр для фильтрации по продавцу (для админки)
    categoryIds?: number[]; // Фильтр по ID категорий (OR логика)
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
      
      // Фильтрация по продавцу (для админки)
      if (filters?.sellerId !== undefined) {
        params.append('seller_id', filters.sellerId.toString());
      }

      // Фильтрация по категориям (OR логика)
      if (filters?.categoryIds && filters.categoryIds.length > 0) {
        filters.categoryIds.forEach(id => {
          params.append('category_ids', id.toString());
        });
      }
      
      // Добавляем дефолтные фильтры, если не указано skipDefaultFilters
      // Это нужно для главной страницы, чтобы показывать только годные товары в наличии
      if (!filters?.skipDefaultFilters) {
        // Фильтр по сроку годности - только непросроченные товары
        const now = new Date();
        const minExpiresDate = now.toISOString();
        params.append('min_expires_date', minExpiresDate);
        
        // Фильтр по количеству - только товары в наличии (count > 0)
        params.append('min_count', '1');
      }
      
      // Всегда используем /offers/with-products для получения данных с продуктами
      // Добавляем параметры фильтрации если есть
      let url = getApiUrl(API_ENDPOINTS.OFFERS.WITH_PRODUCTS);
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      console.log('🚀 API FETCH Offers:', url);

      const response = await authFetch(url, {
        method: 'GET',
        requireAuth: false, // Получение офферов - публичное действие
      });

      if (response.ok) {
        const data = await response.json();
        const offersData = data.data || data;
        
        console.log('📦 API RESPONSE Offers (RAW count):', Array.isArray(offersData) ? offersData.length : 'not an array');
        if (Array.isArray(offersData) && offersData.length > 0) {
          console.log('📦 API RESPONSE Offers (Sample):', JSON.stringify(offersData[0], null, 2));
        }
        
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
            // Сначала устанавливаем офферы без стратегий (чтобы не блокировать UI)
            setOffers(transformedOffers);
            
            // Затем загружаем стратегии асинхронно и обновляем офферы
            Promise.all(
              offersNeedingStrategy.map(async (offer) => {
                if (offer.pricingStrategyId) {
                  try {
                    const strategy = await getStrategyById(offer.pricingStrategyId);
                    return { offerId: offer.id, strategy };
                  } catch (err) {
                    console.warn(`⚠️ Ошибка загрузки стратегии ${offer.pricingStrategyId} для оффера ${offer.id}`);
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
                      if (calculatedPrice !== null) {
                        const originalCostNum = parseFloat(updatedOffer.originalCost);
                        const calculatedPriceNum = parseFloat(calculatedPrice);
                        if (originalCostNum > 0) {
                          updatedOffer.discount = Math.round(
                            ((originalCostNum - calculatedPriceNum) / originalCostNum) * 100
                          );
                        }
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

  // Функция для получения офферов по категории (возвращает результат без сохранения в состояние)
  const fetchOffersByCategory = useCallback(async (categoryId: number): Promise<Offer[]> => {
    try {
      const params = new URLSearchParams();
      params.append('category_ids', categoryId.toString());
      
      // Дефолтные фильтры (годность и наличие)
      const now = new Date();
      const minExpiresDate = now.toISOString();
      params.append('min_expires_date', minExpiresDate);
      params.append('min_count', '1');
      
      let url = getApiUrl(API_ENDPOINTS.OFFERS.WITH_PRODUCTS);
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      console.log('🚀 API FETCH Offers by Category:', url);

      const response = await authFetch(url, {
        method: 'GET',
        requireAuth: false,
      });

      if (response.ok) {
        const data = await response.json();
        const offersData = data.data || data;
        
        if (Array.isArray(offersData)) {
          // Трансформируем офферы
          const transformedOffers = offersData.map(transformOffer);
          return transformedOffers;
        }
        return [];
      } else {
        console.error('❌ API ERROR Offers by Category:', response.status);
        return [];
      }
    } catch (err) {
      console.error('❌ API CRASH Offers by Category:', err);
      return [];
    }
  }, [transformOffer]);

  const getOfferById = (id: number): Offer | undefined => {
    return offers.find((offer) => offer.id === id);
  };

  const getOffersByShop = (shopId: number): Offer[] => {
    return offers.filter((offer) => offer.shopId === shopId);
  };

  const getOffersBySeller = (sellerId: number): Offer[] => {
    return offers.filter((offer) => offer.sellerId === sellerId);
  };

  const getOffersByCategoryLocal = (categoryId: number): Offer[] => {
    return offers.filter((offer) => offer.productCategoryIds.includes(categoryId));
  };

  // Функция для повторной загрузки офферов
  // Можно передать skipExpiredFilter=true, чтобы загрузить все offers включая просроченные
  // Можно передать sellerId для фильтрации по продавцу (для админки)
  const refetch = useCallback(async (options?: { skipExpiredFilter?: boolean; sellerId?: number }) => {
    if (options?.skipExpiredFilter) {
      // Загружаем без дефолтных фильтров (для checkout, где нужны все offers)
      await fetchOffers({ skipDefaultFilters: true, sellerId: options?.sellerId });
    } else {
      // Загружаем с фильтрами по умолчанию (только годные товары в наличии)
      await fetchOffers({ sellerId: options?.sellerId });
    }
  }, [fetchOffers]);
  
  // Специальная функция для админки - загружает все офферы текущего продавца (включая просроченные)
  const fetchOffersForAdmin = useCallback(async (sellerId: number) => {
    await fetchOffers({ skipDefaultFilters: true, sellerId });
  }, [fetchOffers]);

  // Функция для создания нового оффера
  const createOffer = useCallback(async (offerData: {
    product_id: number;
    shop_id: number;
    expires_date: string;
    original_cost?: string;
    current_cost?: string | null;
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
      current_cost?: string | null;
      original_cost?: string;
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
    fetchOffersForAdmin,
    fetchOffersWithLocation,
    fetchOffersByCategory,
    getOfferById,
    getOffersByShop,
    getOffersBySeller,
    getOffersByCategory: getOffersByCategoryLocal,
    createOffer,
    updateOffer,
  };
};
