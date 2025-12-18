import CartButton from '@/components/cart/CartButton';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useLocation } from '@/hooks/useLocation';
import { Offer } from '@/hooks/useOffers';
import { usePublicSeller } from '@/hooks/usePublicSeller';
import { useShops } from '@/hooks/useShops';
import { getFirstImageUrl } from '@/utils/imageUtils';
import { calculateDistance, formatDistance } from '@/utils/locationUtils';
import { getCurrentPrice } from '@/utils/pricingUtils';
import { useRouter, useSegments } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface VerticalOfferCardProps {
  offer: Offer;
}

export default function VerticalOfferCard({ offer }: VerticalOfferCardProps) {
  const router = useRouter();
  const segments = useSegments();
  const { shops } = useShops();
  const { seller } = usePublicSeller(offer.sellerId || null);
  const { coords: userLocation } = useLocation();
  const [imageError, setImageError] = useState(false);
  
  // Получаем название продавца или магазина
  const shop = shops.find(s => s.id === offer.shopId);
  const shopShortName = seller?.short_name || offer.shopShortName || shop?.shortName || shop?.name || 'Магазин';
  
  // Вычисляем дистанцию до магазина
  const distance = useMemo(() => {
    if (!userLocation || !shop?.latitude || !shop?.longitude) {
      return null;
    }
    const dist = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      shop.latitude,
      shop.longitude
    );
    return formatDistance(dist);
  }, [userLocation, shop]);
  
  // Получаем URL первого изображения
  const imageUrl = getFirstImageUrl(offer.productImages);
  const hasImage = imageUrl && !imageError;

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
      style={[styles.card, offer.isDynamicPricing && styles.dynamicPricingCard]}
      activeOpacity={0.7}
      onPress={handlePress}
    >
      {/* Изображение товара */}
      <View style={styles.imageContainer}>
        {hasImage ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.productImage}
            onError={() => setImageError(true)}
            resizeMode="cover"
          />
        ) : (
          <Text style={styles.imagePlaceholder}>
            {offer.productName.charAt(0)}
          </Text>
        )}
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
          {(() => {
            const currentPrice = getCurrentPrice(offer);
            const hasDiscount = currentPrice !== null && currentPrice < offer.originalCost;
            
            return (
              <>
                {hasDiscount && (
                  <Text style={styles.originalPrice}>{offer.originalCost.toFixed(0)} ₽</Text>
                )}
                <View style={styles.currentPriceContainer}>
                  {currentPrice !== null ? (
                    <>
                      <Text style={styles.currentPrice}>{currentPrice.toFixed(0)} ₽</Text>
                      {offer.isDynamicPricing && (
                        <IconSymbol name="chart.line.uptrend.xyaxis" size={12} color="#007AFF" />
                      )}
                    </>
                  ) : (
                    <Text style={styles.expiredPrice}>Просрочен</Text>
                  )}
                </View>
              </>
            );
          })()}
        </View>

        {/* Кнопка управления корзиной и дистанция */}
        <View style={styles.cartButtonRow}>
          <View style={styles.cartButtonLeft}>
            <CartButton offer={offer} size="small" />
          </View>
          {distance && (
            <View style={styles.cartButtonRight}>
              <Text style={styles.distance}>{distance}</Text>
            </View>
          )}
        </View>
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
  dynamicPricingCard: {
    backgroundColor: '#FFF3E0', // Оранжевый фон для динамической цены
    borderWidth: 1,
    borderColor: '#FFB74D',
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
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#4CAF50',
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
  currentPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  currentPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4CAF50',
  },
  dynamicPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dynamicPriceText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  expiredPrice: {
    fontSize: 12,
    color: '#F44336',
    fontWeight: '500',
  },
  cartButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cartButtonLeft: {
    flex: 1,
  },
  cartButtonRight: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  distance: {
    fontSize: 11,
    color: '#999',
  },
});

