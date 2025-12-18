/**
 * Theme Context - управление темой приложения
 * Предоставляет доступ к текущей теме и функции переключения
 */

import { darkTheme, lightTheme, Theme } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';

// Ключ для сохранения настройки в AsyncStorage
const THEME_STORAGE_KEY = '@app:theme_mode';

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
  const [systemTheme, setSystemTheme] = useState<ColorSchemeName>(Appearance.getColorScheme());

  // Определяем текущую тему на основе режима и системных настроек
  const getActiveTheme = (): Theme => {
    if (themeMode === 'auto') {
      return systemTheme === 'dark' ? darkTheme : lightTheme;
    }
    return themeMode === 'dark' ? darkTheme : lightTheme;
  };

  const theme = getActiveTheme();
  const isDark = theme.isDark;

  // Загружаем сохраненную тему при монтировании
  useEffect(() => {
    loadSavedTheme();
    
    // Подписываемся на изменения системной темы
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemTheme(colorScheme);
    });

    return () => subscription.remove();
  }, []);

  // Загрузка сохраненной темы
  const loadSavedTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'auto')) {
        setThemeModeState(savedTheme);
      }
    } catch (error) {
      console.error('Ошибка загрузки темы:', error);
    }
  };

  // Установка темы
  const setThemeMode = async (mode: ThemeMode) => {
    try {
      setThemeModeState(mode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error('Ошибка сохранения темы:', error);
    }
  };

  // Переключение между светлой и темной темой
  const toggleTheme = async () => {
    const newMode = isDark ? 'light' : 'dark';
    await setThemeMode(newMode);
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
