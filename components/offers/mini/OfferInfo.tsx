/**
 * Offer Info - информация о товаре (название и вес)
 */

import { useThemedStyles } from '@/hooks/useThemeTokens';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface OfferInfoProps {
  productName: string;
  weight?: string;
}

export function OfferInfo({ productName, weight = '150г' }: OfferInfoProps) {
  const styles = useThemedStyles(createStyles);
  
  return (
    <View style={styles.headerRow}>
      <Text style={styles.productName} numberOfLines={2}>
        {productName}
      </Text>
      <Text style={styles.weight}>{weight}</Text>
    </View>
  );
}

const createStyles = (tokens: any) => {
  const { colors, spacing, typography } = tokens;
  
  return StyleSheet.create({
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.sm,
      gap: spacing.xs,
    },
    productName: {
      flex: 5,
      fontSize: typography.fontSize.sm,
      fontFamily: typography.fontFamily.semibold,
      color: colors.text.primary,
      lineHeight: typography.lineHeight.sm,
    },
    weight: {
      flex: 1,
      fontSize: typography.fontSize.xs,
      fontFamily: typography.fontFamily.regular,
      color: colors.text.tertiary,
      textAlign: 'right',
    },
  });
};
