/**
 * Hook для доступа ко всем дизайн-токенам
 * Объединяет тему, токены и утилиты в одном месте
 */

import { borderRadius, layout, opacity, shadows, spacing, transitions, typography, zIndex } from '@/constants/tokens';
import { useColors, useTheme } from '@/contexts/ThemeContext';
import { useMemo } from 'react';

/**
 * Главный хук для работы с дизайн-токенами
 * Возвращает все необходимое для стилизации компонентов
 */
export function useThemeTokens() {
  const { theme, isDark, themeMode, setThemeMode, toggleTheme } = useTheme();
  const colors = useColors();

  return useMemo(() => ({
    // Theme
    theme,
    colors,
    isDark,
    themeMode,
    setThemeMode,
    toggleTheme,

    // Tokens
    spacing,
    borderRadius,
    shadows,
    typography,
    layout,
    zIndex,
    opacity,
    transitions,
  }), [theme, colors, isDark, themeMode, setThemeMode, toggleTheme]);
}

/**
 * Hook для получения только spacing токенов
 */
export function useSpacing() {
  return spacing;
}

/**
 * Hook для получения только borderRadius токенов
 */
export function useBorderRadius() {
  return borderRadius;
}

/**
 * Hook для получения только shadows токенов
 */
export function useShadows() {
  return shadows;
}

/**
 * Hook для получения только typography токенов
 */
export function useTypography() {
  return typography;
}

/**
 * Hook для получения только layout токенов
 */
export function useLayout() {
  return layout;
}

/**
 * Утилита для быстрого создания стилей с токенами
 * Использование: const styles = useThemedStyles(createStyles)
 */
export function useThemedStyles<T>(styleCreator: (tokens: ReturnType<typeof useThemeTokens>) => T): T {
  const tokens = useThemeTokens();
  return useMemo(() => styleCreator(tokens), [tokens]);
}
