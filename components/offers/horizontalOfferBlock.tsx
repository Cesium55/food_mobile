import { Offer } from '@/hooks/useOffers';
import { useShops } from '@/hooks/useShops';
import { useRouter, useSegments } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const IMAGE_SIZE = 100;

interface HorizontalOfferBlockProps {
  offer: Offer;
  onPress?: (offer: Offer) => void;
}

export default function HorizontalOfferBlock({ offer, onPress }: HorizontalOfferBlockProps) {
  const router = useRouter();
  const segments = useSegments();
  const { shops } = useShops();
  
  // Получаем название магазина по shopId
  const shop = shops.find(s => s.id === offer.shopId);
  const shopShortName = offer.shopShortName || shop?.shortName || shop?.name || 'Магазин';
  
  const daysUntilExpiry = Math.ceil(
    (new Date(offer.expiresDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  const handlePress = () => {
    if (onPress) {
      onPress(offer);
    } else {
      // Определяем текущую вкладку и переходим в product внутри неё
      const currentTab = segments[0] === '(tabs)' ? segments[1] : '(home)';
      router.push(`/(tabs)/${currentTab}/product/${offer.id}`);
    }
  };

  const getExpiryColor = () => {
    if (daysUntilExpiry >= 7) return { bg: '#E8F5E9', text: '#4CAF50' };
    if (daysUntilExpiry >= 3) return { bg: '#FFF3E0', text: '#F57C00' };
    return { bg: '#FFEBEE', text: '#F44336' };
  };

  const expiryColors = getExpiryColor();

  return (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.7}
      onPress={handlePress}
    >
      {/* Бейдж со скидкой в правом верхнем углу блока */}
      <View style={styles.discountBadge}>
        <Text style={styles.discountText}>-{offer.discount}%</Text>
      </View>

      {/* Изображение товара слева */}
      <View style={styles.imageContainer}>
        <View style={styles.imagePlaceholder}>
          <Text style={styles.imagePlaceholderText}>
            {offer.productName.charAt(0)}
          </Text>
        </View>
      </View>

      {/* Информация о товаре справа */}
      <View style={styles.infoContainer}>
        <View style={styles.topInfo}>
          <Text style={styles.shopName} numberOfLines={1}>
            {shopShortName}
          </Text>
          
          <Text style={styles.productName} numberOfLines={2}>
            {offer.productName}
          </Text>
        </View>

        <View style={styles.bottomInfo}>
          {/* Срок годности */}
          <View style={[styles.expiryContainer, { backgroundColor: expiryColors.bg }]}>
            <Text style={[styles.expiryText, { color: expiryColors.text }]}>
              {daysUntilExpiry} {getDaysWord(daysUntilExpiry)}
            </Text>
          </View>

          {/* Цены */}
          <View style={styles.priceContainer}>
            <Text style={styles.originalPrice}>
              {offer.originalCost.toFixed(2)} ₽
            </Text>
            <Text style={styles.currentPrice}>
              {offer.currentCost.toFixed(2)} ₽
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const getDaysWord = (days: number): string => {
  if (days === 1) return 'день';
  if (days >= 2 && days <= 4) return 'дня';
  return 'дней';
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: IMAGE_SIZE * 0.12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: IMAGE_SIZE,
    position: 'relative',
  },
  discountBadge: {
    position: 'absolute',
    top: IMAGE_SIZE * 0.08,
    right: IMAGE_SIZE * 0.08,
    backgroundColor: '#FF5252',
    borderRadius: IMAGE_SIZE * 0.04,
    paddingHorizontal: IMAGE_SIZE * 0.08,
    paddingVertical: IMAGE_SIZE * 0.03,
    zIndex: 10,
  },
  discountText: {
    color: '#fff',
    fontSize: IMAGE_SIZE * 0.12,
    fontWeight: 'bold',
  },
  imageContainer: {
    width: IMAGE_SIZE * 1.12,
    height: IMAGE_SIZE * 1.12,
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
  },
  imagePlaceholderText: {
    fontSize: IMAGE_SIZE * 0.4,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  infoContainer: {
    flex: 1,
    padding: IMAGE_SIZE * 0.12,
    justifyContent: 'space-between',
  },
  topInfo: {
    flex: 1,
  },
  shopName: {
    fontSize: IMAGE_SIZE * 0.12,
    color: '#666',
    marginBottom: IMAGE_SIZE * 0.04,
  },
  productName: {
    fontSize: IMAGE_SIZE * 0.14,
    fontWeight: '600',
    color: '#333',
    lineHeight: IMAGE_SIZE * 0.18,
  },
  bottomInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: IMAGE_SIZE * 0.08,
  },
  expiryContainer: {
    borderRadius: IMAGE_SIZE * 0.04,
    paddingHorizontal: IMAGE_SIZE * 0.08,
    paddingVertical: IMAGE_SIZE * 0.04,
  },
  expiryText: {
    fontSize: IMAGE_SIZE * 0.11,
    fontWeight: '500',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  originalPrice: {
    fontSize: IMAGE_SIZE * 0.11,
    color: '#999',
    textDecorationLine: 'line-through',
    marginBottom: IMAGE_SIZE * 0.02,
  },
  currentPrice: {
    fontSize: IMAGE_SIZE * 0.18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
});

