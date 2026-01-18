import { API_ENDPOINTS } from '@/constants/api';
import { getApiUrl } from '@/constants/env';
import { authFetch } from '@/utils/authFetch';
import { useCallback, useEffect, useState } from 'react';
import { PricingStrategy } from './useOffers';

// Интерфейс шага стратегии с сервера
interface PricingStrategyStepApi {
  id: number;
  strategy_id: number;
  time_remaining_seconds: number;
  discount_percent: number;
}

// Интерфейс стратегии с сервера
interface PricingStrategyApi {
  id: number;
  name: string;
  steps: PricingStrategyStepApi[];
}

// Интерфейс для кэшированной стратегии с временем создания
interface CachedStrategy {
  strategy: PricingStrategy;
  timestamp: number;
}

// Интерфейс для кэшированного списка стратегий
interface CachedStrategiesList {
  strategies: PricingStrategy[];
  timestamp: number;
}

// Время жизни кэша в миллисекундах (10 минут)
const CACHE_TTL = 10 * 60 * 1000;

// ГЛОБАЛЬНЫЙ кэш для стратегий (вне хука, чтобы был общим для всех инстансов)
const strategyCache = new Map<number, CachedStrategy>();
// ГЛОБАЛЬНЫЙ кэш для списка всех стратегий
let cachedStrategiesList: CachedStrategiesList | null = null;
// ГЛОБАЛЬНЫЙ кэш для промисов загрузки (чтобы избежать дублирующихся запросов)
const loadingPromises = new Map<number, Promise<PricingStrategy | null>>();
let loadingListPromise: Promise<PricingStrategy[]> | null = null;

export const usePricingStrategies = () => {
  const [strategies, setStrategies] = useState<PricingStrategy[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Преобразование данных с сервера в локальный формат
  const transformStrategy = useCallback((apiStrategy: PricingStrategyApi): PricingStrategy => {
    return {
      id: apiStrategy.id,
      name: apiStrategy.name,
      steps: apiStrategy.steps.map(step => ({
        id: step.id,
        strategy_id: step.strategy_id,
        time_remaining_seconds: step.time_remaining_seconds,
        discount_percent: step.discount_percent,
      })),
    };
  }, []);

  // Функция для проверки валидности кэша
  const isCacheValid = useCallback((timestamp: number): boolean => {
    return Date.now() - timestamp < CACHE_TTL;
  }, []);

  // Функция для загрузки всех стратегий
  const fetchStrategies = useCallback(async () => {
    // Проверяем кэш списка стратегий
    if (cachedStrategiesList && isCacheValid(cachedStrategiesList.timestamp)) {
      setStrategies(cachedStrategiesList.strategies);
      return;
    }

    // Проверяем, не идет ли уже загрузка списка
    if (loadingListPromise) {
      try {
        const strategies = await loadingListPromise;
        setStrategies(strategies);
        return;
      } catch (err) {
        // Если загрузка не удалась, продолжаем с новым запросом
      }
    }

    try {
      setLoading(true);
      setError(null);

      // Создаем промис загрузки
      const loadPromise = (async () => {
        const url = getApiUrl(API_ENDPOINTS.OFFERS.PRICING_STRATEGIES);
        const response = await authFetch(url, {
          method: 'GET',
          requireAuth: true,
        });

        if (response.ok) {
          const data = await response.json();
          const strategiesData = data.data || data;

          if (Array.isArray(strategiesData)) {
            const transformedStrategies = strategiesData.map(transformStrategy);
            
            // Сохраняем в кэш списка
            cachedStrategiesList = {
              strategies: transformedStrategies,
              timestamp: Date.now(),
            };
            
            // Обновляем глобальный кэш отдельных стратегий
            transformedStrategies.forEach(strategy => {
              strategyCache.set(strategy.id, {
                strategy,
                timestamp: Date.now(),
              });
            });
            
            return transformedStrategies;
          } else {
            throw new Error('Неверный формат данных стратегий');
          }
        } else if (response.status === 404) {
          throw new Error('Стратегии не найдены');
        } else {
          throw new Error('Ошибка загрузки стратегий');
        }
      })();

      loadingListPromise = loadPromise;
      const transformedStrategies = await loadPromise;
      loadingListPromise = null;
      
      setStrategies(transformedStrategies);
    } catch (err) {
      loadingListPromise = null;
      setError(err instanceof Error ? err.message : 'Ошибка подключения к серверу');
      setStrategies([]);
    } finally {
      setLoading(false);
    }
  }, [transformStrategy, isCacheValid]);

  // Функция для получения конкретной стратегии по ID
  const getStrategyById = useCallback(async (id: number): Promise<PricingStrategy | null> => {
    // Проверяем глобальный кэш с проверкой времени жизни
    const cached = strategyCache.get(id);
    if (cached && isCacheValid(cached.timestamp)) {
      return cached.strategy;
    }
    
    // Если кэш устарел, удаляем его
    if (cached) {
      strategyCache.delete(id);
    }
    
    // Проверяем, не идет ли уже загрузка этой стратегии
    const existingPromise = loadingPromises.get(id);
    if (existingPromise) {
      return existingPromise;
    }
    
    // Создаем промис загрузки
    const loadingPromise = (async () => {
      try {
        const url = getApiUrl(API_ENDPOINTS.OFFERS.PRICING_STRATEGY_BY_ID(id));
        const response = await authFetch(url, {
          method: 'GET',
          requireAuth: true,
        });

        if (response.ok) {
          const data = await response.json();
          const strategyData = data.data || data;
          const strategy = transformStrategy(strategyData as PricingStrategyApi);
          
          // Сохраняем в глобальный кэш с временем создания
          strategyCache.set(id, {
            strategy,
            timestamp: Date.now(),
          });
          
          return strategy;
        } else if (response.status === 404) {
          return null;
        } else {
          throw new Error('Ошибка загрузки стратегии');
        }
      } catch (err) {
        throw err;
      } finally {
        // Удаляем промис из кэша загрузок
        loadingPromises.delete(id);
      }
    })();
    
    // Сохраняем промис в глобальный кэш загрузок
    loadingPromises.set(id, loadingPromise);
    
    return loadingPromise;
  }, [transformStrategy, isCacheValid]);

  // Функция для очистки глобального кэша (на случай если нужно обновить данные)
  const clearCache = useCallback(() => {
    strategyCache.clear();
    cachedStrategiesList = null;
    loadingPromises.clear();
    loadingListPromise = null;
  }, []);

  // Загружаем стратегии при монтировании компонента
  useEffect(() => {
    fetchStrategies();
  }, [fetchStrategies]);

  return {
    strategies,
    loading,
    error,
    fetchStrategies,
    getStrategyById,
    clearCache,
  };
};
