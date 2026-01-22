import { Offer } from '@/hooks/useOffers';
import { getImageUrl } from '@/utils/imageUtils';
import React, { useRef, useState } from 'react';
import {
    Image,
    NativeScrollEvent,
    NativeSyntheticEvent,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';

interface ProductImageSectionProps {
  offer: Offer;
}

export default function ProductImageSection({ offer }: ProductImageSectionProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState<boolean[]>([]);
  
  // Получаем все валидные URL изображений
  const imageUrls = (offer.productImages || [])
    .map(img => getImageUrl(img.path))
    .filter((url): url is string => url !== null);
  
  const hasImages = imageUrls.length > 0;
  const hasMultipleImages = imageUrls.length > 1;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const imageWidth = 240; // ширина изображения
    const index = Math.round(scrollPosition / imageWidth);
    setCurrentImageIndex(index);
  };

  const handleImageError = (index: number) => {
    const newErrors = [...imageErrors];
    newErrors[index] = true;
    setImageErrors(newErrors);
  };

  return (
    <View style={styles.container}>
      {hasImages ? (
        <>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
          >
            {imageUrls.map((imageUrl, index) => (
              <Image
                key={index}
                source={{ uri: imageUrl }}
                style={styles.productImage}
                onError={() => handleImageError(index)}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
          
          {/* Индикаторы изображений */}
          {hasMultipleImages && (
            <View style={styles.indicators}>
              {imageUrls.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.indicatorDot,
                    index === currentImageIndex && styles.indicatorDotActive
                  ]}
                />
              ))}
            </View>
          )}
        </>
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.imagePlaceholderText}>
            {offer.productName.charAt(0)}
          </Text>
        </View>
      )}
      
      {/* Бейдж скидки */}
      {offer.discount > 0 && (
        <View style={styles.discountBadge}>
          <Text style={styles.discountBadgeText}>-{offer.discount}%</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 20,
    position: 'relative',
  },
  scrollView: {
    width: 240,
    height: 240,
  },
  scrollContent: {
    alignItems: 'center',
  },
  productImage: {
    width: 240,
    height: 240,
    borderRadius: 20,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 6,
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
  },
  indicatorDotActive: {
    backgroundColor: '#34C759',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  imagePlaceholder: {
    width: 240,
    height: 240,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  imagePlaceholderText: {
    fontSize: 96,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  discountBadge: {
    position: 'absolute',
    top: 24,
    right: 24,
    backgroundColor: '#FF5252',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: '#FF5252',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  discountBadgeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

