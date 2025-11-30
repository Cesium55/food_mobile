import { Offer } from '@/hooks/useOffers';
import { getFirstImageUrl } from '@/utils/imageUtils';
import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

interface ProductImageSectionProps {
  offer: Offer;
}

export default function ProductImageSection({ offer }: ProductImageSectionProps) {
  const [imageError, setImageError] = useState(false);
  
  // Получаем URL первого изображения
  const imageUrl = getFirstImageUrl(offer.productImages);
  const hasImage = imageUrl && !imageError;

  return (
    <View style={styles.container}>
      {hasImage ? (
        <Image
          source={{ uri: imageUrl! }}
          style={styles.productImage}
          onError={() => setImageError(true)}
          resizeMode="cover"
        />
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
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 40,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  productImage: {
    width: 240,
    height: 240,
    borderRadius: 20,
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

