/**
 * Button Component - Minimal UI
 * Переиспользуемая кнопка с поддержкой тем
 */

import { useThemedStyles } from '@/hooks/useThemeTokens';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TextStyle, TouchableOpacity, ViewStyle } from 'react-native';

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  onPress?: () => void;
  children: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  onPress,
  children,
  style,
  textStyle,
}: ButtonProps) {
  const styles = useThemedStyles((tokens) => createStyles(tokens, variant, size, fullWidth));
  
  const isDisabled = disabled || loading;
  
  return (
    <TouchableOpacity
      style={[styles.button, isDisabled && styles.disabled, style]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={styles.text.color} size="small" />
      ) : (
        <Text style={[styles.text, textStyle]}>{children}</Text>
      )}
    </TouchableOpacity>
  );
}

const createStyles = (tokens: any, variant: string, size: string, fullWidth: boolean) => {
  const { colors, spacing, borderRadius, typography, layout, shadows, opacity } = tokens;
  
  // Варианты стилей
  const variantStyles: Record<string, any> = {
    primary: {
      backgroundColor: colors.primary[500],
      borderWidth: 0,
    },
    secondary: {
      backgroundColor: colors.secondary[500],
      borderWidth: 0,
    },
    outline: {
      backgroundColor: colors.common.transparent,
      borderWidth: 1,
      borderColor: colors.border.default,
    },
    ghost: {
      backgroundColor: colors.common.transparent,
      borderWidth: 0,
    },
  };
  
  // Размеры
  const sizeStyles: Record<string, any> = {
    sm: {
      height: layout.buttonHeight.sm,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.sm,
    },
    md: {
      height: layout.buttonHeight.md,
      paddingHorizontal: spacing.lg,
      borderRadius: borderRadius.md,
    },
    lg: {
      height: layout.buttonHeight.lg,
      paddingHorizontal: spacing.xl,
      borderRadius: borderRadius.lg,
    },
  };
  
  // Цвета текста
  const textColors: Record<string, string> = {
    primary: colors.common.white,
    secondary: colors.common.white,
    outline: colors.text.primary,
    ghost: colors.primary[500],
  };
  
  // Размеры текста
  const textSizes: Record<string, any> = {
    sm: {
      fontSize: typography.fontSize.sm,
    },
    md: {
      fontSize: typography.fontSize.md,
    },
    lg: {
      fontSize: typography.fontSize.base,
    },
  };
  
  return StyleSheet.create({
    button: {
      ...variantStyles[variant],
      ...sizeStyles[size],
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      ...(variant !== 'ghost' && shadows.xs),
      ...(fullWidth && { width: '100%' }),
    },
    text: {
      color: textColors[variant],
      ...textSizes[size],
      fontFamily: typography.fontFamily.semibold,
    },
    disabled: {
      opacity: opacity.disabled,
    },
  });
};
