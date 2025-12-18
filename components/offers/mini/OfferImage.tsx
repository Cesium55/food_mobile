/**
 * Offer Image - изображение товара с оверлеями
 */

import { useThemedStyles } from '@/hooks/useThemeTokens';
import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

interface OfferImageProps {
  imageUri: string | null;
  shopImageUri: string | null;
  shopInitial: string;
  timeLeftText: string;
}

export function OfferImage({ imageUri, shopImageUri, shopInitial, timeLeftText }: OfferImageProps) {
  const styles = useThemedStyles(createStyles);
  const [imageError, setImageError] = useState(false);
  const [shopImageError, setShopImageError] = useState(false);
  
  const hasImage = imageUri && !imageError;
  const hasShopImage = shopImageUri && !shopImageError;
  
  return (
    <View style={styles.imageContainer}>
      {hasImage ? (
        <Image
          source={{ uri: imageUri }}
          style={styles.image}
          onError={() => setImageError(true)}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.placeholderImage}>
          <Text style={styles.placeholderText}>
            {shopInitial}
          </Text>
        </View>
      )}
      
      {/* Аватарка магазина */}
      {hasShopImage ? (
        <Image
          source={{ uri: shopImageUri }}
          style={styles.shopAvatarImage}
          onError={() => setShopImageError(true)}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.shopAvatar}>
          <Text style={styles.shopAvatarText}>{shopInitial}</Text>
        </View>
      )}
      
      {/* Срок годности */}
      <View style={styles.expiryBadge}>
        <Text style={styles.expiryText}>{timeLeftText}</Text>
      </View>
    </View>
  );
}

const createStyles = (tokens: any) => {
  const { colors, spacing, borderRadius, typography, shadows } = tokens;
  
  return StyleSheet.create({
    imageContainer: {
      position: 'relative',
      width: '100%',
      height: 160,
      backgroundColor: colors.gray[100],
    },
    image: {
      width: '100%',
      height: '100%',
    },
    placeholderImage: {
      width: '100%',
      height: '100%',
      backgroundColor: colors.gray[200],
      justifyContent: 'center',
      alignItems: 'center',
    },
    placeholderText: {
      fontSize: typography.fontSize.massive,
      fontFamily: typography.fontFamily.bold,
      color: colors.gray[400],
    },
    
    // Аватарка магазина
    shopAvatar: {
      position: 'absolute',
      top: spacing.sm,
      left: spacing.sm,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.primary[500],
      justifyContent: 'center',
      alignItems: 'center',
      ...shadows.sm,
    },
    shopAvatarImage: {
      position: 'absolute',
      top: spacing.sm,
      left: spacing.sm,
      width: 32,
      height: 32,
      borderRadius: 16,
      ...shadows.sm,
    },
    shopAvatarText: {
      fontSize: typography.fontSize.md,
      fontFamily: typography.fontFamily.bold,
      color: colors.common.white,
    },
    
    // Срок годности
    expiryBadge: {
      position: 'absolute',
      bottom: spacing.sm,
      right: spacing.sm,
      backgroundColor: colors.status.warning.bg,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.sm,
    },
    expiryText: {
      fontSize: typography.fontSize.xs,
      fontFamily: typography.fontFamily.semibold,
      color: colors.status.warning.text,
    },
  });
};
