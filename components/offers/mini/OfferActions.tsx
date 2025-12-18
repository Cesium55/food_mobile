/**
 * Offer Actions - действия с товаром (цена, добавление в корзину)
 */

import { useThemedStyles } from '@/hooks/useThemeTokens';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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
  
  // Анимация для кнопок
  const addButtonScale = useSharedValue(1);
  const decreaseButtonScale = useSharedValue(1);
  const increaseButtonScale = useSharedValue(1);
  
  // Анимация появления/исчезновения секций
  const notInCartOpacity = useSharedValue(isInCart ? 0 : 1);
  const inCartOpacity = useSharedValue(isInCart ? 1 : 0);
  
  React.useEffect(() => {
    notInCartOpacity.value = withTiming(isInCart ? 0 : 1, { duration: 200 });
    inCartOpacity.value = withTiming(isInCart ? 1 : 0, { duration: 200 });
  }, [isInCart]);
  
  const notInCartStyle = useAnimatedStyle(() => ({
    opacity: notInCartOpacity.value,
    transform: [
      { translateX: interpolate(notInCartOpacity.value, [0, 1], [-50, 0]) },
    ],
  }));
  
  const inCartStyle = useAnimatedStyle(() => ({
    opacity: inCartOpacity.value,
    transform: [
      { translateX: interpolate(inCartOpacity.value, [0, 1], [50, 0]) },
    ],
  }));
  
  const addButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: addButtonScale.value }],
  }));
  
  const decreaseButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: decreaseButtonScale.value }],
  }));
  
  const increaseButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: increaseButtonScale.value }],
  }));
  
  const handleAddPress = () => {
    addButtonScale.value = withSpring(0.85, { damping: 10, stiffness: 400 }, () => {
      addButtonScale.value = withSpring(1, { damping: 10, stiffness: 400 });
    });
    onAdd();
  };
  
  const handleDecreasePress = () => {
    decreaseButtonScale.value = withSpring(0.85, { damping: 10, stiffness: 400 }, () => {
      decreaseButtonScale.value = withSpring(1, { damping: 10, stiffness: 400 });
    });
    onDecrease();
  };
  
  const handleIncreasePress = () => {
    increaseButtonScale.value = withSpring(0.85, { damping: 10, stiffness: 400 }, () => {
      increaseButtonScale.value = withSpring(1, { damping: 10, stiffness: 400 });
    });
    onIncrease();
  };
  
  return (
    <View style={styles.container}>
      {!isInCart && (
        <Animated.View style={[styles.footerRow, notInCartStyle]}>
          <View style={styles.priceContainer}>
            <View style={styles.priceRow}>
              <Text style={styles.currentPrice}>{currentPrice.toFixed(0)} ₽</Text>
              {currentPrice < originalPrice && (
                <Text style={styles.originalPrice}>{originalPrice.toFixed(0)} ₽</Text>
              )}
            </View>
            {distance && (
              <Text style={styles.distance}>{distance}</Text>
            )}
          </View>
          
          <AnimatedPressable 
            style={[styles.addButton, addButtonAnimatedStyle]}
            onPress={handleAddPress}
          >
            <View style={styles.buttonTouchable}>
              <Text style={styles.addButtonText}>+</Text>
            </View>
          </AnimatedPressable>
        </Animated.View>
      )}
      
      {isInCart && (
        <Animated.View style={[styles.footerRowCart, inCartStyle]}>
          <AnimatedPressable 
            style={[styles.cartButton, decreaseButtonAnimatedStyle]}
            onPress={handleDecreasePress}
          >
            <View style={styles.buttonTouchable}>
              <Text style={styles.cartButtonText}>−</Text>
            </View>
          </AnimatedPressable>
          
          <View style={styles.cartInfo}>
            <Text style={styles.cartPrice}>{(currentPrice * quantity).toFixed(0)} ₽</Text>
            <Text style={styles.cartQuantity}>{quantity} шт</Text>
          </View>
          
          {isMaxQuantity ? (
            <Animated.View 
              style={[styles.cartButton, increaseButtonAnimatedStyle]}
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
            </Animated.View>
          ) : (
            <AnimatedPressable 
              style={[styles.cartButton, increaseButtonAnimatedStyle]}
              onPress={handleIncreasePress}
            >
              <View style={styles.buttonTouchable}>
                <Text style={styles.cartButtonText}>+</Text>
              </View>
            </AnimatedPressable>
          )}
        </Animated.View>
      )}
    </View>
  );
}

const createStyles = (tokens: any) => {
  const { colors, spacing, borderRadius, typography, shadows } = tokens;
  
  return StyleSheet.create({
    container: {
      position: 'relative',
      minHeight: 40,
    },
    // Обычное состояние
    footerRow: {
      position: 'absolute',
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
    },
    priceContainer: {
      flex: 1,
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
      ...shadows.xs,
    },
    addButtonText: {
      fontSize: typography.fontSize.xl,
      fontFamily: typography.fontFamily.semibold,
      color: colors.text.primary,
      lineHeight: typography.fontSize.xl,
    },
    
    // Состояние "в корзине"
    footerRowCart: {
      position: 'absolute',
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: spacing.xs,
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
    cartInfo: {
      flex: 1,
      alignItems: 'center',
    },
    cartPrice: {
      fontSize: typography.fontSize.base,
      fontFamily: typography.fontFamily.bold,
      color: colors.text.primary,
    },
    cartQuantity: {
      fontSize: typography.fontSize.xs,
      fontFamily: typography.fontFamily.regular,
      color: colors.text.secondary,
      marginTop: spacing.xxs,
    },
  });
};
