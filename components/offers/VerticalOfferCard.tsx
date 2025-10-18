import { useCart } from '@/hooks/useCart';
import { Offer } from '@/hooks/useOffers';
import { useRouter, useSegments } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface VerticalOfferCardProps {
  offer: Offer;
}

export default function VerticalOfferCard({ offer }: VerticalOfferCardProps) {
  const router = useRouter();
  const segments = useSegments();
  const { cartItems, addToCart, increaseQuantity, decreaseQuantity } = useCart();

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

  // Проверяем, есть ли товар в корзине
  const cartItem = cartItems.find(item => item.offerId === offer.id);
  const isInCart = !!cartItem;

  const handlePress = () => {
    const currentTab = segments[0] === '(tabs)' ? segments[1] : '(catalog)';
    router.push(`/(tabs)/${currentTab}/product/${offer.id}`);
  };

  const handleAddToCart = (e: any) => {
    e.stopPropagation();
    if (!isExpired) {
      addToCart(offer);
    }
  };

  const handleIncrease = (e: any) => {
    e.stopPropagation();
    if (cartItem && cartItem.quantity < offer.count) {
      increaseQuantity(cartItem.id);
    }
  };

  const handleDecrease = (e: any) => {
    e.stopPropagation();
    if (cartItem) {
      decreaseQuantity(cartItem.id);
    }
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
          {offer.shopShortName}
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

        {/* Кнопка добавления в корзину или управление количеством */}
        {isExpired ? (
          <View style={styles.expiredButton}>
            <Text style={styles.expiredButtonText}>Просрочен</Text>
          </View>
        ) : isInCart && cartItem ? (
          <View style={styles.quantityControls}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={handleDecrease}
              activeOpacity={0.7}
            >
              <Text style={styles.quantityButtonText}>−</Text>
            </TouchableOpacity>

            <Text style={styles.quantityText}>{cartItem.quantity}</Text>

            <TouchableOpacity
              style={[
                styles.quantityButton,
                cartItem.quantity >= offer.count && styles.quantityButtonDisabled
              ]}
              onPress={handleIncrease}
              disabled={cartItem.quantity >= offer.count}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.quantityButtonText,
                cartItem.quantity >= offer.count && styles.quantityButtonTextDisabled
              ]}>+</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddToCart}
            activeOpacity={0.7}
          >
            <Text style={styles.addButtonText}>В корзину</Text>
          </TouchableOpacity>
        )}
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
  addButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  quantityButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 22,
  },
  quantityButtonTextDisabled: {
    color: '#999',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  expiredButton: {
    backgroundColor: '#FFEBEE',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  expiredButtonText: {
    color: '#F44336',
    fontSize: 14,
    fontWeight: '600',
  },
});

