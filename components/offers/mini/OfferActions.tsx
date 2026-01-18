/**
 * Offer Actions - действия с товаром (цена, добавление в корзину)
 */

import { useThemedStyles } from '@/hooks/useThemeTokens';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

interface OfferActionsProps {
  isInCart: boolean;
  currentPrice: number;
  originalPrice: number;
  quantity: number;
  distance?: string | null;
  onAdd: () => void;
  onIncrease: () => void;
  onDecrease: () => void;
  isMaxQuantity: boolean;
}

export function OfferActions({
  isInCart,
  currentPrice,
  originalPrice,
  quantity,
  distance,
  onAdd,
  onIncrease,
  onDecrease,
  isMaxQuantity,
}: OfferActionsProps) {
  const styles = useThemedStyles(createStyles);
  
  // Анимация для отдельных элементов
  const strikethroughOpacity = useSharedValue(isInCart ? 0 : 1);
  const distanceOpacity = useSharedValue(isInCart ? 0 : 1);
  const minusOpacity = useSharedValue(isInCart ? 1 : 0);
  const quantityOpacity = useSharedValue(isInCart ? 1 : 0);
  
  React.useEffect(() => {
    const config = { 
      duration: 300,
      easing: Easing.out(Easing.quad),
    };
    
    // Зачеркнутая цена и расстояние
    strikethroughOpacity.value = withTiming(isInCart ? 0 : 1, config);
    distanceOpacity.value = withTiming(isInCart ? 0 : 1, config);
    
    // Минус и количество
    minusOpacity.value = withTiming(isInCart ? 1 : 0, config);
    quantityOpacity.value = withTiming(isInCart ? 1 : 0, config);
  }, [isInCart]);
  
  // Зачеркнутая цена и расстояние уезжают/приезжают вправо
  const strikethroughStyle = useAnimatedStyle(() => ({
    opacity: strikethroughOpacity.value,
    transform: [
      { translateX: interpolate(strikethroughOpacity.value, [0, 1], [30, 0]) },
    ],
  }));
  
  const distanceStyle = useAnimatedStyle(() => ({
    opacity: distanceOpacity.value,
    transform: [
      { translateX: interpolate(distanceOpacity.value, [0, 1], [30, 0]) },
    ],
  }));
  
  // Минус приезжает/уезжает слева
  const minusStyle = useAnimatedStyle(() => ({
    opacity: minusOpacity.value,
    transform: [
      { translateX: interpolate(minusOpacity.value, [0, 1], [-30, 0]) },
    ],
  }));
  
  // Количество появляется/исчезает на месте
  const quantityStyle = useAnimatedStyle(() => ({
    opacity: quantityOpacity.value,
  }));
  
  return (
    <View style={styles.container}>
      <View style={styles.footerRow}>
        {/* Минус - появляется слева */}
        {isInCart && (
          <Animated.View style={[styles.minusButton, minusStyle]}>
            <Pressable 
              style={styles.cartButton}
              onPress={onDecrease}
            >
              <View style={styles.buttonTouchable}>
                <Text style={styles.cartButtonText}>−</Text>
              </View>
            </Pressable>
          </Animated.View>
        )}
        
        {/* Цена и информация - всегда видна */}
        <View style={[styles.priceContainer, isInCart && styles.priceContainerCenter]}>
          <View style={styles.priceRow}>
            <Text style={styles.currentPrice}>
              {isInCart ? (currentPrice * quantity).toFixed(0) : currentPrice.toFixed(0)} ₽
            </Text>
            {/* Зачеркнутая цена - уезжает вправо */}
            {!isInCart && currentPrice < originalPrice && (
              <Animated.Text style={[styles.originalPrice, strikethroughStyle]}>
                {originalPrice.toFixed(0)} ₽
              </Animated.Text>
            )}
          </View>
          
          {/* Расстояние или количество */}
          {!isInCart && distance && (
            <Animated.Text style={[styles.distance, distanceStyle]}>
              {distance}
            </Animated.Text>
          )}
          {isInCart && (
            <Animated.Text style={[styles.cartQuantity, quantityStyle]}>
              {quantity} шт
            </Animated.Text>
          )}
        </View>
        
        {/* Плюс - всегда на месте */}
        {isMaxQuantity ? (
          <View 
            style={styles.cartButton}
            onStartShouldSetResponder={() => true}
            onResponderRelease={(e) => {
              e.stopPropagation();
              return true;
            }}
          >
            <View style={[
              styles.buttonTouchable,
              styles.buttonTouchableDisabled
            ]}>
              <Text style={[
                styles.cartButtonText,
                styles.cartButtonTextDisabled
              ]}>+</Text>
            </View>
          </View>
        ) : (
          <Pressable 
            style={styles.addButton}
            onPress={isInCart ? onIncrease : onAdd}
          >
            <View style={styles.buttonTouchable}>
              <Text style={styles.addButtonText}>+</Text>
            </View>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const createStyles = (tokens: any) => {
  const { colors, spacing, borderRadius, typography } = tokens;
  
  return StyleSheet.create({
    container: {
      position: 'relative',
      minHeight: 40,
    },
    // Обычное состояние
    footerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      gap: spacing.xs,
    },
    minusButton: {
      width: 32,
      height: 32,
    },
    priceContainer: {
      flex: 1,
    },
    priceContainerCenter: {
      alignItems: 'center',
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: spacing.xs,
    },
    currentPrice: {
      fontSize: typography.fontSize.lg,
      fontFamily: typography.fontFamily.bold,
      color: colors.text.primary,
    },
    originalPrice: {
      fontSize: typography.fontSize.xs,
      fontFamily: typography.fontFamily.regular,
      color: colors.text.tertiary,
      textDecorationLine: 'line-through',
    },
    distance: {
      fontSize: typography.fontSize.xs,
      fontFamily: typography.fontFamily.regular,
      color: colors.text.secondary,
      marginTop: spacing.xxs,
    },
    addButton: {
      width: 32,
      height: 32,
    },
    buttonTouchable: {
      width: '100%',
      height: '100%',
      borderRadius: 16, // Полный круг
      backgroundColor: colors.gray[200],
      justifyContent: 'center',
      alignItems: 'center',
    },
    addButtonText: {
      fontSize: typography.fontSize.xl,
      fontFamily: typography.fontFamily.semibold,
      color: colors.text.primary,
      lineHeight: typography.fontSize.xl,
    },
    cartButton: {
      width: 32,
      height: 32,
    },
    buttonTouchableDisabled: {
      backgroundColor: colors.gray[300],
    },
    cartButtonText: {
      fontSize: typography.fontSize.xl,
      fontFamily: typography.fontFamily.semibold,
      color: colors.text.primary,
      lineHeight: typography.fontSize.xl,
    },
    cartButtonTextDisabled: {
      color: colors.gray[500],
    },
    cartQuantity: {
      fontSize: typography.fontSize.xs,
      fontFamily: typography.fontFamily.regular,
      color: colors.text.secondary,
      marginTop: spacing.xxs,
    },
  });
};
