/**
 * Design Tokens - Minimal UI Style
 * Базовые значения для всей дизайн-системы
 */

// Spacing система - используется для padding, margin, gap
export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  massive: 48,
  giant: 64,
} as const;

// Border Radius - скругления углов
export const borderRadius = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  xxxl: 24,
  full: 9999, // для круглых элементов
} as const;

// Shadows - тени для разных уровней elevation
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
  },
} as const;

// Typography - типографика
export const typography = {
  // Font Family
  fontFamily: {
    regular: 'Manrope-Regular',
    medium: 'Manrope-Medium',
    semibold: 'Manrope-SemiBold',
    bold: 'Manrope-Bold',
  },
  
  // Font Sizes
  fontSize: {
    xs: 10,
    sm: 12,
    md: 14,
    base: 16, // базовый размер
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 28,
    huge: 32,
    massive: 40,
  },
  
  // Line Heights
  lineHeight: {
    xs: 14,
    sm: 16,
    md: 20,
    base: 24,
    lg: 26,
    xl: 28,
    xxl: 32,
    xxxl: 36,
    huge: 40,
    massive: 48,
  },
  
  // Font Weights (для случаев когда нужны числовые значения)
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;

// Layout - размеры и отступы для макета
export const layout = {
  containerMaxWidth: 1200,
  screenPadding: spacing.lg, // 16
  screenPaddingHorizontal: spacing.lg, // 16
  screenPaddingVertical: spacing.xl, // 20
  headerHeight: 56,
  tabBarHeight: 60,
  buttonHeight: {
    sm: 32,
    md: 40,
    lg: 48,
    xl: 56,
  },
  inputHeight: {
    sm: 36,
    md: 44,
    lg: 52,
  },
  iconSize: {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 28,
    xxl: 32,
  },
} as const;

// Z-Index - слои для правильного наложения элементов
export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  overlay: 1200,
  modal: 1300,
  popover: 1400,
  toast: 1500,
  tooltip: 1600,
} as const;

// Opacity - прозрачность
export const opacity = {
  disabled: 0.4,
  subtle: 0.6,
  medium: 0.8,
  full: 1,
} as const;

// Transitions - длительность анимаций
export const transitions = {
  fast: 150,
  normal: 250,
  slow: 350,
  slower: 500,
} as const;

// Экспорт типов для TypeScript
export type Spacing = keyof typeof spacing;
export type BorderRadius = keyof typeof borderRadius;
export type Shadow = keyof typeof shadows;
export type FontFamily = keyof typeof typography.fontFamily;
export type FontSize = keyof typeof typography.fontSize;
export type LineHeight = keyof typeof typography.lineHeight;
