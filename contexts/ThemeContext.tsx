/**
 * Theme Context - управление темой приложения
 * Предоставляет доступ к текущей теме и функции переключения
 */

import { lightTheme, Theme } from '@/constants/theme';
import React, { createContext, ReactNode, useContext, useState } from 'react';

// Типы темы
export type ThemeMode = 'light' | 'dark' | 'auto';

// Тип контекста
interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

// Создаем контекст
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Props для Provider
interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Theme Provider - оборачивает приложение и предоставляет доступ к теме
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');

  // Приложение работает только в светлой теме независимо от системных настроек.
  const getActiveTheme = (): Theme => {
    return lightTheme;
  };

  const theme = getActiveTheme();
  const isDark = theme.isDark;

  // Установка темы
  const setThemeMode = async (mode: ThemeMode) => {
    if (mode !== 'light') {
      setThemeModeState('light');
      return;
    }
    setThemeModeState('light');
  };

  // Переключение между светлой и темной темой
  const toggleTheme = async () => {
    await setThemeMode('light');
  };

  const value: ThemeContextType = {
    theme,
    themeMode,
    isDark,
    setThemeMode,
    toggleTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * Hook для использования темы в компонентах
 * @throws {Error} если используется вне ThemeProvider
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
}

/**
 * Hook для получения только цветов (сокращенный вариант)
 */
export function useColors() {
  const { theme } = useTheme();
  return theme.colors;
}

/**
 * Hook для получения информации о текущей теме (темная/светлая)
 */
export function useIsDark() {
  const { isDark } = useTheme();
  return isDark;
}
