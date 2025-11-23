import CartButton from '@/components/cart/CartButton';
import { Offer } from '@/hooks/useOffers';
import { useShops } from '@/hooks/useShops';
import { useRouter, useSegments } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface VerticalOfferCardProps {
  offer: Offer;
}

export default function VerticalOfferCard({ offer }: VerticalOfferCardProps) {
  const router = useRouter();
  const segments = useSegments();
  const { shops } = useShops();
  
  // Получаем название магазина по shopId
  const shop = shops.find(s => s.id === offer.shopId);
  const shopShortName = offer.shopShortName || shop?.shortName || shop?.name || 'Магазин';

  // Проверяем срок годности
  const now = new Date();
  const expiryDate = new Date(offer.expiresDate);
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isExpired = daysUntilExpiry < 0;

  // Определяем цвет для срока годности
  let expiryColors = { bg: '#E8F5E9', text: '#4CAF50' }; // Зеленый (>3 дней)
  if (isExpired) {
    expiryColors = { bg: '#FFEBEE', text: '#F44336' }; // Красный
  } else if (daysUntilExpiry <= 1) {
    expiryColors = { bg: '#FFF3E0', text: '#FF9800' }; // Оранжевый
  } else if (daysUntilExpiry <= 3) {
    expiryColors = { bg: '#FFF9C4', text: '#FBC02D' }; // Желтый
  }

  const handlePress = () => {
    const currentTab = segments[0] === '(tabs)' ? segments[1] : '(catalog)';
    router.push(`/(tabs)/${currentTab}/product/${offer.id}`);
  };

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={handlePress}
    >
      {/* Изображение товара (заглушка) */}
      <View style={styles.imageContainer}>
        <Text style={styles.imagePlaceholder}>📦</Text>
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>-{offer.discount}%</Text>
        </View>
      </View>

      {/* Информация о товаре */}
      <View style={styles.infoContainer}>
        <Text style={styles.productName} numberOfLines={2}>
          {offer.productName}
        </Text>
        
        <Text style={styles.shopName} numberOfLines={1}>
          {shopShortName}
        </Text>

        {/* Срок годности */}
        <View style={[styles.expiryBadge, { backgroundColor: expiryColors.bg }]}>
          <Text style={[styles.expiryText, { color: expiryColors.text }]}>
            {isExpired ? 'Просрочен' : `${daysUntilExpiry} дн.`}
          </Text>
        </View>

        {/* Цены */}
        <View style={styles.priceContainer}>
          <Text style={styles.originalPrice}>{offer.originalCost.toFixed(0)} ₽</Text>
          <Text style={styles.currentPrice}>{offer.currentCost.toFixed(0)} ₽</Text>
        </View>

        {/* Кнопка управления корзиной */}
        <CartButton offer={offer} size="small" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 12,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#F5F5F5',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  imagePlaceholder: {
    fontSize: 48,
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF5252',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  infoContainer: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    minHeight: 36,
  },
  shopName: {
    fontSize: 12,
    color: '#999',
    marginBottom: 6,
  },
  expiryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 8,
  },
  expiryText: {
    fontSize: 11,
    fontWeight: '600',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  originalPrice: {
    fontSize: 13,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  currentPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4CAF50',
  },
});

