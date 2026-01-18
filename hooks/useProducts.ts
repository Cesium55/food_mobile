import { API_ENDPOINTS } from '@/constants/api';
import { getApiUrl } from '@/constants/env';
import { authFetch } from '@/utils/authFetch';
import { useCallback, useEffect, useState } from 'react';

// Интерфейс для атрибута товара (с сервера)
export interface ProductAttribute {
  id: number;
  product_id: number;
  slug: string;
  name: string;
  value: string;
}

// Интерфейс товара с сервера
export interface ProductApi {
  id: number;
  name: string;
  description: string;
  article: string;
  code: string;
  seller_id: number;
  images: string[];
  attributes: ProductAttribute[];
  category_ids?: number[]; // Может быть не в ответе, если категории приходят отдельно
}

// Локальный интерфейс товара (для использования в приложении)
export interface Product {
  id: number;
  name: string;
  description: string;
  article: string;
  code: string;
  seller_id: number;
  category_ids: number[]; // Массив ID категорий
  images: string[];
  characteristics: { [key: string]: string }; // Преобразованные из attributes
}

export const useProducts = (sellerId?: number, options?: { requireAuth?: boolean }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Преобразование данных с сервера в локальный формат
  const transformProduct = useCallback((apiProduct: ProductApi): Product => {
    // Преобразуем attributes в объект characteristics
    const characteristics: { [key: string]: string } = {};
    apiProduct.attributes?.forEach(attr => {
      characteristics[attr.name] = attr.value;
    });

    return {
      id: apiProduct.id,
      name: apiProduct.name,
      description: apiProduct.description || '',
      article: apiProduct.article || '',
      code: apiProduct.code || '',
      seller_id: apiProduct.seller_id,
      category_ids: apiProduct.category_ids || [], // Если категории не приходят, используем пустой массив
      images: apiProduct.images || [],
      characteristics,
    };
  }, []);

  // Функция для загрузки товаров с сервера
  const fetchProducts = useCallback(async (filters?: { categoryIds?: number[] }) => {
    try {
      setLoading(true);
      setError(null);
      
      // Формируем URL с параметрами фильтрации
      const params = new URLSearchParams();
      
      if (sellerId !== undefined) {
        params.append('seller_id', sellerId.toString());
      }

      if (filters?.categoryIds && filters.categoryIds.length > 0) {
        filters.categoryIds.forEach(id => {
          params.append('category_ids', id.toString());
        });
      }
      
      let url = getApiUrl(API_ENDPOINTS.PRODUCTS.BASE);
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await authFetch(url, {
        method: 'GET',
        requireAuth: options?.requireAuth ?? true, // По умолчанию как было (для админки), но можно переопределить
      });

      if (response.ok) {
        const data = await response.json();
        // Ожидаем структуру ответа: { data: ProductApi[] }
        const productsData = data.data || data;
        
        if (Array.isArray(productsData)) {
          // Преобразуем данные с сервера в локальный формат
          const transformedProducts = productsData.map(transformProduct);
          setProducts(transformedProducts);
        } else {
          setError('Неверный формат данных товаров');
          setProducts([]);
        }
      } else if (response.status === 404) {
        setError('Товары не найдены');
        setProducts([]);
      } else {
        const errorText = await response.text();
        setError('Ошибка загрузки товаров');
        setProducts([]);
      }
    } catch (err) {
      setError('Ошибка подключения к серверу');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [transformProduct, sellerId]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Получить товар по ID
  const getProductById = (id: number): Product | undefined => {
    return products.find((product) => product.id === id);
  };

  // Получить товары по категории
  const getProductsByCategory = (categoryId: number): Product[] => {
    return products.filter((product) => product.category_ids.includes(categoryId));
  };

  // Функция для загрузки одного товара по ID
  const fetchProductById = useCallback(async (productId: number): Promise<Product | null> => {
    try {
      const response = await authFetch(getApiUrl(`${API_ENDPOINTS.PRODUCTS.BASE}/${productId}`), {
        method: 'GET',
        requireAuth: true,
      });

      if (response.ok) {
        const data = await response.json();
        const productData = data.data || data;
        // Преобразуем данные с сервера в локальный формат
        return transformProduct(productData as ProductApi);
      } else if (response.status === 404) {
        return null;
      } else {
        const errorText = await response.text();
        return null;
      }
    } catch (err) {
      return null;
    }
  }, [transformProduct]);

  // Функция для повторной загрузки товаров
  const refetch = useCallback(async () => {
    await fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    refetch,
    getProductById,
    getProductsByCategory,
    fetchProductById,
  };
};

