import { API_ENDPOINTS } from '@/constants/api';
import { getApiUrl } from '@/constants/env';
import { authFetch } from '@/utils/authFetch';

export interface ImageFile {
  uri: string;
  type: string;
  name: string;
}

/**
 * Загружает одно изображение для товара
 * @param productId - ID товара
 * @param imageFile - файл изображения
 * @param order - порядок отображения (опционально, по умолчанию 0)
 * @returns данные загруженного изображения или null при ошибке
 */
export const uploadProductImage = async (
  productId: number,
  imageFile: ImageFile,
  order: number = 0
): Promise<{ id: number; path: string; order: number } | null> => {
  try {
    const formData = new FormData();
    formData.append('file', {
      uri: imageFile.uri,
      type: imageFile.type,
      name: imageFile.name,
    } as any);

    const url = `${getApiUrl(API_ENDPOINTS.PRODUCTS.UPLOAD_IMAGE(productId))}?order=${order}`;

    const response = await authFetch(url, {
      method: 'POST',
      // Не устанавливаем Content-Type - React Native сам добавит правильный заголовок с boundary
      body: formData,
      requireAuth: true,
    });

    if (response.ok) {
      const data = await response.json();
      return data.data || data;
    } else {
      const errorText = await response.text();
      return null;
    }
  } catch (error) {
    return null;
  }
};

/**
 * Загружает несколько изображений для товара одной пачкой
 * @param productId - ID товара
 * @param imageFiles - массив файлов изображений
 * @param startOrder - начальный порядок отображения (опционально, по умолчанию 0)
 * @returns массив данных загруженных изображений
 */
export const uploadProductImagesBatch = async (
  productId: number,
  imageFiles: ImageFile[],
  startOrder: number = 0
): Promise<Array<{ id: number; path: string; order: number }>> => {
  if (imageFiles.length === 0) {
    return [];
  }

  try {
    const formData = new FormData();
    
    // Добавляем все файлы в FormData с полем "files"
    imageFiles.forEach((imageFile) => {
      formData.append('files', {
        uri: imageFile.uri,
        type: imageFile.type,
        name: imageFile.name,
      } as any);
    });

    const url = `${getApiUrl(API_ENDPOINTS.PRODUCTS.UPLOAD_IMAGES_BATCH(productId))}?start_order=${startOrder}`;

    const response = await authFetch(url, {
      method: 'POST',
      // Не устанавливаем Content-Type - React Native сам добавит правильный заголовок с boundary
      body: formData,
      requireAuth: true,
    });

    if (response.ok) {
      const data = await response.json();
      return data.data || data;
    } else {
      const errorText = await response.text();
      return [];
    }
  } catch (error) {
    return [];
  }
};

/**
 * Загружает одно изображение для продавца
 * @param sellerId - ID продавца
 * @param imageFile - файл изображения
 * @param order - порядок отображения (опционально, по умолчанию 0)
 * @returns данные загруженного изображения или null при ошибке
 */
export const uploadSellerImage = async (
  sellerId: number,
  imageFile: ImageFile,
  order: number = 0
): Promise<{ id: number; path: string; order: number } | null> => {
  try {
    const formData = new FormData();
    formData.append('file', {
      uri: imageFile.uri,
      type: imageFile.type,
      name: imageFile.name,
    } as any);

    const url = `${getApiUrl(API_ENDPOINTS.SELLERS.UPLOAD_IMAGE(sellerId))}?order=${order}`;

    const response = await authFetch(url, {
      method: 'POST',
      body: formData,
      requireAuth: true,
    });

    if (response.ok) {
      const data = await response.json();
      return data.data || data;
    } else {
      const errorText = await response.text();
      return null;
    }
  } catch (error) {
    return null;
  }
};

/**
 * Удаляет изображение товара
 * @param imageId - ID изображения
 * @returns true если удалено успешно, false при ошибке
 */
export const deleteProductImage = async (imageId: number): Promise<boolean> => {
  try {
    const url = getApiUrl(API_ENDPOINTS.PRODUCTS.DELETE_IMAGE(imageId));

    const response = await authFetch(url, {
      method: 'DELETE',
      requireAuth: true,
    });

    if (response.ok) {
      return true;
    } else {
      const errorText = await response.text();
      return false;
    }
  } catch (error) {
    return false;
  }
};

/**
 * Удаляет изображение продавца
 * @param imageId - ID изображения
 * @returns true если удалено успешно, false при ошибке
 */
export const deleteSellerImage = async (imageId: number): Promise<boolean> => {
  try {
    const url = getApiUrl(API_ENDPOINTS.SELLERS.DELETE_IMAGE(imageId));

    const response = await authFetch(url, {
      method: 'DELETE',
      requireAuth: true,
    });

    if (response.ok) {
      return true;
    } else {
      const errorText = await response.text();
      return false;
    }
  } catch (error) {
    return false;
  }
};

