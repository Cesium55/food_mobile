/**
 * Mini Offer Card - Minimal UI
 * Компактная карточка товара (разбита на подкомпоненты)
 */

import { useCart } from '@/hooks/useCart';
import { Offer } from '@/hooks/useOffers';
import { usePublicSeller } from '@/hooks/usePublicSeller';
import { useThemedStyles } from '@/hooks/useThemeTokens';
import { getDaysUntilExpiry, getExpiryText } from '@/utils/expiryUtils';
import { getFirstImageUrl } from '@/utils/imageUtils';
import { getCurrentPrice } from '@/utils/pricingUtils';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { OfferActions } from './OfferActions';
import { OfferImage } from './OfferImage';
import { OfferInfo } from './OfferInfo';

interface MiniOfferCardProps {
  offer: Offer;
  distance?: number;
  onPress?: () => void;
}

export function MiniOfferCard({ offer, distance, onPress }: MiniOfferCardProps) {
  const styles = useThemedStyles(createStyles);
  const { cartItems, addToCart, increaseQuantity, decreaseQuantity } = useCart();
  const { seller } = usePublicSeller(offer.sellerId || null);
  
  // Проверяем корзину
  const cartItem = cartItems.find(item => item.offerId === offer.id);
  const isInCart = !!cartItem;
  const quantity = cartItem?.quantity || 0;
  
  // Цены
  const currentPrice = getCurrentPrice(offer);
  const originalPrice = parseFloat(offer.originalCost);
  const finalPrice = currentPrice ? parseFloat(currentPrice) : originalPrice;
  
  // Время до истечения с обновлением каждую секунду, если осталось меньше суток
  const daysUntilExpiry = getDaysUntilExpiry(offer.expiresDate);
  const [timeLeftText, setTimeLeftText] = useState(getExpiryText(offer.expiresDate));
  
  // Обновляем время каждую секунду, если осталось меньше суток
  useEffect(() => {
    if (daysUntilExpiry <= 1 && daysUntilExpiry > 0) {
      // Обновляем сразу
      setTimeLeftText(getExpiryText(offer.expiresDate));
      
      // Устанавливаем интервал для обновления каждую секунду
      const interval = setInterval(() => {
        setTimeLeftText(getExpiryText(offer.expiresDate));
      }, 1000);
      
      return () => clearInterval(interval);
    } else {
      // Если больше суток, просто устанавливаем значение один раз
      setTimeLeftText(getExpiryText(offer.expiresDate));
    }
  }, [offer.expiresDate, daysUntilExpiry]);
  
  // Расстояние - если передано, форматируем (distance уже в километрах)
  const distanceText = distance !== undefined
    ? distance < 1 
      ? `${Math.round(distance * 1000)} м`
      : `${distance.toFixed(1)} км`
    : null;
  
  // Изображение товара
  const productImage = getFirstImageUrl(offer.productImages);
  
  // Изображение и название магазина/продавца
  const shopImageUri = getFirstImageUrl(seller?.images);
  const shopInitial = (seller?.short_name || offer.shopShortName || 'M').charAt(0).toUpperCase();
  
  // Обработчики
  const handleCardPress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/(tabs)/(home)/product/${offer.id}`);
    }
  };
  
  const handleAddToCart = () => {
    addToCart(offer);
  };
  
  const handleIncrease = () => {
    if (cartItem && cartItem.quantity < offer.count) {
      increaseQuantity(cartItem.id, offer.count);
    }
  };
  
  const handleDecrease = () => {
    if (cartItem) {
      decreaseQuantity(cartItem.id);
    }
  };
  
  // Проверяем, есть ли динамическая цена
  const hasDynamicPricing = offer.isDynamicPricing && offer.pricingStrategy;
  
  return (
    <Pressable style={styles.card} onPress={handleCardPress}>
      <OfferImage 
        imageUri={productImage}
        shopImageUri={shopImageUri}
        shopInitial={shopInitial}
        timeLeftText={timeLeftText}
        hasDynamicPricing={hasDynamicPricing}
      />
      
      <View style={styles.content}>
        <OfferInfo 
          productName={offer.productName}
          weight={offer.productWeight || ""}
        />
        
        <OfferActions
          isInCart={isInCart}
          currentPrice={finalPrice}
          originalPrice={originalPrice}
          quantity={quantity}
          distance={distanceText}
          onAdd={handleAddToCart}
          onIncrease={handleIncrease}
          onDecrease={handleDecrease}
          isMaxQuantity={quantity >= offer.count}
        />
      </View>
    </Pressable>
  );
}

const createStyles = (tokens: any) => {
  const { colors, borderRadius, spacing } = tokens;
  
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface.default,
      borderRadius: borderRadius.lg,
      overflow: 'hidden',
      width: '100%',
    },
    content: {
      padding: spacing.md,
    },
  });
};
