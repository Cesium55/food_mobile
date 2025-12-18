/**
 * Theme Configuration - Minimal UI Style
 * Цветовая палитра и темы (light/dark)
 */

import { Platform } from 'react-native';

// ===========================
// LIGHT THEME COLORS
// ===========================

const lightColors = {
  // Primary - основной цвет приложения (зеленый для food app)
  primary: {
    50: '#E8F5E9',
    100: '#C8E6C9',
    200: '#A5D6A7',
    300: '#81C784',
    400: '#66BB6A',
    500: '#4CAF50', // main
    600: '#43A047',
    700: '#388E3C',
    800: '#2E7D32',
    900: '#1B5E20',
  },

  // Secondary - дополнительный цвет
  secondary: {
    50: '#F3F4F6',
    100: '#E5E7EB',
    200: '#D1D5DB',
    300: '#9CA3AF',
    400: '#6B7280',
    500: '#4B5563', // main
    600: '#374151',
    700: '#1F2937',
    800: '#111827',
    900: '#030712',
  },

  // Gray - оттенки серого для UI элементов
  gray: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },

  // Success - успешные действия
  success: {
    50: '#E8F5E9',
    100: '#C8E6C9',
    500: '#4CAF50', // main
    600: '#43A047',
    700: '#388E3C',
  },

  // Error - ошибки
  error: {
    50: '#FFEBEE',
    100: '#FFCDD2',
    500: '#F44336', // main
    600: '#E53935',
    700: '#D32F2F',
  },

  // Warning - предупреждения
  warning: {
    50: '#FFF3E0',
    100: '#FFE0B2',
    500: '#FF9800', // main
    600: '#FB8C00',
    700: '#F57C00',
  },

  // Info - информация
  info: {
    50: '#E3F2FD',
    100: '#BBDEFB',
    500: '#2196F3', // main
    600: '#1E88E5',
    700: '#1976D2',
  },

  // Semantic Colors - семантические цвета для UI
  background: {
    default: '#FFFFFF',
    paper: '#FFFFFF',
    neutral: '#F8F9FA',
    subtle: '#FAFAFA',
  },

  surface: {
    default: '#FFFFFF',
    elevated: '#FFFFFF',
    hover: '#F5F5F5',
    pressed: '#EEEEEE',
  },

  text: {
    primary: '#212121',
    secondary: '#616161',
    tertiary: '#9E9E9E',
    disabled: '#BDBDBD',
    inverse: '#FFFFFF',
    link: '#2196F3',
  },

  border: {
    default: '#E0E0E0',
    light: '#EEEEEE',
    medium: '#BDBDBD',
    dark: '#9E9E9E',
    focus: '#4CAF50',
  },

  // Базовые цвета
  common: {
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',
  },

  // Статусные цвета для бейджей, чипов и т.д.
  status: {
    success: {
      main: '#4CAF50',
      bg: '#E8F5E9',
      text: '#2E7D32',
    },
    error: {
      main: '#F44336',
      bg: '#FFEBEE',
      text: '#C62828',
    },
    warning: {
      main: '#FF9800',
      bg: '#FFF3E0',
      text: '#E65100',
    },
    info: {
      main: '#2196F3',
      bg: '#E3F2FD',
      text: '#1565C0',
    },
  },
} as const;

// ===========================
// DARK THEME COLORS
// ===========================

const darkColors = {
  // Primary
  primary: {
    50: '#1B5E20',
    100: '#2E7D32',
    200: '#388E3C',
    300: '#43A047',
    400: '#4CAF50',
    500: '#66BB6A', // main
    600: '#81C784',
    700: '#A5D6A7',
    800: '#C8E6C9',
    900: '#E8F5E9',
  },

  // Secondary
  secondary: {
    50: '#030712',
    100: '#111827',
    200: '#1F2937',
    300: '#374151',
    400: '#4B5563',
    500: '#6B7280', // main
    600: '#9CA3AF',
    700: '#D1D5DB',
    800: '#E5E7EB',
    900: '#F3F4F6',
  },

  // Gray
  gray: {
    50: '#212121',
    100: '#424242',
    200: '#616161',
    300: '#757575',
    400: '#9E9E9E',
    500: '#BDBDBD',
    600: '#E0E0E0',
    700: '#EEEEEE',
    800: '#F5F5F5',
    900: '#FAFAFA',
  },

  // Success
  success: {
    50: '#1B5E20',
    100: '#2E7D32',
    500: '#66BB6A', // main
    600: '#81C784',
    700: '#A5D6A7',
  },

  // Error
  error: {
    50: '#B71C1C',
    100: '#C62828',
    500: '#EF5350', // main
    600: '#E57373',
    700: '#FFCDD2',
  },

  // Warning
  warning: {
    50: '#E65100',
    100: '#F57C00',
    500: '#FFA726', // main
    600: '#FFB74D',
    700: '#FFE0B2',
  },

  // Info
  info: {
    50: '#0D47A1',
    100: '#1565C0',
    500: '#42A5F5', // main
    600: '#64B5F6',
    700: '#BBDEFB',
  },

  // Semantic Colors
  background: {
    default: '#121212',
    paper: '#1E1E1E',
    neutral: '#242424',
    subtle: '#2C2C2C',
  },

  surface: {
    default: '#1E1E1E',
    elevated: '#2C2C2C',
    hover: '#383838',
    pressed: '#424242',
  },

  text: {
    primary: '#FFFFFF',
    secondary: '#B3B3B3',
    tertiary: '#808080',
    disabled: '#666666',
    inverse: '#000000',
    link: '#64B5F6',
  },

  border: {
    default: '#383838',
    light: '#2C2C2C',
    medium: '#4A4A4A',
    dark: '#666666',
    focus: '#66BB6A',
  },

  // Базовые цвета
  common: {
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',
  },

  // Статусные цвета
  status: {
    success: {
      main: '#66BB6A',
      bg: '#1B5E20',
      text: '#A5D6A7',
    },
    error: {
      main: '#EF5350',
      bg: '#B71C1C',
      text: '#FFCDD2',
    },
    warning: {
      main: '#FFA726',
      bg: '#E65100',
      text: '#FFE0B2',
    },
    info: {
      main: '#42A5F5',
      bg: '#0D47A1',
      text: '#BBDEFB',
    },
  },
} as const;

// ===========================
// THEME OBJECTS
// ===========================

export const lightTheme = {
  colors: lightColors,
  isDark: false,
} as const;

export const darkTheme = {
  colors: darkColors,
  isDark: true,
} as const;

// ===========================
// LEGACY EXPORT (для обратной совместимости)
// ===========================

const tintColorLight = lightColors.primary[500];
const tintColorDark = darkColors.primary[500];

export const Colors = {
  light: {
    text: lightColors.text.primary,
    background: lightColors.background.default,
    tint: tintColorLight,
    icon: lightColors.text.secondary,
    tabIconDefault: lightColors.text.secondary,
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: darkColors.text.primary,
    background: darkColors.background.default,
    tint: tintColorDark,
    icon: darkColors.text.secondary,
    tabIconDefault: darkColors.text.secondary,
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'Manrope-Regular',
    serif: 'serif',
    rounded: 'Manrope-Regular',
    mono: 'monospace',
  },
  web: {
    sans: "Manrope, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

// Типы для TypeScript
export type Theme = typeof lightTheme;
export type ThemeColors = typeof lightColors;
export type ColorShade = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
