/**
 * Card Component - Minimal UI
 * Базовая карточка для контента
 */

import { useThemedStyles } from '@/hooks/useThemeTokens';
import React from 'react';
import { StyleSheet, View, ViewProps, ViewStyle } from 'react-native';

export interface CardProps extends ViewProps {
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Card({
  variant = 'default',
  padding = 'md',
  children,
  style,
  ...props
}: CardProps) {
  const styles = useThemedStyles((tokens) => createStyles(tokens, variant, padding));
  
  return (
    <View style={[styles.card, style]} {...props}>
      {children}
    </View>
  );
}

const createStyles = (tokens: any, variant: string, padding: string) => {
  const { colors, spacing, borderRadius, shadows } = tokens;
  
  // Варианты
  const variantStyles: Record<string, ViewStyle> = {
    default: {
      backgroundColor: colors.surface.default,
      borderWidth: 0,
    },
    elevated: {
      backgroundColor: colors.surface.elevated,
      borderWidth: 0,
      ...shadows.md,
    },
    outlined: {
      backgroundColor: colors.surface.default,
      borderWidth: 1,
      borderColor: colors.border.light,
    },
  };
  
  // Отступы
  const paddingStyles: Record<string, ViewStyle> = {
    none: {
      padding: spacing.none,
    },
    sm: {
      padding: spacing.sm,
    },
    md: {
      padding: spacing.lg,
    },
    lg: {
      padding: spacing.xl,
    },
  };
  
  return StyleSheet.create({
    card: {
      ...variantStyles[variant],
      ...paddingStyles[padding],
      borderRadius: borderRadius.lg,
    },
  });
};
