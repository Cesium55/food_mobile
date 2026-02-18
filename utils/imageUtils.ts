import { config } from '@/constants/config';
import { ProductImage } from '@/hooks/useOffers';
import { ImageItem } from '@/hooks/usePublicSeller';

// Общий тип для изображений (совместим с ProductImage и ImageItem)
type ImageWithPath = {
  id: number;
  path: string;
  order: number;
};

/**
 * Получает полный URL изображения из S3 бакета
 * @param imagePath - путь к изображению (например, "products/f57bd0dc-fb33-4fed-adae-9875c27a4a1e.jpg")
 * @returns полный URL изображения или null, если путь не указан
 */
export const getImageUrl = (imagePath: string | null | undefined): string | null => {
  // Проверяем, что imagePath является строкой
  if (!imagePath || typeof imagePath !== 'string') {
    return null;
  }

  const s3Prefix = config.s3BucketPrefix;
  if (!s3Prefix) {
    return null;
  }

  // Убираем начальный слеш, если он есть
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
  
  // Убираем конечный слеш из префикса, если он есть
  const cleanPrefix = s3Prefix.endsWith('/') ? s3Prefix.slice(0, -1) : s3Prefix;
  
  const fullUrl = `${cleanPrefix}/${cleanPath}`;
  
  // Логируем URL для изображений продавца
  if (cleanPath.includes('sellers/') || cleanPath.startsWith('sellers/')) {
    console.log('[Seller Image URL]', {
      path: cleanPath,
      fullUrl: fullUrl,
    });
  }
  
  return fullUrl;
};

/**
 * Получает URL первого изображения из массива изображений товара или продавца
 * @param images - массив изображений (ProductImage[] или ImageItem[])
 * @returns URL первого изображения или null, если изображений нет
 */
export const getFirstImageUrl = (images: (ProductImage | ImageItem)[] | null | undefined): string | null => {
  if (!images || images.length === 0) {
    return null;
  }

  // Сортируем по order и берем первое изображение
  const sortedImages = [...images].sort((a, b) => a.order - b.order);
  return getImageUrl(sortedImages[0].path);
};

