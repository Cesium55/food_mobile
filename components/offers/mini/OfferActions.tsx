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

function formatPrice(value: number): string {
  if (!Number.isFinite(value)) {
    return '0.00';
  }

  return value.toFixed(2);
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
  const quantityOpacity = useSharedValue(isInCart && quantity > 0 ? 1 : 0);
  
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
    quantityOpacity.value = withTiming(isInCart && quantity > 0 ? 1 : 0, config);
  }, [isInCart, quantity]);
  
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
      <View style={[styles.priceContainer, isInCart && styles.priceContainerCenter]}>
        <View style={styles.priceRow}>
          <Text style={styles.currentPrice} numberOfLines={1}>
            {isInCart ? formatPrice(currentPrice * quantity) : formatPrice(currentPrice)} ₽
          </Text>
          {!isInCart && currentPrice < originalPrice && (
            <Animated.Text
              numberOfLines={1}
              style={[styles.originalPrice, strikethroughStyle]}
            >
              {formatPrice(originalPrice)} ₽
            </Animated.Text>
          )}
        </View>

      </View>

      <View style={styles.controlsRow}>
        {isInCart ? (
          <>
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

            <Animated.View style={[styles.quantityBadge, quantityStyle]}>
              <Text style={styles.cartQuantity}>
                {quantity} шт
              </Text>
            </Animated.View>
          </>
        ) : distance ? (
          <Animated.View style={[styles.distanceBadge, distanceStyle]}>
            <Text style={styles.distance}>{distance}</Text>
          </Animated.View>
        ) : (
          <View style={styles.controlsSpacer} />
        )}

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
      minHeight: 72,
    },
    controlsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: spacing.xs,
      minHeight: 32,
      marginTop: spacing.xs,
    },
    minusButton: {
      width: 32,
      height: 32,
    },
    controlsSpacer: {
      flex: 1,
    },
    priceContainer: {
      minHeight: 38,
    },
    priceContainerCenter: {
      alignItems: 'flex-start',
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      flexWrap: 'nowrap',
      gap: spacing.xs,
    },
    currentPrice: {
      flexShrink: 1,
      fontSize: typography.fontSize.lg,
      fontFamily: typography.fontFamily.bold,
      color: colors.text.primary,
    },
    originalPrice: {
      flexShrink: 1,
      fontSize: typography.fontSize.xs,
      fontFamily: typography.fontFamily.regular,
      color: colors.text.tertiary,
      textDecorationLine: 'line-through',
    },
    distance: {
      fontSize: typography.fontSize.sm,
      fontFamily: typography.fontFamily.regular,
      color: colors.text.secondary,
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
      fontSize: typography.fontSize.sm,
      fontFamily: typography.fontFamily.semibold,
      color: colors.text.primary,
      textAlign: 'center',
    },
    quantityBadge: {
      flex: 1,
      justifyContent: 'center',
      minHeight: 24,
    },
    distanceBadge: {
      flex: 1,
      justifyContent: 'center',
      minHeight: 24,
    },
  });
};
