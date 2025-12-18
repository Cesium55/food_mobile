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

// ГЛОБАЛЬНЫЙ кэш для стратегий (вне хука, чтобы был общим для всех инстансов)
const strategyCache = new Map<number, PricingStrategy>();
// ГЛОБАЛЬНЫЙ кэш для промисов загрузки (чтобы избежать дублирующихся запросов)
const loadingPromises = new Map<number, Promise<PricingStrategy | null>>();

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

  // Функция для загрузки всех стратегий
  const fetchStrategies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

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
          setStrategies(transformedStrategies);
          
          // Обновляем глобальный кэш
          transformedStrategies.forEach(strategy => {
            strategyCache.set(strategy.id, strategy);
          });
        } else {
          setError('Неверный формат данных стратегий');
          setStrategies([]);
        }
      } else if (response.status === 404) {
        setError('Стратегии не найдены');
        setStrategies([]);
      } else {
        const errorText = await response.text();
        setError('Ошибка загрузки стратегий');
        setStrategies([]);
      }
    } catch (err) {
      setError('Ошибка подключения к серверу');
      setStrategies([]);
    } finally {
      setLoading(false);
    }
  }, [transformStrategy]);

  // Функция для получения конкретной стратегии по ID
  const getStrategyById = useCallback(async (id: number): Promise<PricingStrategy | null> => {
    // Проверяем глобальный кэш
    const cached = strategyCache.get(id);
    if (cached) {
      return cached;
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
          
          // Сохраняем в глобальный кэш
          strategyCache.set(id, strategy);
          
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
  }, [transformStrategy]);

  // Функция для очистки глобального кэша (на случай если нужно обновить данные)
  const clearCache = useCallback(() => {
    strategyCache.clear();
    loadingPromises.clear();
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
